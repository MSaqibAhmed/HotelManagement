import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wrench, Headset, CheckCircle, Clock, AlertCircle, BedDouble, Send, X } from "lucide-react";
import { toast } from "react-toastify";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api";

const safeUser = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };
const fmtDate = (v) => { if (!v) return "—"; const d = new Date(v); return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };

const SERVICE_TYPES = ["Housekeeping", "Maintenance"];
const HK_CATEGORIES = ["Cleaning", "Laundry", "Towels", "Linens", "Other"];
const MT_CATEGORIES = ["Plumbing", "Electrical", "AC", "Furniture", "Other"];
const PRIORITIES = ["Low", "Normal", "High"];

const statusStyle = { Pending: "bg-amber-100 text-amber-700", Assigned: "bg-blue-100 text-blue-700", "In-Progress": "bg-purple-100 text-purple-700", Completed: "bg-emerald-100 text-emerald-700", Cancelled: "bg-red-100 text-red-600" };

const GuestRequestServicesPage = () => {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const user = useMemo(safeUser, []);

  const [stay, setStay] = useState(null);          // current-stay
  const [stayLoading, setStayLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(true);

  const [form, setForm] = useState({ serviceType: "Housekeeping", category: "Cleaning", title: "", description: "", priority: "Normal" });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user?._id) { navigate("/login"); return; }
    fetchStay();
    fetchRequests();
  }, []);

  const fetchStay = async () => {
    try {
      setStayLoading(true);
      const { data } = await api.get("/guest/current-stay");
      setStay(data?.stay || null);
    } catch { setStay(null); }
    finally { setStayLoading(false); }
  };

  const fetchRequests = async () => {
    try {
      setReqLoading(true);
      const { data } = await api.get("/guest/service-requests");
      setRequests(data?.requests || []);
    } catch { setRequests([]); }
    finally { setReqLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return toast.error("Title and description required");
    try {
      setSubmitting(true);
      await api.post("/guest/service-requests", form);
      toast.success("Request submitted!");
      setForm({ serviceType: "Housekeeping", category: "Cleaning", title: "", description: "", priority: "Normal" });
      setShowForm(false);
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally { setSubmitting(false); }
  };

  const handleCancel = async (req) => {
    if (!window.confirm("Cancel this request?")) return;
    try {
      await api.patch(`/guest/service-requests/${req.serviceType.toLowerCase()}/${req._id}/cancel`);
      toast.success("Request cancelled");
      fetchRequests();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to cancel"); }
  };

  const bg = dark ? "bg-[#111111]" : "bg-white";
  const text = dark ? "text-white" : "text-gray-900";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const card = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";
  const inp = dark ? "bg-[#111] border-gray-700 text-white focus:border-[#cbb19d] placeholder-gray-600"
                   : "bg-white border-gray-200 text-gray-800 focus:border-[#cbb19d] placeholder-gray-400";

  const isCheckedIn = stay && stay.bookingStatus === "Checked-In";

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 ${bg}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-1">Guest Portal</p>
          <h1 className={`text-3xl md:text-4xl font-serif ${text}`}>Service Requests</h1>
          <p className={`text-sm mt-1 ${muted}`}>Request housekeeping or maintenance for your room</p>
        </div>

        {/* Stay Banner */}
        {stayLoading ? (
          <div className={`rounded-2xl border p-5 mb-8 ${card}`}>
            <div className="w-6 h-6 border-2 border-[#cbb19d] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isCheckedIn ? (
          <div className={`rounded-2xl border p-5 mb-8 flex items-center gap-4 ${card}`}>
            <div className="w-11 h-11 rounded-full bg-[#cbb19d]/20 flex items-center justify-center shrink-0">
              <BedDouble size={20} className="text-[#cbb19d]" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${text}`}>Room {stay.room?.roomNumber} — {stay.room?.roomType}</p>
              <p className={`text-sm ${muted}`}>Currently checked in · Floor {stay.room?.floor}</p>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a] text-white px-4 py-2 rounded-full text-sm font-medium transition-all">
              <Send size={13} /> New Request
            </button>
          </div>
        ) : (
          <div className={`rounded-2xl border p-6 mb-8 text-center ${card}`}>
            <AlertCircle size={32} className="text-amber-400 mx-auto mb-3" />
            <p className={`font-semibold ${text}`}>Not Currently Checked In</p>
            <p className={`text-sm mt-1 ${muted}`}>Service requests are only available while you have an active check-in.</p>
            <Link to="/guest/my-reservations" className="inline-block mt-4 text-sm text-[#cbb19d] hover:underline">View My Reservations →</Link>
          </div>
        )}

        {/* New Request Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
            <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-7 ${dark ? "bg-[#1a1a1a]" : "bg-white"}`}>
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={16} className={dark ? "text-gray-400" : "text-gray-500"} />
              </button>
              <h2 className={`text-xl font-serif font-semibold mb-6 ${text}`}>New Service Request</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Service Type */}
                <div>
                  <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Service Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICE_TYPES.map(t => (
                      <button type="button" key={t}
                        onClick={() => setForm(p => ({...p, serviceType: t, category: t === "Housekeeping" ? "Cleaning" : "Plumbing"}))}
                        className={`py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                          form.serviceType === t ? "border-[#cbb19d] bg-[#cbb19d]/10 text-[#cbb19d]"
                          : dark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600 hover:border-[#cbb19d]"
                        }`}>
                        {t === "Housekeeping" ? <Headset size={14} /> : <Wrench size={14} />} {t}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Category */}
                <div>
                  <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`}>
                    {(form.serviceType === "Housekeeping" ? HK_CATEGORIES : MT_CATEGORIES).map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {/* Priority */}
                <div>
                  <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRIORITIES.map(p => (
                      <button type="button" key={p} onClick={() => setForm(f => ({...f, priority: p}))}
                        className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                          form.priority === p ? "border-[#cbb19d] bg-[#cbb19d]/10 text-[#cbb19d]"
                          : dark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600 hover:border-[#cbb19d]"
                        }`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Title */}
                <div>
                  <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Title</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                    placeholder="e.g. Room needs cleaning"
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`} />
                </div>
                {/* Description */}
                <div>
                  <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Description</label>
                  <textarea rows={3} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                    placeholder="Describe your request in detail…"
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${inp}`} />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3 rounded-xl font-medium transition-all disabled:opacity-60">
                  <Send size={15} /> {submitting ? "Submitting…" : "Submit Request"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Requests History */}
        <div>
          <h2 className={`text-xl font-serif mb-6 ${text}`}>My Requests</h2>
          {reqLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-2 border-[#cbb19d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className={`rounded-2xl border p-12 text-center ${card}`}>
              <Wrench size={36} className={`mx-auto mb-3 ${muted}`} />
              <p className={`font-medium ${muted}`}>No requests yet</p>
              <p className={`text-sm mt-1 ${muted}`}>Your submitted service requests will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req._id} className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${card}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${req.serviceType === "Housekeeping" ? "bg-blue-50 text-blue-500" : "bg-amber-50 text-amber-500"}`}>
                    {req.serviceType === "Housekeeping" ? <Headset size={18} /> : <Wrench size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className={`font-semibold ${text}`}>{req.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[req.status] || "bg-gray-100 text-gray-600"}`}>{req.status}</span>
                    </div>
                    <p className={`text-sm line-clamp-1 ${muted}`}>{req.description}</p>
                    <p className={`text-xs mt-1 ${muted}`}>{req.serviceType} · {req.category} · {fmtDate(req.createdAt)}</p>
                  </div>
                  {["Pending", "Assigned"].includes(req.status) && (
                    <button onClick={() => handleCancel(req)} className="shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-50 transition">
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestRequestServicesPage;
