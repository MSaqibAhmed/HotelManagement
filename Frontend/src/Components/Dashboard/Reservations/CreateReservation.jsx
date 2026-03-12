import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CalendarCheck, Users, BedDouble, Calendar, CreditCard, FileText, ArrowRight, CheckCircle, Search } from "lucide-react";
import api from "../../../api";

// Reusable hook to debounce input
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const CreateReservation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL Params (if coming from rooms list)
  const queryRoomType = searchParams.get("roomType") || "";
  const queryCheckIn = searchParams.get("checkInDate") || "";
  const queryCheckOut = searchParams.get("checkOutDate") || "";
  const queryAdults = searchParams.get("adults") || "1";
  const queryChildren = searchParams.get("children") || "0";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [form, setForm] = useState({
    guestEmail: "",
    guestName: "",
    guestPhone: "",

    roomType: queryRoomType || "Standard",
    checkInDate: queryCheckIn,
    checkOutDate: queryCheckOut,
    adults: Number(queryAdults),
    children: Number(queryChildren),
    paymentMethod: "Cash",
    specialRequests: "",
  });

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const debouncedEmail = useDebounce(form.guestEmail, 800);

  // Auto-fetch guest info when email changes
  useEffect(() => {
    const fetchGuest = async () => {
      if (!debouncedEmail || !debouncedEmail.includes("@")) {
        setForm(prev => ({ ...prev, guestName: "", guestPhone: "" }));
        return;
      }
      try {
        setGuestLoading(true);
        const { data } = await api.get(`/auth/guest-by-email?email=${encodeURIComponent(debouncedEmail)}`);
        if (data?.guest) {
          setForm(prev => ({
            ...prev,
            guestName: data.guest.name || "",
            guestPhone: data.guest.phone || "",
          }));
        }
      } catch (err) {
        setForm(prev => ({ ...prev, guestName: "", guestPhone: "" }));
      } finally {
        setGuestLoading(false);
      }
    };
    fetchGuest();
  }, [debouncedEmail]);

  // Live price preview auto-trigger
  useEffect(() => {
    if (!form.roomType || !form.checkInDate || !form.checkOutDate) {
      setPreview(null);
      return;
    }
    const d1 = new Date(form.checkInDate);
    const d2 = new Date(form.checkOutDate);
    if (d1 >= d2) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      setPreviewLoading(true);
      try {
        const query = new URLSearchParams({
          roomType: form.roomType,
          checkInDate: form.checkInDate + "T00:00:00",
          checkOutDate: form.checkOutDate + "T00:00:00",
          adults: form.adults.toString(),
          children: form.children.toString(),
        });
        const { data } = await api.get(`/reservation/preview?${query.toString()}`);
        setPreview(data);
      } catch (err) {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchPreview();
  }, [form.roomType, form.checkInDate, form.checkOutDate, form.adults, form.children]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.guestEmail || !form.guestEmail.includes("@")) {
        return toast.error("Valid guest email is required");
      }
      if (!form.guestName || !form.guestPhone) {
        return toast.error("Guest must be registered matching this email");
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.checkInDate || !form.checkOutDate) return toast.error("Dates are required");
      if (new Date(form.checkInDate) >= new Date(form.checkOutDate)) return toast.error("Check-out must be after Check-in");
      if (!preview) return toast.error("No rooms available for these dates");
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        guestEmail: form.guestEmail.trim(),
        roomType: form.roomType,
        checkInDate: form.checkInDate + "T00:00:00",
        checkOutDate: form.checkOutDate + "T00:00:00",
        adults: Number(form.adults),
        children: Number(form.children),
        paymentMethod: form.paymentMethod,
        specialRequests: form.specialRequests,
      };

      await api.post("/reservation/create", payload);
      setSuccess(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create reservation");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-500" size={40} />
          </div>
          <h2 className="text-3xl font-serif text-gray-900 mb-3">Booking Confirmed</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            The reservation for {form.guestName} has been successfully created and added to the system.
          </p>
          <div className="space-y-3">
            <button onClick={() => navigate("/dashboard/reservations")}
              className="w-full bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3.5 rounded-xl font-medium transition-colors">
              View All Reservations
            </button>
            <button onClick={() => { setSuccess(false); setStep(1); setForm(p => ({...p, guestEmail: "", guestName: "", guestPhone: ""})); }}
              className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3.5 rounded-xl font-medium transition-colors">
              Make Another Booking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Common UI styles
  const inputBase = "w-full bg-white border border-gray-200 text-gray-900 focus:border-[#cbb19d] rounded-xl px-4 py-3 outline-none transition-all placeholder-gray-400";
  const labelBase = "block text-xs uppercase tracking-wider font-semibold text-gray-500 mb-2";

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <div className="mb-10 text-center">
        <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">Front Desk</p>
        <h1 className="text-3xl font-serif text-gray-900">Create Reservation</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Form Area */}
        <div className="flex-1 bg-white border border-gray-100 p-8 rounded-3xl shadow-sm">

          {/* Stepper Header */}
          <div className="flex gap-2 mb-10">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full bg-[#cbb19d] transition-all duration-500 ${step >= num ? 'w-full' : 'w-0'}`} />
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-serif text-gray-900 mb-6 flex items-center gap-3">
                <Search className="text-[#cbb19d]" size={20} />
                Lookup Guest
              </h3>
              
              <div>
                <label className={labelBase}>Registered Email *</label>
                <div className="relative">
                  <input type="email" name="guestEmail" value={form.guestEmail} onChange={handleChange}
                    className={inputBase} placeholder="Enter guest's registered email" />
                  {guestLoading && <div className="absolute right-4 top-3.5 w-4 h-4 border-2 border-[#cbb19d] border-t-transparent rounded-full animate-spin" />}
                </div>
                <p className="text-xs text-gray-400 mt-2">The guest must already have an account.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelBase}>Full Name</label>
                  <input type="text" value={form.guestName} readOnly
                    className={`${inputBase} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Auto-filled" />
                </div>
                <div>
                  <label className={labelBase}>Phone</label>
                  <input type="text" value={form.guestPhone} readOnly
                    className={`${inputBase} bg-gray-50 text-gray-500 cursor-not-allowed`} placeholder="Auto-filled" />
                </div>
              </div>

              <button onClick={handleNext}
                className="w-full mt-6 bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                Continue to Dates <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-serif text-gray-900 mb-6 flex items-center gap-3">
                <CalendarCheck className="text-[#cbb19d]" size={20} />
                Stay Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelBase}>Check-in Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input type="date" name="checkInDate" value={form.checkInDate} onChange={handleChange}
                      className={`${inputBase} pl-11`} min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div>
                  <label className={labelBase}>Check-out Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input type="date" name="checkOutDate" value={form.checkOutDate} onChange={handleChange}
                      className={`${inputBase} pl-11`} min={form.checkInDate || new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelBase}>Room Type *</label>
                <div className="relative">
                  <BedDouble className="absolute left-4 top-3.5 text-gray-400" size={18} />
                  <select name="roomType" value={form.roomType} onChange={handleChange} className={`${inputBase} pl-11 appearance-none`}>
                    <option value="Standard">Standard Room</option>
                    <option value="Deluxe">Deluxe Room</option>
                    <option value="Executive">Executive Suite</option>
                    <option value="Family">Family Suite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelBase}>Adults</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <select name="adults" value={form.adults} onChange={handleChange} className={`${inputBase} pl-11 appearance-none`}>
                      {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelBase}>Children</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <select name="children" value={form.children} onChange={handleChange} className={`${inputBase} pl-11 appearance-none`}>
                      {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Child' : 'Children'}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-medium transition-colors">
                  Back
                </button>
                <button onClick={handleNext} className="flex-[2] bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                  Continue to Payment <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-serif text-gray-900 mb-6 flex items-center gap-3">
                <CreditCard className="text-[#cbb19d]" size={20} />
                Payment & Final Details
              </h3>

              <div>
                <label className={labelBase}>Payment Method *</label>
                <div className="grid grid-cols-2 gap-4">
                  {["Cash", "Online"].map((m) => (
                    <button key={m} type="button" onClick={() => setForm(p => ({ ...p, paymentMethod: m }))}
                      className={`py-4 rounded-xl border flex items-center justify-center gap-2 transition-all
                        ${form.paymentMethod === m ? 'border-[#cbb19d] bg-[#fbf9f8] text-[#cbb19d]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <CreditCard size={18} />
                      <span className="font-medium">{m} Payment</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelBase}>Special Requests (Optional)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-gray-400" size={18} />
                  <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={3}
                    placeholder="Any specific preferences..."
                    className={`${inputBase} pl-11 resize-none py-3.5`} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(2)} disabled={loading} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-medium transition-colors">
                  Back
                </button>
                <button onClick={handleSubmit} disabled={loading || !preview}
                  className="flex-[2] bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? "Creating Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Summary Card */}
        <div className="lg:w-80">
          <div className="sticky top-24 bg-[#faf8f6] border border-gray-100 p-6 rounded-3xl">
            <h4 className="text-sm uppercase tracking-widest font-semibold text-gray-500 mb-6">Booking Summary</h4>

            <div className="space-y-4 mb-6 relative">
              {previewLoading && (
                <div className="absolute inset-0 bg-[#faf8f6]/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <div className="w-6 h-6 border-2 border-[#cbb19d] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <div className="flex justify-between items-center pb-4 border-b border-gray-200/60">
                <span className="text-gray-500 text-sm">Room</span>
                <span className="font-serif text-gray-900">
                  {preview?.roomNumber ? `${form.roomType} #${preview.roomNumber}` : '—'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pb-4 border-b border-gray-200/60">
                <span className="text-gray-500 text-sm">Duration</span>
                <span className="text-gray-900 font-medium">
                  {preview?.nights ? `${preview.nights} Nights` : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-gray-200/60">
                <span className="text-gray-500 text-sm">Guests</span>
                <span className="text-gray-900 font-medium">{form.adults}A, {form.children}C</span>
              </div>

              {preview?.extraCharge > 0 && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200/60 text-amber-600">
                  <span className="text-sm">Extra Person Charge</span>
                  <span className="font-medium">+ Rs {preview.extraCharge.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-end mb-1">
                <span className="text-gray-500">Total Price</span>
                <span className="text-2xl font-serif text-[#cbb19d]">
                  {preview?.amount ? `Rs ${preview.amount.toLocaleString()}` : "—"}
                </span>
              </div>
              <p className="text-xs text-gray-400 text-right">Includes taxes & fees</p>
            </div>
            
            {(!preview && form.checkInDate && form.checkOutDate) && !previewLoading && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                No rooms available for these dates/type.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateReservation;