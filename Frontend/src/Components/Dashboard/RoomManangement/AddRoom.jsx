import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const initialFormData = {
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
  roomPrice: "",
  weekendPrice: "",
  bedCharge: "",
  seasonalRate: "Normal",
  discountPercent: "",
  status: "Available",
  isActive: "true",
  roomDescription: "",
  reserveCondition: "",
};

const AddRoom = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);

  const [coverPreview, setCoverPreview] = useState("");
  const [galleryPreview, setGalleryPreview] = useState([]);

  // ✅ cleanup previews
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (galleryPreview?.length) galleryPreview.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ regex
  const roomNumberRegex = /^[A-Za-z0-9-]{1,10}$/;
  const textRegex = /^[A-Za-z0-9\s,&-]{2,50}$/;
  const descriptionRegex = /^.{10,500}$/;

  const clearFieldError = (name) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const validate = () => {
    const newErrors = {};

    const roomNumber = (formData.roomNumber || "").trim();
    const roomType = (formData.roomType || "").trim();
    const roomName = (formData.roomName || "").trim();
    const typeDescription = (formData.typeDescription || "").trim();
    const roomDescription = (formData.roomDescription || "").trim();
    const reserveCondition = (formData.reserveCondition || "").trim();

    if (!roomNumber) newErrors.roomNumber = "Room number is required";
    else if (!roomNumberRegex.test(roomNumber))
      newErrors.roomNumber = "Use letters, numbers or hyphen only";

    if (!roomType) newErrors.roomType = "Room type is required";
    else if (!textRegex.test(roomType)) newErrors.roomType = "Invalid room type";

    if (roomName && !textRegex.test(roomName)) newErrors.roomName = "Invalid room name";

    if (typeDescription && !descriptionRegex.test(typeDescription))
      newErrors.typeDescription = "Type description must be at least 10 characters";

    if (formData.floor === "" || formData.floor === null || formData.floor === undefined)
      newErrors.floor = "Floor is required";
    else if (Number(formData.floor) < 0) newErrors.floor = "Invalid floor";

    if (!formData.capacity) newErrors.capacity = "Capacity is required";
    else if (Number(formData.capacity) < 1) newErrors.capacity = "Capacity must be at least 1";

    if (!formData.bedNumber) newErrors.bedNumber = "Bed number is required";
    else if (Number(formData.bedNumber) < 1)
      newErrors.bedNumber = "Bed number must be at least 1";

    if (!formData.bedType) newErrors.bedType = "Bed type is required";
    if (!formData.roomSize) newErrors.roomSize = "Room size is required";

    if (!formData.roomPrice) newErrors.roomPrice = "Base price is required";
    else if (Number(formData.roomPrice) <= 0)
      newErrors.roomPrice = "Base price must be greater than 0";

    if (formData.weekendPrice && Number(formData.weekendPrice) < 0)
      newErrors.weekendPrice = "Weekend price cannot be negative";

    if (formData.bedCharge && Number(formData.bedCharge) < 0)
      newErrors.bedCharge = "Extra bed charge cannot be negative";

    if (
      formData.discountPercent &&
      (Number(formData.discountPercent) < 0 || Number(formData.discountPercent) > 100)
    ) {
      newErrors.discountPercent = "Discount must be between 0 and 100";
    }

    if (!roomDescription) newErrors.roomDescription = "Room description is required";
    else if (!descriptionRegex.test(roomDescription))
      newErrors.roomDescription = "Minimum 10 characters required";

    if (!reserveCondition) newErrors.reserveCondition = "Reserve condition is required";
    else if (!descriptionRegex.test(reserveCondition))
      newErrors.reserveCondition = "Minimum 10 characters required";

    if (!coverImage) newErrors.coverImage = "Cover image is required";
    else if (!coverImage.type?.startsWith("image/"))
      newErrors.coverImage = "Only image files are allowed";

    if (galleryImages.length > 5) newErrors.galleryImages = "Max 5 gallery images allowed";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleCoverImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (coverPreview) URL.revokeObjectURL(coverPreview);

    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    clearFieldError("coverImage");
  };

  const handleGalleryImages = (e) => {
    const files = Array.from(e.target.files || []);
    const onlyImages = files.filter((f) => f.type?.startsWith("image/"));
    const limited = onlyImages.slice(0, 5);

    if (galleryPreview?.length) galleryPreview.forEach((u) => URL.revokeObjectURL(u));

    setGalleryImages(limited);
    setGalleryPreview(limited.map((file) => URL.createObjectURL(file)));
    clearFieldError("galleryImages");
  };

  const handleClear = () => {
    setFormData(initialFormData);
    setErrors({});

    setCoverImage(null);
    setGalleryImages([]);

    if (coverPreview) URL.revokeObjectURL(coverPreview);
    if (galleryPreview?.length) galleryPreview.forEach((u) => URL.revokeObjectURL(u));

    setCoverPreview("");
    setGalleryPreview([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();

      // ✅ amenities JSON string (controller parses JSON)
      const amenitiesArray = (formData.amenities || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      payload.append("roomNumber", (formData.roomNumber || "").trim());
      payload.append("roomName", (formData.roomName || "").trim());
      payload.append("roomType", (formData.roomType || "").trim());
      payload.append("typeDescription", (formData.typeDescription || "").trim());
      payload.append("amenities", JSON.stringify(amenitiesArray));

      payload.append("floor", String(Number(formData.floor)));
      payload.append("capacity", String(Number(formData.capacity)));
      payload.append("extraCapability", (formData.extraCapability || "").trim());
      payload.append("bedNumber", String(Number(formData.bedNumber)));
      payload.append("bedType", formData.bedType);
      payload.append("roomSize", formData.roomSize);

      // ✅ exact keys backend expects
      payload.append("basePrice", String(Number(formData.roomPrice)));
      payload.append("weekendPrice", String(Number(formData.weekendPrice || 0)));
      payload.append("extraBedCharge", String(Number(formData.bedCharge || 0)));
      payload.append("seasonalRate", formData.seasonalRate || "Normal");
      payload.append("discountPercent", String(Number(formData.discountPercent || 0)));

      payload.append("status", formData.status || "Available");
      payload.append("isActive", formData.isActive); // "true"/"false"

      payload.append("roomDescription", (formData.roomDescription || "").trim());
      payload.append("reserveCondition", (formData.reserveCondition || "").trim());

      // ✅ file keys must match multer fields
      payload.append("coverImage", coverImage);
      galleryImages.slice(0, 5).forEach((file) => payload.append("galleryImages", file));

      // ✅ DO NOT set Content-Type manually; axios sets boundary correctly
      const { data } = await api.post("/room/createroom", payload);

      toast.success(data?.message || "Room created successfully");
      navigate("/dashboard/room-management/rooms");
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      console.log("ROOM CREATE ERROR STATUS:", status);
      console.log("ROOM CREATE ERROR DATA:", data);
      console.log("ROOM CREATE ERROR FULL:", error);

      toast.error(
        data?.message ||
          data?.error ||
          data?.msg ||
          (typeof data === "string" ? data : "") ||
          error.message ||
          "Room creation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition ${
      errors[field]
        ? "border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:ring-2 focus:ring-[#1e266d]/10"
    }`;

  const errorText = (field) =>
    errors[field] ? (
      <p className="text-xs text-red-500 mt-2 font-semibold">{errors[field]}</p>
    ) : null;

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-gray-50">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-7 lg:p-8">
          <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e266d]">
                Add Room
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Create a room with pricing, images and room details.
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cover Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImage}
                  className={inputClass("coverImage")}
                />
                {errorText("coverImage")}

                {coverPreview && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-3">
                    <img
                      src={coverPreview}
                      alt="Cover Preview"
                      className="w-full h-72 object-cover rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gallery Images (max 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImages}
                  className={`w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition ${
                    errors.galleryImages
                      ? "border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:ring-2 focus:ring-[#1e266d]/10"
                  }`}
                />
                {errorText("galleryImages")}

                {galleryPreview.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryPreview.map((img, index) => (
                      <div
                        key={index}
                        className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2"
                      >
                        <img
                          src={img}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-28 object-cover rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Number *
                </label>
                <input
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g. 101"
                  className={inputClass("roomNumber")}
                />
                {errorText("roomNumber")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  name="roomName"
                  value={formData.roomName}
                  onChange={handleChange}
                  placeholder="e.g. Premium Deluxe 101"
                  className={inputClass("roomName")}
                />
                {errorText("roomName")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Type *
                </label>
                <input
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleChange}
                  placeholder="e.g. Deluxe Suite"
                  className={inputClass("roomType")}
                />
                {errorText("roomType")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Floor *
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  className={inputClass("floor")}
                />
                {errorText("floor")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={inputClass("capacity")}
                />
                {errorText("capacity")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Extra Capability
                </label>
                <input
                  name="extraCapability"
                  value={formData.extraCapability}
                  onChange={handleChange}
                  placeholder="e.g. Extra Bed Allowed"
                  className={inputClass("extraCapability")}
                />
                {errorText("extraCapability")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bed Number *
                </label>
                <input
                  type="number"
                  name="bedNumber"
                  value={formData.bedNumber}
                  onChange={handleChange}
                  className={inputClass("bedNumber")}
                />
                {errorText("bedNumber")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bed Type *
                </label>
                <select
                  name="bedType"
                  value={formData.bedType}
                  onChange={handleChange}
                  className={inputClass("bedType")}
                >
                  <option value="">Select Bed Type</option>
                  <option value="Single">Single</option>
                  <option value="Double">Double</option>
                  <option value="Standard Queen">Standard Queen</option>
                  <option value="Luxury King">Luxury King</option>
                  <option value="Standard Twin">Standard Twin</option>
                </select>
                {errorText("bedType")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Size *
                </label>
                <select
                  name="roomSize"
                  value={formData.roomSize}
                  onChange={handleChange}
                  className={inputClass("roomSize")}
                >
                  <option value="">Select Room Size</option>
                  <option value="Small">Small</option>
                  <option value="Queen">Queen</option>
                  <option value="King">King</option>
                  <option value="Twin">Twin</option>
                </select>
                {errorText("roomSize")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Base Price *
                </label>
                <input
                  type="number"
                  name="roomPrice"
                  value={formData.roomPrice}
                  onChange={handleChange}
                  className={inputClass("roomPrice")}
                />
                {errorText("roomPrice")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weekend Price
                </label>
                <input
                  type="number"
                  name="weekendPrice"
                  value={formData.weekendPrice}
                  onChange={handleChange}
                  className={inputClass("weekendPrice")}
                />
                {errorText("weekendPrice")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Extra Bed Charge
                </label>
                <input
                  type="number"
                  name="bedCharge"
                  value={formData.bedCharge}
                  onChange={handleChange}
                  className={inputClass("bedCharge")}
                />
                {errorText("bedCharge")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Seasonal Rate
                </label>
                <select
                  name="seasonalRate"
                  value={formData.seasonalRate}
                  onChange={handleChange}
                  className={inputClass("seasonalRate")}
                >
                  <option value="Normal">Normal</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Premium">Premium</option>
                  <option value="Off-Season">Off-Season</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Discount %
                </label>
                <input
                  type="number"
                  name="discountPercent"
                  value={formData.discountPercent}
                  onChange={handleChange}
                  className={inputClass("discountPercent")}
                />
                {errorText("discountPercent")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClass("status")}
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State
                </label>
                <select
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleChange}
                  className={inputClass("isActive")}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type Description
              </label>
              <textarea
                rows={3}
                name="typeDescription"
                value={formData.typeDescription}
                onChange={handleChange}
                className={inputClass("typeDescription")}
              />
              {errorText("typeDescription")}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amenities (comma separated)
              </label>
              <input
                name="amenities"
                value={formData.amenities}
                onChange={handleChange}
                placeholder="WiFi, AC, TV, Mini Bar"
                className={inputClass("amenities")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Description *
              </label>
              <textarea
                rows={3}
                name="roomDescription"
                value={formData.roomDescription}
                onChange={handleChange}
                className={inputClass("roomDescription")}
              />
              {errorText("roomDescription")}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reserve Condition *
              </label>
              <textarea
                rows={3}
                name="reserveCondition"
                value={formData.reserveCondition}
                onChange={handleChange}
                className={inputClass("reserveCondition")}
              />
              {errorText("reserveCondition")}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleClear}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[170px] py-3 px-6 rounded-xl font-bold transition disabled:opacity-60"
                style={{ backgroundColor: THEME, color: "#111827" }}
              >
                {loading ? "Saving..." : "Save Room"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRoom;