import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const THEME = "#d6c3b3";

const AddRoom = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    roomType: "",
    capacity: "",
    extraCapability: "",
    roomPrice: "",
    bedCharge: "",
    roomSize: "",
    bedNumber: "",
    bedType: "",
    roomDescription: "",
    reserveCondition: "",
  });

  const [errors, setErrors] = useState({});

  // ✅ Better validation (required + numeric + min lengths)
  const validate = () => {
    const newErrors = {};

    const roomType = (formData.roomType || "").trim();
    const extraCapability = (formData.extraCapability || "").trim();
    const roomDescription = (formData.roomDescription || "").trim();
    const reserveCondition = (formData.reserveCondition || "").trim();

    const capacity = Number(formData.capacity);
    const roomPrice = Number(formData.roomPrice);
    const bedCharge = Number(formData.bedCharge);
    const bedNumber = Number(formData.bedNumber);

    // Room Type
    if (!roomType) newErrors.roomType = "Room Type is required";
    else if (roomType.length < 3) newErrors.roomType = "Room Type must be at least 3 characters";

    // Capacity
    if (formData.capacity === "" || formData.capacity === null)
      newErrors.capacity = "Capacity is required";
    else if (!Number.isFinite(capacity) || capacity <= 0)
      newErrors.capacity = "Capacity must be greater than 0";

    // Extra Capability
    if (!extraCapability) newErrors.extraCapability = "Extra Capability is required";
    else if (extraCapability.length < 2) newErrors.extraCapability = "Extra Capability is too short";

    // Room Price
    if (formData.roomPrice === "" || formData.roomPrice === null)
      newErrors.roomPrice = "Room Price is required";
    else if (!Number.isFinite(roomPrice) || roomPrice <= 0)
      newErrors.roomPrice = "Room Price must be greater than 0";

    // Bed Charge
    if (formData.bedCharge === "" || formData.bedCharge === null)
      newErrors.bedCharge = "Bed Charge is required";
    else if (!Number.isFinite(bedCharge) || bedCharge < 0)
      newErrors.bedCharge = "Bed Charge cannot be negative";

    // Room Size
    if (!formData.roomSize) newErrors.roomSize = "Room Size is required";

    // Bed Number
    if (formData.bedNumber === "" || formData.bedNumber === null)
      newErrors.bedNumber = "Bed Number is required";
    else if (!Number.isFinite(bedNumber) || bedNumber <= 0)
      newErrors.bedNumber = "Bed Number must be greater than 0";

    // Bed Type
    if (!formData.bedType) newErrors.bedType = "Bed Type is required";

    // Room Description
    if (!roomDescription) newErrors.roomDescription = "Room Description is required";
    else if (roomDescription.length < 10)
      newErrors.roomDescription = "Room Description must be at least 10 characters";

    // Reserve Condition
    if (!reserveCondition) newErrors.reserveCondition = "Reserve Condition is required";
    else if (reserveCondition.length < 5)
      newErrors.reserveCondition = "Reserve Condition must be at least 5 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Change handler + remove error of that field
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields!");
      return;
    }

    console.log("Room Data:", formData);
    toast.success("Room saved successfully (demo)");

    navigate("/dashboard/room-management/room-inventory");
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl bg-gray-50 border outline-none transition
     ${errors[field] ? "border-red-500 focus:ring-2 focus:ring-red-100" : "border-gray-200 focus:ring-2 focus:ring-[#1e266d]/10"}
    `;

  const errorText = (field) =>
    errors[field] ? <p className="text-xs text-red-500 mt-2 font-semibold">{errors[field]}</p> : null;

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-gray-50">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-7 lg:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e266d]">
                Add Room
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Enter room details to create a new room.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/room-management/room-inventory")}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Type *
              </label>
              <input
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                type="text"
                placeholder="e.g. Deluxe Suite"
                className={inputClass("roomType")}
              />
              {errorText("roomType")}
            </div>

            {/* Capacity + Extra Capability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  placeholder="e.g. 3"
                  className={inputClass("capacity")}
                />
                {errorText("capacity")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Extra Capability *
                </label>
                <input
                  name="extraCapability"
                  value={formData.extraCapability}
                  onChange={handleChange}
                  type="text"
                  placeholder="e.g. Extra Bed"
                  className={inputClass("extraCapability")}
                />
                {errorText("extraCapability")}
              </div>
            </div>

            {/* Room Price + Bed Charge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Price *
                </label>
                <input
                  name="roomPrice"
                  value={formData.roomPrice}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  placeholder="e.g. 4500"
                  className={inputClass("roomPrice")}
                />
                {errorText("roomPrice")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bed Charge *
                </label>
                <input
                  name="bedCharge"
                  value={formData.bedCharge}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  placeholder="e.g. 150"
                  className={inputClass("bedCharge")}
                />
                {errorText("bedCharge")}
              </div>
            </div>

            {/* Room Size + Bed Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
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
                  <option value="">Choose Room Size</option>
                  <option value="Small">Small</option>
                  <option value="Queen">Queen</option>
                  <option value="King">King</option>
                </select>
                {errorText("roomSize")}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bed Number *
                </label>
                <input
                  name="bedNumber"
                  value={formData.bedNumber}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  placeholder="e.g. 2"
                  className={inputClass("bedNumber")}
                />
                {errorText("bedNumber")}
              </div>
            </div>

            {/* Bed Type */}
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
                <option value="">Choose Bed Type</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Standard Queen">Standard Queen</option>
                <option value="Luxury King">Luxury King</option>
              </select>
              {errorText("bedType")}
            </div>

            {/* Room Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Room Description *
              </label>
              <textarea
                name="roomDescription"
                value={formData.roomDescription}
                onChange={handleChange}
                rows={3}
                placeholder="Enter room details..."
                className={inputClass("roomDescription")}
              />
              {errorText("roomDescription")}
            </div>

            {/* Reserve Condition */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reserve Condition *
              </label>
              <textarea
                name="reserveCondition"
                value={formData.reserveCondition}
                onChange={handleChange}
                rows={3}
                placeholder="Enter reserve conditions..."
                className={inputClass("reserveCondition")}
              />
              {errorText("reserveCondition")}
            </div>

            {/* Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    roomType: "",
                    capacity: "",
                    extraCapability: "",
                    roomPrice: "",
                    bedCharge: "",
                    roomSize: "",
                    bedNumber: "",
                    bedType: "",
                    roomDescription: "",
                    reserveCondition: "",
                  });
                  setErrors({});
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Clear
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto min-w-[170px] py-3 px-6 rounded-xl font-bold transition"
                style={{ backgroundColor: THEME, color: "#111827" }}
              >
                Save Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddRoom;