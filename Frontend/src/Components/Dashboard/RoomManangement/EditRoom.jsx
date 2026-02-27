import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const initialForm = {
  roomNumber: "",
  roomName: "",
  roomType: "",
  typeDescription: "",
  amenities: "",

  floor: "",
  capacity: "",
  extraCapability: "",
  bedNumber: "",
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
      if (newGalleryPreview?.length)
        newGalleryPreview.forEach((u) => URL.revokeObjectURL(u));
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
      roomType: room?.roomType || "",
      typeDescription: room?.typeDescription || "",
      amenities: normalizeAmenities(room?.amenities),

      floor: room?.floor?.toString?.() || "",
      capacity: room?.capacity?.toString?.() || "",
      extraCapability: room?.extraCapability || "",
      bedNumber: room?.bedNumber?.toString?.() || "",
      bedType: room?.bedType || "",
      roomSize: room?.roomSize || "",

      roomPrice: room?.pricing?.basePrice?.toString?.() || "",
      weekendPrice: room?.pricing?.weekendPrice?.toString?.() || "",
      bedCharge: room?.pricing?.extraBedCharge?.toString?.() || "",
      seasonalRate: room?.pricing?.seasonalRate || "Normal",
      discountPercent: room?.pricing?.discountPercent?.toString?.() || "",

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

      // ✅ new cover -> backend replaces cover
      if (newCover) payload.append("coverImage", newCover);

      // ✅ new gallery -> REPLACE old gallery in DB
      if (newGallery.length > 0) {
        payload.append("replaceGallery", "true"); // ⭐ IMPORTANT LINE
        newGallery.slice(0, 5).forEach((f) => payload.append("galleryImages", f));
      }

      // ✅ do not set Content-Type manually
      const { data } = await api.put(`/room/updateroom/${id}`, payload);

      toast.success(data?.message || "Room updated successfully");

      // refresh UI from DB
      await fetchRoom();

      // clear selected
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

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-7 lg:p-8">
          <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e266d]">
                Edit Room #{id}
              </h1>
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

          {loading && (
            <div className="mb-4 text-sm font-semibold text-gray-600">Loading...</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current Cover
                </label>
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-3">
                  {currentCover ? (
                    <img
                      src={currentCover}
                      alt="Cover"
                      className="w-full h-72 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="h-72 flex items-center justify-center text-gray-500">
                      No cover image
                    </div>
                  )}
                </div>

                <label className="block text-sm font-semibold text-gray-700 mt-5 mb-2">
                  Upload New Cover (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewCover}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
                />
                {newCoverPreview && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-3">
                    <img
                      src={newCoverPreview}
                      alt="New Cover Preview"
                      className="w-full h-56 object-cover rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current Gallery
                </label>
                {currentGallery.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {currentGallery.map((img, idx) => (
                      <div
                        key={img.public_id || idx}
                        className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2"
                      >
                        <img
                          src={img.url}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No gallery images</div>
                )}

                <label className="block text-sm font-semibold text-gray-700 mt-5 mb-2">
                  Upload New Gallery (max 5) — this will REPLACE old gallery
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleNewGallery}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
                />

                {newGalleryPreview.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {newGalleryPreview.map((img, index) => (
                      <div
                        key={index}
                        className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2"
                      >
                        <img
                          src={img}
                          alt={`New Gallery ${index + 1}`}
                          className="w-full h-32 object-cover rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Minimal fields (you can add all like AddRoom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <input
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                placeholder="Room Number"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                placeholder="Room Type"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                name="roomPrice"
                value={formData.roomPrice}
                onChange={handleChange}
                placeholder="Base Price"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <input
              name="amenities"
              value={formData.amenities}
              onChange={handleChange}
              placeholder="Amenities (comma separated)"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
            />

            <textarea
              rows={3}
              name="roomDescription"
              value={formData.roomDescription}
              onChange={handleChange}
              placeholder="Room Description"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
            />

            <textarea
              rows={3}
              name="reserveCondition"
              value={formData.reserveCondition}
              onChange={handleChange}
              placeholder="Reserve Condition"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
            />

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