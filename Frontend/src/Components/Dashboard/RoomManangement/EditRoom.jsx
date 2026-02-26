import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const THEME = "#d6c3b3";

const EditRoom = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    roomNumber: "101",
    roomType: "Deluxe Suite",
    floor: "1",
    capacity: "3",
    roomPrice: "5500",
    roomDescription: "Spacious room with premium interior and balcony view.",
    reserveCondition: "Advance payment required before reservation confirmation.",
  });

  const coverImage =
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80";

  const galleryImages = [
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=500&q=80",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Room updated successfully (demo)");
    navigate("/dashboard/room-management/rooms");
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
                Update room details and view existing room images.
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
            {/* Images */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current Cover Image
                </label>
                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-3">
                  <img
                    src={coverImage}
                    alt="Cover"
                    className="w-full h-72 object-cover rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current Gallery
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {galleryImages.map((img, index) => (
                    <div
                      key={index}
                      className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 p-2"
                    >
                      <img
                        src={img}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                name="roomType"
                value={formData.roomType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                name="roomPrice"
                value={formData.roomPrice}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>

            <textarea
              rows={3}
              name="roomDescription"
              value={formData.roomDescription}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200"
            />

            <textarea
              rows={3}
              name="reserveCondition"
              value={formData.reserveCondition}
              onChange={handleChange}
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
                className="w-full sm:w-auto min-w-[170px] py-3 px-6 rounded-xl font-bold transition"
                style={{ backgroundColor: THEME, color: "#111827" }}
              >
                Update Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRoom;