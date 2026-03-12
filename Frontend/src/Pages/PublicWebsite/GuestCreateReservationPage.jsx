import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { CalendarCheck, Users, BedDouble, Calendar, CreditCard, FileText, ArrowRight, CheckCircle, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api";

const safeUser = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };
const toMidnight = (s) => s ? `${s}T00:00:00` : "";

const GuestCreateReservationPage = () => {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useMemo(safeUser, []);

  // Ensure only guests can access
  useEffect(() => {
    if (!user?._id || String(user?.role).toLowerCase() !== "guest") {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  // URL Params parsing
  const queryRoomType = searchParams.get("roomType") || "";
  const queryCheckIn = searchParams.get("checkInDate") || searchParams.get("checkIn") || "";
  const queryCheckOut = searchParams.get("checkOutDate") || searchParams.get("checkOut") || "";
  const queryAdults = searchParams.get("adults") || searchParams.get("guests") || "1";
  const queryChildren = searchParams.get("children") || "0";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [form, setForm] = useState({
    roomType: queryRoomType || "Standard",
    checkInDate: queryCheckIn,
    checkOutDate: queryCheckOut,
    adults: Math.max(1, Number(queryAdults)),
    children: Number(queryChildren),
    paymentMethod: "Cash",
    specialRequests: "",
  });

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
          checkInDate: toMidnight(form.checkInDate),
          checkOutDate: toMidnight(form.checkOutDate),
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
      if (!form.checkInDate || !form.checkOutDate) return toast.error("Dates are required");
      if (new Date(form.checkInDate) >= new Date(form.checkOutDate)) return toast.error("Check-out must be after Check-in");
      if (!preview) return toast.error("No rooms available for these dates");
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        guestEmail: user.email, // Use logged-in guest email automatically
        roomType: form.roomType,
        checkInDate: toMidnight(form.checkInDate),
        checkOutDate: toMidnight(form.checkOutDate),
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

  // Theming classes
  const bg = dark ? "bg-[#111111]" : "bg-[#f9f8f6]";
  const text = dark ? "text-white" : "text-gray-900";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const card = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-white border-gray-100";
  const cardLight = dark ? "bg-[#1f1f1f] border-gray-800" : "bg-[#faf8f6] border-gray-100";
  const inputBase = `w-full ${dark ? "bg-[#111] border-gray-700 text-white focus:border-[#cbb19d] placeholder-gray-600" : "bg-white border-gray-200 text-gray-900 focus:border-[#cbb19d] placeholder-gray-400"} rounded-xl px-4 py-3 outline-none transition-all`;
  const labelBase = `block text-xs uppercase tracking-wider font-semibold mb-2 ${muted}`;

  if (success) {
    return (
      <div className={`min-h-screen pt-24 pb-20 flex items-center justify-center p-6 ${bg}`}>
        <div className={`max-w-md w-full rounded-3xl p-10 text-center shadow-sm border ${card}`}>
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-500" size={40} />
          </div>
          <h2 className={`text-3xl font-serif mb-3 ${text}`}>Booking Confirmed</h2>
          <p className={`${muted} mb-8 leading-relaxed`}>
            Your reservation has been successfully placed. You can view its status and details in your account.
          </p>
          <div className="space-y-3">
            <Link to="/guest/my-reservations"
              className="block w-full bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3.5 rounded-xl font-medium transition-colors">
              View My Reservations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 ${bg}`}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">Book Your Stay</p>
          <h1 className={`text-3xl md:text-4xl font-serif ${text}`}>Create Reservation</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Form Area */}
          <div className={`flex-1 border p-8 rounded-3xl shadow-sm ${card}`}>

            {/* Stepper Header (Only 2 steps for Guest) */}
            <div className="flex gap-2 mb-10">
              {[1, 2].map((num) => (
                <div key={num} className={`flex-1 h-1.5 rounded-full overflow-hidden ${dark ? "bg-gray-800" : "bg-gray-100"}`}>
                  <div className={`h-full bg-[#cbb19d] transition-all duration-500 ${step >= num ? 'w-full' : 'w-0'}`} />
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-serif mb-6 flex items-center gap-3 ${text}`}>
                  <CalendarCheck className="text-[#cbb19d]" size={20} />
                  Stay Details
                </h3>

                <div>
                  <label className={labelBase}>Room Type *</label>
                  <div className="relative">
                    <BedDouble className={`absolute left-4 top-3.5 ${dark ? "text-gray-500" : "text-gray-400"}`} size={18} />
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
                    <label className={labelBase}>Check-in Date *</label>
                    <div className="relative">
                      <Calendar className={`absolute left-4 top-3.5 ${dark ? "text-gray-500" : "text-gray-400"}`} size={18} />
                      <input type="date" name="checkInDate" value={form.checkInDate} onChange={handleChange}
                        className={`${inputBase} pl-11`} min={new Date().toISOString().split('T')[0]} />
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Check-out Date *</label>
                    <div className="relative">
                      <Calendar className={`absolute left-4 top-3.5 ${dark ? "text-gray-500" : "text-gray-400"}`} size={18} />
                      <input type="date" name="checkOutDate" value={form.checkOutDate} onChange={handleChange}
                        className={`${inputBase} pl-11`} min={form.checkInDate || new Date().toISOString().split('T')[0]} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelBase}>Adults</label>
                    <div className="relative">
                      <Users className={`absolute left-4 top-3.5 ${dark ? "text-gray-500" : "text-gray-400"}`} size={18} />
                      <select name="adults" value={form.adults} onChange={handleChange} className={`${inputBase} pl-11 appearance-none`}>
                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Adult' : 'Adults'}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Children</label>
                    <div className="relative">
                      <Users className={`absolute left-4 top-3.5 ${dark ? "text-gray-500" : "text-gray-400"}`} size={18} />
                      <select name="children" value={form.children} onChange={handleChange} className={`${inputBase} pl-11 appearance-none`}>
                        {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Child' : 'Children'}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <button onClick={handleNext} disabled={!preview}
                  className="w-full mt-6 bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                  {preview ? "Continue to Payment" : "Select valid dates first"} <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h3 className={`text-xl font-serif mb-6 flex items-center gap-3 ${text}`}>
                  <CreditCard className="text-[#cbb19d]" size={20} />
                  Payment & Final Details
                </h3>

                <div>
                  <label className={labelBase}>Payment Method *</label>
                  <div className="grid grid-cols-2 gap-4">
                    {["Cash", "Online"].map((m) => (
                      <button key={m} type="button" onClick={() => setForm(p => ({ ...p, paymentMethod: m }))}
                        className={`py-4 rounded-xl border flex items-center justify-center gap-2 transition-all
                          ${form.paymentMethod === m 
                            ? dark ? 'border-[#cbb19d] bg-[#cbb19d]/10 text-[#cbb19d]' : 'border-[#cbb19d] bg-[#cbb19d]/5 text-[#cbb19d]' 
                            : dark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        <CreditCard size={18} />
                        <span className="font-medium">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Special Requests (Optional)</label>
                  <div className="relative">
                    <FileText className={`absolute left-4 top-4 ${dark ? "text-gray-500" : "text-gray-400"}`} size={18} />
                    <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange} rows={4}
                      placeholder="Any specific preferences..."
                      className={`${inputBase} pl-11 resize-none py-3.5`} />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setStep(1)} disabled={loading} 
                    className={`flex-1 py-3.5 rounded-xl font-medium transition-colors ${dark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
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
            <div className={`sticky top-24 border p-6 rounded-3xl ${cardLight}`}>
              <h4 className={`text-sm uppercase tracking-widest font-semibold mb-6 ${muted}`}>Booking Summary</h4>

              <div className="space-y-4 mb-6 relative">
                {previewLoading && (
                  <div className={`absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10 ${dark ? 'bg-[#1f1f1f]/80' : 'bg-[#faf8f6]/80'}`}>
                    <div className="w-6 h-6 border-2 border-[#cbb19d] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                <div className={`flex justify-between items-center pb-4 border-b ${dark ? 'border-gray-800' : 'border-gray-200/60'}`}>
                  <span className={`text-sm ${muted}`}>Room</span>
                  <span className={`font-serif ${text}`}>
                    {preview?.roomNumber ? `${form.roomType} #${preview.roomNumber}` : '—'}
                  </span>
                </div>
                
                <div className={`flex justify-between items-center pb-4 border-b ${dark ? 'border-gray-800' : 'border-gray-200/60'}`}>
                  <span className={`text-sm ${muted}`}>Duration</span>
                  <span className={`font-medium ${text}`}>
                    {preview?.nights ? `${preview.nights} Nights` : '—'}
                  </span>
                </div>

                <div className={`flex justify-between items-center pb-4 border-b ${dark ? 'border-gray-800' : 'border-gray-200/60'}`}>
                  <span className={`text-sm ${muted}`}>Guests</span>
                  <span className={`font-medium ${text}`}>{form.adults}A, {form.children}C</span>
                </div>

                {preview?.extraCharge > 0 && (
                  <div className={`flex justify-between items-center pb-4 border-b ${dark ? 'border-gray-800' : 'border-gray-200/60'} text-[#cbb19d]`}>
                    <span className="text-sm">Extra Person Charge</span>
                    <span className="font-medium">+ Rs {preview.extraCharge.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-end mb-1">
                  <span className={muted}>Total Price</span>
                  <span className="text-2xl font-serif text-[#cbb19d]">
                    {preview?.amount ? `Rs ${preview.amount.toLocaleString()}` : "—"}
                  </span>
                </div>
                <p className={`text-xs text-right mt-1 ${dark ? "text-gray-600" : "text-gray-400"}`}>Includes taxes & fees</p>
              </div>
              
              {(!preview && form.checkInDate && form.checkOutDate) && !previewLoading && (
                <div className={`mt-4 p-3 text-sm rounded-xl border ${dark ? "bg-red-900/10 text-red-400 border-red-900/30" : "bg-red-50 text-red-600 border-red-100"}`}>
                  No rooms available for these dates/type.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GuestCreateReservationPage;
