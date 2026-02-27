import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const CreateReservation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    roomType: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    specialRequest: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateRequired = () => {
    const newErrors = {};
    if (!formData.guestName.trim()) newErrors.guestName = "Guest Name is required";
    if (!formData.guestEmail.trim()) newErrors.guestEmail = "Email is required";
    if (!formData.guestPhone.trim()) newErrors.guestPhone = "Phone is required";
    if (!formData.roomType) newErrors.roomType = "Room Type is required";
    if (!formData.checkIn) newErrors.checkIn = "Check-in date is required";
    if (!formData.checkOut) newErrors.checkOut = "Check-out date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const nameRegex = /^[A-Za-z\s]{3,}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    if (!nameRegex.test(formData.guestName.trim())) {
      toast.error("Name must be at least 3 letters");
      return false;
    }
    if (!emailRegex.test(formData.guestEmail.trim())) {
      toast.error("Email must be @gmail.com");
      return false;
    }
    if (!phoneRegex.test(formData.guestPhone.trim())) {
      toast.error("Phone must be 10-15 digits");
      return false;
    }

    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    if (end <= start) {
      toast.error("Check-out must be after check-in");
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateRequired()) return;
    if (!validateForm()) return;

    setLoading(true);

    setTimeout(() => {
      toast.success("Reservation created successfully (Dummy)");
      navigate("/dashboard/reservations");
      setLoading(false);
    }, 500);
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none transition ${errors[field] ? "border-red-500" : "border-gray-200"
    }`;

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-gray-50">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-7 lg:p-8">
          <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e266d]">Create New Reservation</h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">Fill in guest details and booking information</p>
            </div>
            <button type="button" onClick={() => navigate("/dashboard/reservations")} className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition">Back</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full" style={{ backgroundColor: THEME }}></span>
                Guest Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input type="text" name="guestName" value={formData.guestName} onChange={handleChange} placeholder="Enter guest full name" className={inputClass("guestName")} />
                  {errors.guestName && <p className="text-red-500 text-xs font-semibold mt-2">{errors.guestName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input type="email" name="guestEmail" value={formData.guestEmail} onChange={handleChange} placeholder="guest@gmail.com" className={inputClass("guestEmail")} />
                  {errors.guestEmail && <p className="text-red-500 text-xs font-semibold mt-2">{errors.guestEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input type="tel" name="guestPhone" value={formData.guestPhone} onChange={handleChange} placeholder="Enter phone number" className={inputClass("guestPhone")} />
                  {errors.guestPhone && <p className="text-red-500 text-xs font-semibold mt-2">{errors.guestPhone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Guests</label>
                  <input type="number" name="guests" value={formData.guests} onChange={handleChange} min="1" max="10" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full" style={{ backgroundColor: THEME }}></span>
                Room Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type *</label>
                  <select name="roomType" value={formData.roomType} onChange={handleChange} className={inputClass("roomType")}>
                    <option value="">Select Room Type</option>
                    <option value="Standard Room">Standard Room</option>
                    <option value="Deluxe Room">Deluxe Room</option>
                    <option value="Deluxe Suite">Deluxe Suite</option>
                    <option value="King Suite">King Suite</option>
                    <option value="Family Room">Family Room</option>
                    <option value="Presidential Suite">Presidential Suite</option>
                  </select>
                  {errors.roomType && <p className="text-red-500 text-xs font-semibold mt-2">{errors.roomType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
                  <input type="text" name="roomId" value={formData.roomId} onChange={handleChange} placeholder="Auto-selected" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date *</label>
                  <input type="date" name="checkIn" value={formData.checkIn} onChange={handleChange} min={new Date().toISOString().split("T")[0]} className={inputClass("checkIn")} />
                  {errors.checkIn && <p className="text-red-500 text-xs font-semibold mt-2">{errors.checkIn}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date *</label>
                  <input type="date" name="checkOut" value={formData.checkOut} onChange={handleChange} min={formData.checkIn || new Date().toISOString().split("T")[0]} className={inputClass("checkOut")} />
                  {errors.checkOut && <p className="text-red-500 text-xs font-semibold mt-2">{errors.checkOut}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full" style={{ backgroundColor: THEME }}></span>
                Special Requests
              </h3>
              <textarea name="specialRequest" value={formData.specialRequest} onChange={handleChange} rows="4" placeholder="Enter any special requests or requirements..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none" />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button type="button" onClick={() => { setFormData({ guestName: "", guestEmail: "", guestPhone: "", roomType: "", roomId: "", checkIn: "", checkOut: "", guests: 1, specialRequest: "" }); setErrors({}); }} className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition">Clear Form</button>
              <button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[170px] bg-[#1e1e1e] text-white py-3 px-6 rounded-xl font-bold hover:bg-black transition disabled:opacity-60">{loading ? "Creating..." : "Create Reservation"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReservation;
