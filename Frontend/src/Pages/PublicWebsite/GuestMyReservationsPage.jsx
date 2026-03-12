import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays, Search, Eye, X, Edit2, FileText, Plus,
  BedDouble, Clock, Users, CheckCircle2, XCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "react-toastify";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api";

const ROOM_TYPES = ["Standard", "Deluxe", "Executive", "Family"];

const safeUser = () => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } };

const fmtDate = (v) => { if (!v) return "N/A"; const d = new Date(v); return isNaN(d) ? "N/A" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };
const fmtPKR = (v) => `PKR ${Number(v || 0).toLocaleString()}`;
const toMidnight = (s) => s ? `${s}T00:00:00` : "";
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };

const statusColors = {
  Confirmed: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  "Checked-In": "bg-blue-100 text-blue-700",
  "Checked-Out": "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-100 text-red-600",
};

const normalize = (item, user) => {
  const room = item?.room || {};
  const rs = item?.roomSnapshot || {};
  const gs = item?.guestSnapshot || {};
  const pay = item?.payment || {};
  const rawStatus = item?.bookingStatus || item?.status || "Pending";
  return {
    _id: item?._id,
    reservationNumber: item?.reservationNumber || "N/A",
    guestName: gs?.name || user?.name || "Guest",
    guestEmail: gs?.email || user?.email || "",
    roomType: item?.roomType || room?.roomType || rs?.roomType || "N/A",
    roomNumber: room?.roomNumber || rs?.roomNumber || "—",
    checkInDate: item?.checkInDate || "",
    checkOutDate: item?.checkOutDate || "",
    status: rawStatus,
    amount: Number(pay?.amount ?? item?.amount ?? 0),
    nights: Number(item?.nights || 0),
    adults: Number(item?.adults || 1),
    children: Number(item?.children || 0),
    specialRequests: item?.specialRequests || "",
    createdAt: item?.createdAt || "",
    paymentMethod: item?.payment?.method || item?.paymentMethod || "—",
  };
};

/* ─ Edit Modal ─ */
const EditModal = ({ reservation, onClose, onSaved, dark }) => {
  const [form, setForm] = useState({
    roomType: reservation.roomType,
    checkInDate: reservation.checkInDate ? new Date(reservation.checkInDate).toISOString().split("T")[0] : "",
    checkOutDate: reservation.checkOutDate ? new Date(reservation.checkOutDate).toISOString().split("T")[0] : "",
    adults: reservation.adults,
    children: reservation.children,
    paymentMethod: reservation.paymentMethod !== "—" ? reservation.paymentMethod : "Cash",
    specialRequests: reservation.specialRequests,
  });
  const [saving, setSaving] = useState(false);
  const today = todayStr();

  const inp = dark
    ? "bg-[#111] border-gray-700 text-white focus:border-[#cbb19d]"
    : "bg-white border-gray-200 text-gray-800 focus:border-[#cbb19d]";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.checkInDate || !form.checkOutDate) return toast.error("Dates required");
    if (new Date(form.checkOutDate) <= new Date(form.checkInDate)) return toast.error("Check-out must be after check-in");
    try {
      setSaving(true);
      await api.put(`/guest/reservations/${reservation._id}`, {
        roomType: form.roomType,
        checkInDate: toMidnight(form.checkInDate),
        checkOutDate: toMidnight(form.checkOutDate),
        adults: Number(form.adults),
        children: Number(form.children),
        paymentMethod: form.paymentMethod,
        specialRequests: form.specialRequests.trim(),
      });
      toast.success("Reservation updated!");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-7 ${dark ? "bg-[#1a1a1a]" : "bg-white"}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} className={dark ? "text-gray-400" : "text-gray-500"} />
        </button>
        <h2 className={`text-xl font-serif font-semibold mb-6 ${dark ? "text-white" : "text-gray-900"}`}>Modify Reservation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Room Type</label>
            <select value={form.roomType} onChange={e => setForm(p => ({...p, roomType: e.target.value}))}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`}>
              {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Check-In</label>
              <input type="date" min={today} value={form.checkInDate}
                onChange={e => setForm(p => ({...p, checkInDate: e.target.value}))}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`} />
            </div>
            <div>
              <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Check-Out</label>
              <input type="date" min={form.checkInDate || today} value={form.checkOutDate}
                onChange={e => setForm(p => ({...p, checkOutDate: e.target.value}))}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Adults</label>
              <input type="number" min={1} max={10} value={form.adults}
                onChange={e => setForm(p => ({...p, adults: e.target.value}))}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`} />
            </div>
            <div>
              <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Children</label>
              <input type="number" min={0} max={10} value={form.children}
                onChange={e => setForm(p => ({...p, children: e.target.value}))}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none ${inp}`} />
            </div>
          </div>
          <div>
            <label className={`block text-xs uppercase tracking-widest font-semibold mb-1.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>Special Requests</label>
            <textarea rows={2} value={form.specialRequests}
              onChange={e => setForm(p => ({...p, specialRequests: e.target.value}))}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none resize-none ${inp}`} />
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-[#cbb19d] hover:bg-[#b89f8a] text-white py-3 rounded-xl font-medium transition-all disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─ Detail Modal ─ */
const DetailModal = ({ res, onClose, dark }) => {
  const card = dark ? "bg-[#222] border-gray-800" : "bg-[#faf8f6] border-gray-100";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const text = dark ? "text-white" : "text-gray-900";
  const Row = ({ label, val }) => (
    <div className="flex justify-between py-2 border-b last:border-0 border-gray-100 dark:border-gray-800">
      <span className={`text-sm ${muted}`}>{label}</span>
      <span className={`text-sm font-medium ${text}`}>{val}</span>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-7 ${dark ? "bg-[#1a1a1a]" : "bg-white"}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <X size={16} className={dark ? "text-gray-400" : "text-gray-500"} />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-[#cbb19d]/20 flex items-center justify-center">
            <CalendarDays size={20} className="text-[#cbb19d]" />
          </div>
          <div>
            <p className={`font-semibold ${text}`}>{res.reservationNumber}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${statusColors[res.status] || "bg-gray-100 text-gray-600"}`}>{res.status}</span>
          </div>
        </div>
        <div className={`rounded-xl border p-4 ${card} mb-4`}>
          <Row label="Room Type" val={res.roomType} />
          <Row label="Room No." val={res.roomNumber} />
          <Row label="Check-In" val={fmtDate(res.checkInDate)} />
          <Row label="Check-Out" val={fmtDate(res.checkOutDate)} />
          <Row label="Nights" val={res.nights} />
          <Row label="Guests" val={`${res.adults} Adults, ${res.children} Child`} />
          <Row label="Amount" val={fmtPKR(res.amount)} />
          <Row label="Payment" val={res.paymentMethod} />
        </div>
        {res.specialRequests && (
          <p className={`text-xs ${muted}`}><span className="font-semibold">Requests:</span> {res.specialRequests}</p>
        )}
      </div>
    </div>
  );
};

/* ─ Main Page ─ */
const GuestMyReservationsPage = () => {
  const { dark } = useTheme();
  const navigate = useNavigate();
  const user = useMemo(safeUser, []);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [viewRes, setViewRes] = useState(null);
  const [editRes, setEditRes] = useState(null);
  const [cancellingId, setCancellingId] = useState("");

  const PER_PAGE = 6;

  useEffect(() => {
    if (!user?._id) { navigate("/login"); return; }
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/guest/reservations");
      setReservations((data?.reservations || data || []).map(r => normalize(r, user)));
    } catch { toast.error("Failed to load reservations"); }
    finally { setLoading(false); }
  };

  const handleCancel = async (res) => {
    if (!window.confirm(`Cancel reservation ${res.reservationNumber}?`)) return;
    try {
      setCancellingId(res._id);
      await api.patch(`/guest/reservations/${res._id}/cancel`);
      toast.success("Reservation cancelled");
      fetchReservations();
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to cancel"); }
    finally { setCancellingId(""); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reservations.filter(r =>
      (statusFilter === "All" || r.status === statusFilter) &&
      (!q || r.reservationNumber?.toLowerCase().includes(q) || r.roomType?.toLowerCase().includes(q))
    );
  }, [reservations, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(() => ({
    total: reservations.length,
    active: reservations.filter(r => ["Pending","Confirmed"].includes(r.status)).length,
    checkedIn: reservations.filter(r => r.status === "Checked-In").length,
    cancelled: reservations.filter(r => r.status === "Cancelled").length,
  }), [reservations]);

  const bg = dark ? "bg-[#111111]" : "bg-white";
  const text = dark ? "text-white" : "text-gray-900";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const card = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";
  const inp = dark ? "bg-[#111] border-gray-700 text-white placeholder-gray-600 focus:border-[#cbb19d]"
                   : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#cbb19d]";

  return (
    <>
      {viewRes && <DetailModal res={viewRes} onClose={() => setViewRes(null)} dark={dark} />}
      {editRes && <EditModal reservation={editRes} onClose={() => setEditRes(null)} onSaved={fetchReservations} dark={dark} />}

      <div className={`min-h-screen pt-24 pb-20 px-6 ${bg}`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
            <div>
              <p className="text-[#cbb19d] text-sm font-medium uppercase tracking-widest mb-1">My Account</p>
              <h1 className={`text-3xl md:text-4xl font-serif ${text}`}>My Reservations</h1>
              <p className={`text-sm mt-1 ${muted}`}>Track, modify or cancel your bookings</p>
            </div>
            <Link to="/guest/create-reservation"
              className="inline-flex items-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md shadow-[#cbb19d]/20">
              <Plus size={15} /> New Reservation
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              [CalendarDays, "Total", stats.total, "text-[#cbb19d]"],
              [CheckCircle2, "Active", stats.active, "text-emerald-500"],
              [BedDouble, "Checked-In", stats.checkedIn, "text-blue-500"],
              [XCircle, "Cancelled", stats.cancelled, "text-red-400"],
            ].map(([Icon, label, val, cls]) => (
              <div key={label} className={`rounded-2xl border p-5 ${card}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Icon size={18} className={cls} />
                  <span className={`text-xs uppercase tracking-widest font-semibold ${muted}`}>{label}</span>
                </div>
                <p className={`text-3xl font-serif font-semibold ${text}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className={`rounded-2xl border p-4 mb-6 flex flex-wrap gap-3 items-center ${card}`}>
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#cbb19d]" />
              <input type="text" placeholder="Search by reservation no or room type…"
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-colors ${inp}`} />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className={`px-4 py-2.5 border rounded-xl text-sm outline-none ${inp} min-w-40`}>
              <option value="All">All Status</option>
              {["Pending","Confirmed","Checked-In","Checked-Out","Cancelled"].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <span className={`text-sm ${muted}`}>{filtered.length} reservations</span>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#cbb19d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paginated.length === 0 ? (
            <div className={`rounded-2xl border p-16 text-center ${card}`}>
              <CalendarDays size={40} className="text-[#cbb19d]/40 mx-auto mb-4" />
              <p className={`text-lg font-medium ${muted}`}>No reservations found</p>
              <p className={`text-sm mt-1 ${muted}`}>
                {search || statusFilter !== "All" ? "Try different filters." : "Book your first room today!"}
              </p>
              {!search && statusFilter === "All" && (
                <Link to="/rooms" className="inline-block mt-5 text-sm text-[#cbb19d] hover:underline">Explore Rooms →</Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map(res => (
                <div key={res._id} className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:shadow-lg ${card}`}>
                  {/* Left avatar */}
                  <div className="w-11 h-11 rounded-full bg-[#cbb19d]/20 flex items-center justify-center shrink-0">
                    <span className="text-[#cbb19d] font-bold text-base">{res.reservationNumber?.slice(-2)}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className={`font-semibold ${text}`}>{res.reservationNumber}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[res.status] || "bg-gray-100 text-gray-600"}`}>
                        {res.status}
                      </span>
                    </div>
                    <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${muted}`}>
                      <span className="flex items-center gap-1"><BedDouble size={12} /> {res.roomType}</span>
                      <span className="flex items-center gap-1"><CalendarDays size={12} /> {fmtDate(res.checkInDate)} → {fmtDate(res.checkOutDate)}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {res.adults + res.children} guests</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-[#cbb19d] font-serif text-lg font-semibold">{fmtPKR(res.amount)}</p>
                    <p className={`text-xs ${muted}`}>{res.nights} nights</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setViewRes(res)} className={`p-2 rounded-lg transition ${dark ? "hover:bg-gray-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`} title="View">
                      <Eye size={15} />
                    </button>
                    {res.status === "Pending" && (
                      <button onClick={() => setEditRes(res)} className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition" title="Modify">
                        <Edit2 size={15} />
                      </button>
                    )}
                    {["Confirmed","Checked-In","Checked-Out"].includes(res.status) && (
                      <button onClick={() => {
                        const w = window.open("", "_blank", "width=700,height=900");
                        if (w) {
                          w.document.write(`<!DOCTYPE html><html><head><title>Invoice</title><style>body{font-family:Arial;margin:40px}h2{color:#cbb19d}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}</style></head><body><h2>Reservation Invoice</h2><div class="row"><span>Reservation No</span><span>${res.reservationNumber}</span></div><div class="row"><span>Room</span><span>${res.roomType} - ${res.roomNumber}</span></div><div class="row"><span>Check-In</span><span>${fmtDate(res.checkInDate)}</span></div><div class="row"><span>Check-Out</span><span>${fmtDate(res.checkOutDate)}</span></div><div class="row"><span>Nights</span><span>${res.nights}</span></div><div class="row"><span>Guests</span><span>${res.adults} Adults, ${res.children} Children</span></div><div class="row" style="font-weight:bold"><span>Total</span><span>${fmtPKR(res.amount)}</span></div></body></html>`);
                          w.document.close(); setTimeout(() => w.print(), 400);
                        }
                      }} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition" title="Invoice">
                        <FileText size={15} />
                      </button>
                    )}
                    {!["Checked-In","Checked-Out","Cancelled"].includes(res.status) && (
                      <button onClick={() => handleCancel(res)} disabled={cancellingId === res._id}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition disabled:opacity-50" title="Cancel">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className={`p-2 rounded-full border transition ${dark ? "border-gray-700 text-gray-400 hover:border-[#cbb19d]" : "border-gray-200 text-gray-500 hover:border-[#cbb19d]"} disabled:opacity-40`}>
                <ChevronLeft size={16} />
              </button>
              <span className={`text-sm ${muted}`}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className={`p-2 rounded-full border transition ${dark ? "border-gray-700 text-gray-400 hover:border-[#cbb19d]" : "border-gray-200 text-gray-500 hover:border-[#cbb19d]"} disabled:opacity-40`}>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GuestMyReservationsPage;
