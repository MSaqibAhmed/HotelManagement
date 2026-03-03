import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

// ✅ enum values (same as backend)
const ROOM_TYPES = ["Standard", "Deluxe", "Executive", "Family"];

const initialForm = {
  roomNumber: "",
  roomName: "",
  roomType: "",
  typeDescription: "",
  amenities: "",

  floor: "",
  capacity: "",
  extraCapability: "",
  bedNumber: "", // ✅ will show label "Beds"
  bedType: "",
  roomSize: "",

  roomPrice: "", // -> basePrice
  weekendPrice: "",
  bedCharge: "", // -> extraBedCharge
  seasonalRate: "Normal",
  discountPercent: "",

  status: "Available",
  isActive: "true",

  roomDescription: "",
  reserveCondition: "",
};

const normalizeAmenities = (amenities) => {
  if (Array.isArray(amenities)) {
    return amenities
      .map((a) => String(a).replace(/\r?\n/g, "").trim())
      .filter(Boolean)
      .join(", ");
  }

  if (typeof amenities === "string") {
    try {
      const parsed = JSON.parse(amenities);
      if (Array.isArray(parsed)) {
        return parsed
          .map((a) => String(a).replace(/\r?\n/g, "").trim())
          .filter(Boolean)
          .join(", ");
      }
    } catch {}

    return amenities
      .split(",")
      .map((a) => a.replace(/\r?\n/g, "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return "";
};

const EditRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  // current images from DB
  const [currentCover, setCurrentCover] = useState("");
  const [currentGallery, setCurrentGallery] = useState([]);

  // new uploads
  const [newCover, setNewCover] = useState(null);
  const [newGallery, setNewGallery] = useState([]);

  // previews
  const [newCoverPreview, setNewCoverPreview] = useState("");
  const [newGalleryPreview, setNewGalleryPreview] = useState([]);

  // cleanup previews
  useEffect(() => {
    return () => {
      if (newCoverPreview) URL.revokeObjectURL(newCoverPreview);
      if (newGalleryPreview?.length) newGalleryPreview.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [newCoverPreview, newGalleryPreview]);

  const fetchRoom = async () => {
    const { data } = await api.get(`/room/getsingleroom/${id}`);
    const room = data?.room || data;

    setCurrentCover(room?.coverImage?.url || "");
    setCurrentGallery(Array.isArray(room?.galleryImages) ? room.galleryImages : []);

    setFormData({
      roomNumber: room?.roomNumber || "",
      roomName: room?.roomName || "",
      roomType: ROOM_TYPES.includes(room?.roomType) ? room.roomType : "",
      typeDescription: room?.typeDescription || "",
      amenities: normalizeAmenities(room?.amenities),

      floor: room?.floor !== undefined && room?.floor !== null ? String(room.floor) : "",
      capacity: room?.capacity !== undefined && room?.capacity !== null ? String(room.capacity) : "",
      extraCapability: room?.extraCapability || "",
      bedNumber: room?.bedNumber !== undefined && room?.bedNumber !== null ? String(room.bedNumber) : "",
      bedType: room?.bedType || "",
      roomSize: room?.roomSize || "",

      roomPrice:
        room?.pricing?.basePrice !== undefined && room?.pricing?.basePrice !== null
          ? String(room.pricing.basePrice)
          : "",
      weekendPrice:
        room?.pricing?.weekendPrice !== undefined && room?.pricing?.weekendPrice !== null
          ? String(room.pricing.weekendPrice)
          : "",
      bedCharge:
        room?.pricing?.extraBedCharge !== undefined && room?.pricing?.extraBedCharge !== null
          ? String(room.pricing.extraBedCharge)
          : "",
      seasonalRate: room?.pricing?.seasonalRate || "Normal",
      discountPercent:
        room?.pricing?.discountPercent !== undefined && room?.pricing?.discountPercent !== null
          ? String(room.pricing.discountPercent)
          : "",

      status: room?.status || "Available",
      isActive: room?.isActive ? "true" : "false",

      roomDescription: room?.roomDescription || "",
      reserveCondition: room?.reserveCondition || "",
    });
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await fetchRoom();
      } catch (err) {
        console.log("FETCH ROOM ERROR:", err?.response || err);
        toast.error(err?.response?.data?.message || "Failed to load room");
        navigate("/dashboard/room-management/rooms");
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ discount clamp 0-100
    if (name === "discountPercent") {
      if (value === "") return setFormData((p) => ({ ...p, discountPercent: "" }));

      let num = Number(value);
      if (Number.isNaN(num)) num = 0;
      if (num < 0) num = 0;
      if (num > 100) num = 100;

      return setFormData((p) => ({ ...p, discountPercent: String(num) }));
    }

    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleNewCover = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) return toast.error("Only image files are allowed");

    if (newCoverPreview) URL.revokeObjectURL(newCoverPreview);
    setNewCover(file);
    setNewCoverPreview(URL.createObjectURL(file));
  };

  const handleNewGallery = (e) => {
    const files = Array.from(e.target.files || []);
    const onlyImages = files.filter((f) => f.type?.startsWith("image/")).slice(0, 5);

    if (newGalleryPreview?.length) newGalleryPreview.forEach((u) => URL.revokeObjectURL(u));
    setNewGallery(onlyImages);
    setNewGalleryPreview(onlyImages.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = new FormData();

      const amenitiesArray = (formData.amenities || "")
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      payload.append("roomNumber", (formData.roomNumber || "").trim());
      payload.append("roomName", (formData.roomName || "").trim());
      payload.append("roomType", (formData.roomType || "").trim());
      payload.append("typeDescription", (formData.typeDescription || "").trim());
      payload.append("amenities", JSON.stringify(amenitiesArray));

      payload.append("floor", String(Number(formData.floor || 0)));
      payload.append("capacity", String(Number(formData.capacity || 0)));
      payload.append("extraCapability", (formData.extraCapability || "").trim());
      payload.append("bedNumber", String(Number(formData.bedNumber || 0)));
      payload.append("bedType", formData.bedType || "");
      payload.append("roomSize", formData.roomSize || "");

      payload.append("basePrice", String(Number(formData.roomPrice || 0)));
      payload.append("weekendPrice", String(Number(formData.weekendPrice || 0)));
      payload.append("extraBedCharge", String(Number(formData.bedCharge || 0)));
      payload.append("seasonalRate", formData.seasonalRate || "Normal");
      payload.append("discountPercent", String(Number(formData.discountPercent || 0)));

      payload.append("status", formData.status || "Available");
      payload.append("isActive", formData.isActive);

      payload.append("roomDescription", (formData.roomDescription || "").trim());
      payload.append("reserveCondition", (formData.reserveCondition || "").trim());

      if (newCover) payload.append("coverImage", newCover);

      if (newGallery.length > 0) {
        payload.append("replaceGallery", "true");
        newGallery.forEach((f) => payload.append("galleryImages", f));
      }

      const { data } = await api.put(`/room/updateroom/${id}`, payload);

      toast.success(data?.message || "Room updated successfully");

      await fetchRoom();

      setNewCover(null);
      if (newCoverPreview) URL.revokeObjectURL(newCoverPreview);
      setNewCoverPreview("");

      setNewGallery([]);
      if (newGalleryPreview?.length) newGalleryPreview.forEach((u) => URL.revokeObjectURL(u));
      setNewGalleryPreview([]);

      navigate("/dashboard/room-management/rooms");
    } catch (err) {
      console.log("UPDATE ERROR:", err?.response || err);
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Room update failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none";

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-7 lg:p-8">
          <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e266d]">Edit Room #{id}</h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Upload new gallery to replace old images in DB.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/room-management/rooms")}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
          </div>

          {loading && <div className="mb-4 text-sm font-semibold text-gray-600">Loading...</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Current Cover</label>
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-3">
                  {currentCover ? (
                    <img src={currentCover} alt="Cover" className="w-full h-72 object-cover rounded-xl" />
                  ) : (
                    <div className="h-72 flex items-center justify-center text-gray-500">No cover image</div>
                  )}
                </div>

                <label className={`${labelClass} mt-5`}>Upload New Cover (optional)</label>
                <input type="file" accept="image/*" onChange={handleNewCover} className={inputClass} />

                {newCoverPreview && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-3">
                    <img src={newCoverPreview} alt="New Cover Preview" className="w-full h-56 object-cover rounded-xl" />
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>Current Gallery</label>
                {currentGallery.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentGallery.map((img, idx) => (
                      <div
                        key={img.public_id || idx}
                        className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2"
                      >
                        <img src={img.url} alt={`Gallery ${idx + 1}`} className="w-full h-32 object-cover rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No gallery images</div>
                )}

                <label className={`${labelClass} mt-5`}>
                  Upload New Gallery (max 5) — this will REPLACE old gallery
                </label>
                <input type="file" accept="image/*" multiple onChange={handleNewGallery} className={inputClass} />

                {newGalleryPreview.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {newGalleryPreview.map((img, index) => (
                      <div
                        key={index}
                        className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2"
                      >
                        <img src={img} alt={`New Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Room Number</label>
                <input
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="Room Number"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Room Name</label>
                <input
                  name="roomName"
                  value={formData.roomName}
                  onChange={handleChange}
                  placeholder="Room Name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Room Type</label>
                <select name="roomType" value={formData.roomType} onChange={handleChange} className={inputClass}>
                  <option value="">Select Room Type</option>
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Floor</label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="Floor"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Capacity"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Extra Capability</label>
                <input
                  name="extraCapability"
                  value={formData.extraCapability}
                  onChange={handleChange}
                  placeholder="Extra Capability"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Beds</label>
                <input
                  type="number"
                  name="bedNumber"
                  value={formData.bedNumber}
                  onChange={handleChange}
                  placeholder="Beds"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Bed Type</label>
                <select name="bedType" value={formData.bedType} onChange={handleChange} className={inputClass}>
                  <option value="">Select Bed Type</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Standard Queen">Standard Queen</option>
                  <option value="Luxury King">Luxury King</option>
                  <option value="Standard Twin">Standard Twin</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Room Size</label>
                <select name="roomSize" value={formData.roomSize} onChange={handleChange} className={inputClass}>
                  <option value="">Select Room Size</option>
                  <option value="Small">Small</option>
                  <option value="Queen">Queen</option>
                  <option value="King">King</option>
                  <option value="Twin">Twin</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Base Price</label>
                <input
                  type="number"
                  name="roomPrice"
                  value={formData.roomPrice}
                  onChange={handleChange}
                  placeholder="Base Price"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Weekend Price</label>
                <input
                  type="number"
                  name="weekendPrice"
                  value={formData.weekendPrice}
                  onChange={handleChange}
                  placeholder="Weekend Price"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Extra Bed Charge</label>
                <input
                  type="number"
                  name="bedCharge"
                  value={formData.bedCharge}
                  onChange={handleChange}
                  placeholder="Extra Bed Charge"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Seasonal Rate</label>
                <select name="seasonalRate" value={formData.seasonalRate} onChange={handleChange} className={inputClass}>
                  <option value="Normal">Normal</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Premium">Premium</option>
                  <option value="Off-Season">Off-Season</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Discount %</label>
                <input
                  type="number"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  placeholder="Discount %"
                  min={0}
                  max={100}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>State</label>
                <select name="isActive" value={formData.isActive} onChange={handleChange} className={inputClass}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Type Description</label>
              <textarea
                rows={3}
                name="typeDescription"
                value={formData.typeDescription}
                onChange={handleChange}
                placeholder="Type Description"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Amenities (comma separated)</label>
              <input
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                placeholder="WiFi, AC, TV, Mini Bar"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Room Description</label>
              <textarea
                rows={3}
                name="roomDescription"
                value={formData.roomDescription}
                onChange={handleChange}
                placeholder="Room Description"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Reserve Condition</label>
              <textarea
                rows={3}
                name="reserveCondition"
                value={formData.reserveCondition}
                onChange={handleChange}
                placeholder="Reserve Condition"
                className={inputClass}
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/dashboard/room-management/rooms")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[170px] py-3 px-6 rounded-xl font-bold transition disabled:opacity-60"
                style={{ backgroundColor: THEME, color: "#111827" }}
              >
                {loading ? "Updating..." : "Update Room"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRoom;