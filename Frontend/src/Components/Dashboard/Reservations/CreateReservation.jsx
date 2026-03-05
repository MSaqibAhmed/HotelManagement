import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const ROOM_TYPES = ["Standard", "Deluxe", "Executive", "Family"];
const PAYMENT_METHODS = ["Cash", "Online"];

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

// ✅ local date (avoid UTC shift)
const getLocalDateInputValue = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// ✅ optional: force local midnight string
const toLocalMidnight = (dateStr) => (dateStr ? `${dateStr}T00:00:00` : "");

// ✅ debounce helper (no libraries)
const useDebouncedValue = (value, delay = 500) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const CreateReservation = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isGuest = role === "guest";
  const isStaff = ["admin", "manager", "receptionist"].includes(role);

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [guestLookupLoading, setGuestLookupLoading] = useState(false);

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",

    roomType: "",
    checkInDate: "",
    checkOutDate: "",

    adults: 1,
    children: 0,

    paymentMethod: "Cash",
    specialRequests: "",
  });

  const [errors, setErrors] = useState({});

  const [preview, setPreview] = useState({
    roomNumber: "",
    roomName: "",
    basePrice: 0,
    capacity: 0,
    nights: 0,
    totalPersons: 0,
    extraPersons: 0,
    extraCharge: 0,
    amount: 0,
  });

  const nameRegex = /^[A-Za-z\s]{3,}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^[0-9]{10,15}$/;

  const clearFieldError = (name) => {
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "adults" || name === "children") {
      let num = value === "" ? "" : Number(value);
      if (num === "") {
        setFormData((p) => ({ ...p, [name]: "" }));
        clearFieldError(name);
        return;
      }
      if (Number.isNaN(num)) num = 0;
      if (name === "adults") num = Math.max(1, Math.min(10, num));
      if (name === "children") num = Math.max(0, Math.min(10, num));
      setFormData((p) => ({ ...p, [name]: num }));
      clearFieldError(name);
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  // ✅ admin/staff: auto fetch guest details by email (debounced)
  const debouncedGuestEmail = useDebouncedValue(
    String(formData.guestEmail || "").toLowerCase().trim(),
    600
  );

  const fetchGuestByEmail = async (email) => {
    try {
      setGuestLookupLoading(true);

      // ✅ backend endpoint required: GET /api/auth/guest-by-email?email=...
      const { data } = await api.get(
        `/auth/guest-by-email?email=${encodeURIComponent(email)}`
      );

      const g = data?.guest;

      setFormData((p) => ({
        ...p,
        guestName: g?.name || "",
        guestPhone: g?.phone || "",
        guestEmail: g?.email || email,
      }));

      clearFieldError("guestName");
      clearFieldError("guestPhone");
    } catch (err) {
      // guest not found -> clear auto fields (but keep email)
      setFormData((p) => ({ ...p, guestName: "", guestPhone: "" }));

      const msg = err?.response?.data?.message;
      if (msg && msg !== "Guest not found") toast.error(msg);
    } finally {
      setGuestLookupLoading(false);
    }
  };

  useEffect(() => {
    if (!isStaff) return;

    if (!debouncedGuestEmail) {
      setFormData((p) => ({ ...p, guestName: "", guestPhone: "" }));
      return;
    }

    if (!emailRegex.test(debouncedGuestEmail)) {
      setFormData((p) => ({ ...p, guestName: "", guestPhone: "" }));
      return;
    }

    fetchGuestByEmail(debouncedGuestEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedGuestEmail, isStaff]);

  const validateRequired = () => {
    const newErrors = {};

    if (isStaff) {
      // Email is required. Name/Phone will be auto-filled (but still required eventually).
      if (!formData.guestEmail.trim()) newErrors.guestEmail = "Email is required";
      if (!formData.guestName.trim()) newErrors.guestName = "Guest not found by email";
      if (!formData.guestPhone.trim()) newErrors.guestPhone = "Guest phone not found";
    }

    if (!formData.roomType) newErrors.roomType = "Room Type is required";
    if (!formData.checkInDate) newErrors.checkInDate = "Check-in date is required";
    if (!formData.checkOutDate) newErrors.checkOutDate = "Check-out date is required";
    if (!formData.paymentMethod) newErrors.paymentMethod = "Payment method is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    if (isStaff) {
      const e = String(formData.guestEmail || "").trim();
      if (!emailRegex.test(e)) {
        toast.error("Please enter a valid email address");
        return false;
      }
      // name/phone already fetched from DB; keep regex checks if you want:
      if (formData.guestName && !nameRegex.test(formData.guestName.trim())) {
        toast.error("Guest name invalid");
        return false;
      }
      if (formData.guestPhone && !phoneRegex.test(formData.guestPhone.trim())) {
        toast.error("Guest phone invalid");
        return false;
      }
    }

    if (formData.roomType && !ROOM_TYPES.includes(formData.roomType)) {
      toast.error("Invalid room type");
      return false;
    }

    if (formData.paymentMethod && !PAYMENT_METHODS.includes(formData.paymentMethod)) {
      toast.error("Invalid payment method");
      return false;
    }

    if (formData.checkInDate && formData.checkOutDate) {
      const start = new Date(formData.checkInDate);
      const end = new Date(formData.checkOutDate);
      if (end <= start) {
        toast.error("Check-out must be after check-in");
        return false;
      }
    }

    return true;
  };

  // ✅ preview auto-calc
  useEffect(() => {
    const canPreview = formData.roomType && formData.checkInDate && formData.checkOutDate;

    if (!canPreview) {
      setPreview({
        roomNumber: "",
        roomName: "",
        basePrice: 0,
        capacity: 0,
        nights: 0,
        totalPersons: 0,
        extraPersons: 0,
        extraCharge: 0,
        amount: 0,
      });
      return;
    }

    const run = async () => {
      try {
        setPreviewLoading(true);

        const qs = new URLSearchParams({
          roomType: formData.roomType,
          checkInDate: toLocalMidnight(formData.checkInDate),
          checkOutDate: toLocalMidnight(formData.checkOutDate),
          adults: String(Number(formData.adults || 1)),
          children: String(Number(formData.children || 0)),
        });

        const { data } = await api.get(`/reservation/preview?${qs.toString()}`);

        setPreview({
          roomNumber: data?.selectedRoom?.roomNumber || "",
          roomName: data?.selectedRoom?.roomName || "",
          basePrice: Number(data?.selectedRoom?.basePrice || 0),
          capacity: Number(data?.selectedRoom?.capacity || 0),
          nights: Number(data?.nights || 0),
          totalPersons: Number(data?.totalPersons || 0),
          extraPersons: Number(data?.extraPersons || 0),
          extraCharge: Number(data?.extraCharge || 0),
          amount: Number(data?.amount || 0),
        });
      } catch (err) {
        setPreview({
          roomNumber: "",
          roomName: "",
          basePrice: 0,
          capacity: 0,
          nights: 0,
          totalPersons: 0,
          extraPersons: 0,
          extraCharge: 0,
          amount: 0,
        });

        const msg = err?.response?.data?.message || "No room available for selected dates";
        toast.error(msg);
      } finally {
        setPreviewLoading(false);
      }
    };

    run();
  }, [formData.roomType, formData.checkInDate, formData.checkOutDate, formData.adults, formData.children]);

  const handleClear = () => {
    setFormData({
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      roomType: "",
      checkInDate: "",
      checkOutDate: "",
      adults: 1,
      children: 0,
      paymentMethod: "Cash",
      specialRequests: "",
    });
    setErrors({});
    setPreview({
      roomNumber: "",
      roomName: "",
      basePrice: 0,
      capacity: 0,
      nights: 0,
      totalPersons: 0,
      extraPersons: 0,
      extraCharge: 0,
      amount: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateRequired()) return;
    if (!validateForm()) return;

    if (!preview.amount || preview.amount <= 0 || !preview.roomNumber) {
      toast.error("No available room found. Please change dates or room type.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        roomType: formData.roomType,
        checkInDate: toLocalMidnight(formData.checkInDate),
        checkOutDate: toLocalMidnight(formData.checkOutDate),
        paymentMethod: formData.paymentMethod,
        adults: Number(formData.adults || 1),
        children: Number(formData.children || 0),
        specialRequests: formData.specialRequests,
      };

      if (isStaff) {
        payload.guestEmail = String(formData.guestEmail || "").toLowerCase().trim();
      }

      const { data } = await api.post("/reservation/create", payload);

      toast.success(data?.message || "Reservation created successfully");
      navigate("/dashboard/reservations");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Reservation creation failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 border rounded-xl outline-none transition ${
      errors[field]
        ? "border-red-500 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:ring-2 focus:ring-[#1e266d]/15"
    }`;

  const errorText = (field) =>
    errors[field] ? <p className="text-red-500 text-xs font-semibold mt-2">{errors[field]}</p> : null;

  const today = getLocalDateInputValue();

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-gray-50">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-7 lg:p-8">
          <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1e266d]">Create New Reservation</h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Select room type + dates. Room and amount auto-calc from backend.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/reservations")}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isStaff && (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 rounded-full" style={{ backgroundColor: THEME }} />
                  Guest Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      name="guestEmail"
                      value={formData.guestEmail}
                      onChange={handleChange}
                      placeholder="guest@gmail.com"
                      className={inputClass("guestEmail")}
                    />
                    {errorText("guestEmail")}
                    <div className="mt-2 flex items-center gap-2">
                      {guestLookupLoading ? (
                        <p className="text-[11px] text-gray-500">Fetching guest details...</p>
                      ) : formData.guestEmail && emailRegex.test(String(formData.guestEmail).trim()) ? (
                        formData.guestName ? (
                          <p className="text-[11px] text-green-600 font-semibold">Guest found ✓</p>
                        ) : (
                          <p className="text-[11px] text-gray-500">Guest not found (email must be registered)</p>
                        )
                      ) : (
                        <p className="text-[11px] text-gray-500">Type a valid email to auto-fill name/phone.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleChange}
                      readOnly
                      placeholder="Auto from guest email"
                      className={`${inputClass("guestName")} bg-gray-50`}
                    />
                    {errorText("guestName")}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      name="guestPhone"
                      value={formData.guestPhone}
                      onChange={handleChange}
                      readOnly
                      placeholder="Auto from guest email"
                      className={`${inputClass("guestPhone")} bg-gray-50`}
                    />
                    {errorText("guestPhone")}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full" style={{ backgroundColor: THEME }} />
                Booking Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type *</label>
                  <select name="roomType" value={formData.roomType} onChange={handleChange} className={inputClass("roomType")}>
                    <option value="">Select Room Type</option>
                    {ROOM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errorText("roomType")}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Auto Selected Room</label>
                  <input
                    type="text"
                    value={
                      previewLoading
                        ? "Checking availability..."
                        : preview.roomNumber
                        ? `${preview.roomName ? `${preview.roomName} • ` : ""}#${preview.roomNumber}`
                        : "No room selected"
                    }
                    readOnly
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date *</label>
                  <input
                    type="date"
                    name="checkInDate"
                    value={formData.checkInDate}
                    onChange={handleChange}
                    min={today}
                    className={inputClass("checkInDate")}
                  />
                  {errorText("checkInDate")}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date *</label>
                  <input
                    type="date"
                    name="checkOutDate"
                    value={formData.checkOutDate}
                    onChange={handleChange}
                    min={formData.checkInDate || today}
                    className={inputClass("checkOutDate")}
                  />
                  {errorText("checkOutDate")}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Adults</label>
                  <input
                    type="number"
                    name="adults"
                    value={formData.adults}
                    onChange={handleChange}
                    min={1}
                    max={10}
                    className={inputClass("adults")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Children</label>
                  <input
                    type="number"
                    name="children"
                    value={formData.children}
                    onChange={handleChange}
                    min={0}
                    max={10}
                    className={inputClass("children")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className={inputClass("paymentMethod")}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {errorText("paymentMethod")}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Amount</p>
                  <p className="text-2xl font-black text-[#1e266d] mt-1">
                    {previewLoading ? "..." : `Rs ${Number(preview.amount || 0).toLocaleString()}`}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {preview.nights
                      ? `${preview.nights} night(s) • Base Rs ${Number(preview.basePrice || 0).toLocaleString()}`
                      : "Select room type + dates"}
                  </p>

                  {!!preview.capacity && (
                    <p className="text-xs text-gray-500 mt-1">
                      Capacity: {preview.capacity} • Persons: {preview.totalPersons}
                      {preview.extraPersons > 0
                        ? ` • Extra: ${preview.extraPersons} (+Rs ${Number(preview.extraCharge || 0).toLocaleString()})`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full" style={{ backgroundColor: THEME }} />
                Special Requests
              </h3>
              <textarea
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows="4"
                placeholder="Enter any special requests or requirements..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d]/15 outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleClear}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Clear Form
              </button>

              <button
                type="submit"
                disabled={loading || (isStaff && guestLookupLoading)}
                className="w-full sm:w-auto min-w-[170px] py-3 px-6 rounded-xl font-bold transition disabled:opacity-60"
                style={{ backgroundColor: THEME, color: "#111827" }}
              >
                {loading ? "Creating..." : "Create Reservation"}
              </button>
            </div>

            {isStaff && (
              <p className="text-[11px] text-gray-500">
                Note: Guest must be registered already. Email will auto-fill name & phone.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateReservation;