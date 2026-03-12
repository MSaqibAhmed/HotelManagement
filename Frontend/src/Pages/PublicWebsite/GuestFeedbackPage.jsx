import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Star, MessageSquare, Plus, Edit2, Trash2, X, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api";

const safeUser = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };
const fmtDate = (v) => { if (!v) return "—"; const d = new Date(v); return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };

const CATEGORIES = ["Stay", "Service", "Food", "Cleanliness", "Staff", "Other"];
const statusColors = { Submitted: "bg-blue-100 text-blue-700", Reviewed: "bg-emerald-100 text-emerald-700" };

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button type="button" key={s} onClick={() => onChange && onChange(s)} className="focus:outline-none">
        <Star size={22} className={s <= value ? "text-[#cbb19d] fill-[#cbb19d]" : "text-gray-300"} />
      </button>
    ))}
  </div>
);

const FeedbackModal = ({ existing, onClose, onSaved, dark }) => {
  const isEdit = Boolean(existing);
  const [form, setForm] = useState({
    rating: existing?.rating || 5,
    category: existing?.category || "Stay",
    title: existing?.title || "",
    message: existing?.message || "",
  });
  const [saving, setSaving] = useState(false);

  const inp = dark ? "bg-[#111] border-gray-700 text-white focus:border-[#cbb19d] placeholder-gray-600"
                   : "bg-white border-gray-200 text-gray-800 focus:border-[#cbb19d] placeholder-gray-400";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const text = dark ? "text-white" : "text-gray-900";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return toast.error("Please write a message");
    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/guest/feedback/${existing._id}`, form);
        toast.success("Feedback updated!");
      } else {
        await api.post("/guest/feedback", form);
        toast.success("Feedback submitted! Thank you.");
      }
      onSaved(); onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-7 ${dark ? "bg-[#1a1a1a]" : "bg-white"}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} className={dark ? "text-gray-400" : "text-gray-500"} />
        </button>
        <h2 className={`text-xl font-serif font-semibold mb-6 ${text}`}>{isEdit ? "Edit Feedback" : "Share Your Experience"}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Rating */}
          <div>
            <label className={`block text-xs uppercase tracking-widest font-semibold mb-2 ${muted}`}>Your Rating</label>
            <StarRating value={form.rating} onChange={r => setForm(p => ({...p, rating: r}))} />
          </div>
          {/* Category */}
          <div>
            <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          {/* Title */}
          <div>
            <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Title (optional)</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
              placeholder="A short summary of your experience"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`} />
          </div>
          {/* Message */}
          <div>
            <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Your Review</label>
            <textarea rows={4} value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))}
              placeholder="Tell us about your stay…"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${inp}`} />
          </div>
          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3 rounded-xl font-medium transition-all disabled:opacity-60">
            <CheckCircle size={15} /> {saving ? "Saving…" : (isEdit ? "Save Changes" : "Submit Feedback")}
          </button>
        </form>
      </div>
    </div>
  );
};

const GuestFeedbackPage = () => {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const user = useMemo(safeUser, []);

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    if (!user?._id) { navigate("/login"); return; }
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/guest/feedback");
      setFeedbacks(data?.feedback || []);
    } catch { setFeedbacks([]); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback?")) return;
    try {
      await api.delete(`/guest/feedback/${id}`);
      toast.success("Feedback deleted");
      fetchFeedback();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to delete"); }
  };

  const bg = dark ? "bg-[#111111]" : "bg-white";
  const text = dark ? "text-white" : "text-gray-900";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const card = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";

  return (
    <>
      {showModal && <FeedbackModal onClose={() => setShowModal(false)} onSaved={fetchFeedback} dark={dark} />}
      {editItem && <FeedbackModal existing={editItem} onClose={() => setEditItem(null)} onSaved={fetchFeedback} dark={dark} />}

      <div className={`min-h-screen pt-24 pb-20 px-6 ${bg}`}>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-10">
            <div>
              <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-1">Guest Portal</p>
              <h1 className={`text-3xl md:text-4xl font-serif ${text}`}>My Feedback</h1>
              <p className={`text-sm mt-1 ${muted}`}>Share and manage your experiences</p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md shadow-[#cbb19d]/20">
              <Plus size={15} /> Give Feedback
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-[#cbb19d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className={`rounded-2xl border p-16 text-center ${card}`}>
              <MessageSquare size={36} className={`mx-auto mb-3 ${muted}`} />
              <p className={`font-medium ${muted}`}>No feedback yet</p>
              <p className={`text-sm mt-1 ${muted}`}>Your submitted reviews will appear here.</p>
              <button onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 mt-5 bg-[#cbb19d] hover:bg-[#b89f8a] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all">
                <Plus size={14} /> Share Experience
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {feedbacks.map(fb => (
                <div key={fb._id} className={`rounded-2xl border p-6 ${card}`}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex gap-0.5 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} className={i < fb.rating ? "text-[#cbb19d] fill-[#cbb19d]" : "text-gray-300"} />
                        ))}
                      </div>
                      {fb.title && <p className={`font-semibold text-sm ${text}`}>{fb.title}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[fb.status] || "bg-gray-100 text-gray-500"}`}>{fb.status}</span>
                        <span className={`text-xs ${muted}`}>{fb.category} · {fmtDate(fb.createdAt)}</span>
                      </div>
                    </div>
                    {fb.status !== "Reviewed" && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditItem(fb)} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(fb._id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${muted}`}>"{fb.message}"</p>
                  {fb.room?.roomNumber && (
                    <p className={`text-xs mt-3 ${muted}`}>Room {fb.room.roomNumber} · {fb.room.roomType}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GuestFeedbackPage;
