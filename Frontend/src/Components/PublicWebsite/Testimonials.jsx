import React, { useState, useEffect } from "react";
import { Star, MessageSquarePlus, X, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api";
const FALLBACK = [
  { guestSnapshot: { name: "Sarah Mitchell" }, rating: 5, category: "Stay", message: "An absolutely stunning experience. The staff went above and beyond to make my stay memorable. The room was immaculate and the service was world-class." },
  { guestSnapshot: { name: "James Thornton" }, rating: 5, category: "Stay", message: "We chose LuxuryStay for our honeymoon and it was perfect. The attention to detail, the beautiful rooms, and the spectacular views made it unforgettable." },
  { guestSnapshot: { name: "Priya Sharma" }, rating: 5, category: "Service", message: "Travelling with kids can be stressful but the team made everything seamless. The family suite was spacious and the service kept everyone happy." },
];

const safeUser = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };

/* ─── Feedback Submit Modal ─── */
const FeedbackModal = ({ onClose, onSuccess, dark }) => {
  const [form, setForm] = useState({ rating: 5, category: "Stay", title: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const CATS = ["Stay", "Service", "Food", "Cleanliness", "Staff", "Other"];
  const inp = dark
    ? "bg-[#111] border-gray-700 text-white focus:border-[#cbb19d] placeholder-gray-600"
    : "bg-white border-gray-200 text-gray-800 focus:border-[#cbb19d] placeholder-gray-400";
  const text = dark ? "text-white" : "text-gray-900";
  const muted = dark ? "text-gray-400" : "text-gray-500";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return toast.error("Please write a review");
    try {
      setSaving(true);
      await api.post("/guest/feedback", form);
      setDone(true);
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit feedback");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-7 animate-fade-in ${dark ? "bg-[#1a1a1a]" : "bg-white"}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} className={dark ? "text-gray-400" : "text-gray-500"} />
        </button>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle size={40} className="text-emerald-500 mx-auto mb-4" />
            <h3 className={`text-xl font-serif font-semibold mb-2 ${text}`}>Thank You!</h3>
            <p className={`text-sm ${muted}`}>Your feedback has been submitted and will appear shortly.</p>
            <button onClick={onClose} className="mt-6 bg-[#cbb19d] hover:bg-[#b89f8a] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all">
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className={`text-xl font-serif font-semibold mb-6 ${text}`}>Share Your Experience</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Rating */}
              <div>
                <label className={`block text-xs uppercase tracking-widest font-semibold mb-2 ${muted}`}>Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button type="button" key={s} onClick={() => setForm(p => ({...p, rating: s}))}>
                      <Star size={24} className={s <= form.rating ? "text-[#cbb19d] fill-[#cbb19d]" : "text-gray-300"} />
                    </button>
                  ))}
                </div>
              </div>
              {/* Category */}
              <div>
                <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Category</label>
                <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              {/* Title */}
              <div>
                <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Title (optional)</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                  placeholder="Short summary of your stay"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`} />
              </div>
              {/* Message */}
              <div>
                <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${muted}`}>Your Review</label>
                <textarea rows={4} value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))}
                  placeholder="Tell us about your experience…"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${inp}`} />
              </div>
              <button type="submit" disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3 rounded-xl font-medium transition-all disabled:opacity-60">
                {saving ? "Submitting…" : "Submit Feedback"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── Main Testimonials Section ─── */
const Testimonials = () => {
  const { dark } = useTheme();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const user = safeUser();
  const isGuest = String(user?.role || "").toLowerCase() === "guest" && Boolean(user?._id);

  const fetchFeedbacks = async () => {
    try {
      const { data } = await api.get("/guest/public/feedback");
      const list = data?.feedback || [];
      // Show real data if available, else fallback
      setFeedbacks(list.length > 0 ? list : FALLBACK);
    } catch {
      setFeedbacks(FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const onFeedbackSuccess = () => {
    setTimeout(fetchFeedbacks, 800); // re-fetch after a short delay
  };

  const card = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";
  const mutedTxt = dark ? "text-gray-300" : "text-gray-600";
  const titleTxt = dark ? "text-white" : "text-gray-900";

  const displayList = loading ? FALLBACK : feedbacks.slice(0, 6);

  return (
    <>
      {showModal && (
        <FeedbackModal
          onClose={() => setShowModal(false)}
          onSuccess={onFeedbackSuccess}
          dark={dark}
        />
      )}

      <section className={`py-20 px-6 ${dark ? "bg-[#111111]" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-2">Guest Stories</p>
            <h2 className={`text-3xl md:text-4xl font-serif mb-4 ${titleTxt}`}>What Our Guests Say</h2>
            {isGuest && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 border border-[#cbb19d] text-[#cbb19d] hover:bg-[#cbb19d] hover:text-white px-5 py-2 rounded-full text-sm font-medium transition-all"
              >
                <MessageSquarePlus size={15} />
                Share Your Experience
              </button>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {displayList.map((t, i) => {
              const name = t.guestSnapshot?.name || "Anonymous Guest";
              const stars = t.rating || 5;
              const comment = t.message || "";
              const role = t.category || "Guest";

              return (
                <div key={t._id || i} className={`p-7 rounded-2xl border ${card} flex flex-col`}>
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={14}
                        className={j < stars ? "text-[#cbb19d] fill-[#cbb19d]" : "text-gray-300"} />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className={`text-sm leading-relaxed mb-6 flex-1 ${mutedTxt}`}>
                    "{comment}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#cbb19d]/20 flex items-center justify-center shrink-0">
                      <span className="text-[#cbb19d] font-semibold text-sm">{name[0]}</span>
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${titleTxt}`}>{name}</div>
                      <div className={`text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>{role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default Testimonials;
