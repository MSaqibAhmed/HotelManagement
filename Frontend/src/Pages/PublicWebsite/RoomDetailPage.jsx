import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Users, BedDouble, Maximize2,
  ArrowLeft, Star, CalendarCheck, X, Lock, UserPlus, Hotel,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api";

/* ─── Login-Required Modal ─── */
const LoginModal = ({ onClose, onRegister, onLogin }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
      >
        <X size={14} className="text-gray-600" />
      </button>

      <div className="w-16 h-16 rounded-full bg-[#faf3ec] flex items-center justify-center mx-auto mb-5">
        <Lock size={28} className="text-[#cbb19d]" />
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
      <p className="text-sm text-gray-500 mb-7 leading-relaxed">
        You need an account to make a reservation.
        Create one for free or sign in to continue.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRegister}
          className="w-full flex items-center justify-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a]
                     text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-[#cbb19d]/25"
        >
          <UserPlus size={16} />
          Create an Account
        </button>

        <button
          onClick={onLogin}
          className="w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl
                     hover:border-[#cbb19d] hover:text-[#cbb19d] transition-all"
        >
          Sign In
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-5">
        Already have an account?{" "}
        <button onClick={onLogin} className="text-[#cbb19d] hover:underline font-medium">
          Login here
        </button>
      </p>
    </div>
  </div>
);

/* ─── Main Page ─── */
const RoomDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const { dark } = useTheme();

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await api.get(`/room/public/getsingleroom/${id}`);
        setRoom(data.room || data.data || data);
      } catch (err) {
        console.error("Failed to fetch room details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  /* ── Auth check ── */
  const getAuthState = () => {
    try {
      const token = localStorage.getItem("token");
      const user  = JSON.parse(localStorage.getItem("user") || "{}");
      if (token && user?._id) return { isAuthed: true, user };
    } catch {/* empty */}
    return { isAuthed: false, user: null };
  };

  const handleReservationClick = () => {
    const { isAuthed, user } = getAuthState();
    if (!isAuthed || !user) {
      setShowModal(true);
      return;
    }
    
    const params = new URLSearchParams();
    if (room?.roomType) params.set("roomType", room.roomType);
    
    // Check if staff/admin vs guest
    const role = String(user.role || "").toLowerCase();
    if (["admin", "manager", "receptionist"].includes(role)) {
      navigate(`/dashboard/reservations/create?${params.toString()}`);
    } else {
      navigate(`/guest/create-reservation?${params.toString()}`);
    }
  };

  const muted = dark ? "text-gray-400" : "text-gray-500";
  const text  = dark ? "text-white"    : "text-gray-900";
  const card  = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";

  if (loading) {
    return (
      <div className={`min-h-screen pt-32 pb-20 px-6 text-center ${dark ? "bg-[#111111] text-gray-400" : "bg-white text-gray-600"}`}>
        <div className="flex justify-center mb-4">
          <Hotel size={40} className="text-[#cbb19d] animate-pulse" />
        </div>
        <p>Loading room details...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={`min-h-screen pt-32 pb-20 px-6 text-center ${dark ? "bg-[#111111] text-gray-400" : "bg-white text-gray-600"}`}>
        <p className="text-xl">Room not found</p>
        <Link to="/rooms" className="text-[#cbb19d] mt-4 inline-block hover:underline border border-[#cbb19d] px-4 py-2 rounded-full">
          Explore Other Rooms
        </Link>
      </div>
    );
  }

  const allImgs = [room.coverImage?.url, ...(room.galleryImages || []).map(g => g.url)].filter(Boolean);
  if (allImgs.length === 0) {
    allImgs.push("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80");
  }

  return (
    <>
      {showModal && (
        <LoginModal
          onClose={() => setShowModal(false)}
          onRegister={() => navigate("/register")}
          onLogin={() => navigate("/login")}
        />
      )}

      <div className={`min-h-screen pt-24 pb-20 px-6 ${dark ? "bg-[#111111]" : "bg-white"}`}>
        <div className="max-w-6xl mx-auto">

          <Link to="/rooms" className={`inline-flex items-center gap-2 text-sm mb-8 ${muted} hover:text-[#cbb19d] transition-colors`}>
            <ArrowLeft size={16} /> Back to Rooms
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* ── Images ── */}
            <div>
              <div className="rounded-2xl overflow-hidden h-80 md:h-96 shadow-xl">
                <img
                  src={allImgs[activeImg]}
                  alt={room.roomName || room.roomNumber}
                  className="w-full h-full object-cover"
                />
              </div>
              {allImgs.length > 1 && (
                <div className="flex gap-3 mt-4">
                  {allImgs.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`rounded-xl overflow-hidden h-20 flex-1 border-2 transition-all ${
                        activeImg === i ? "border-[#cbb19d]" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Info ── */}
            <div>
              {/* Type badge + stars (no status badge) */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  {room.roomType}
                </span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-[#cbb19d] fill-[#cbb19d]" />)}
                </div>
              </div>

              <h1 className={`text-3xl md:text-4xl font-serif mt-3 ${text}`}>
                {room.roomName || room.roomNumber}
              </h1>

              {/* Price - PKR */}
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-[#cbb19d] font-serif text-4xl font-semibold">PKR {room.pricing?.basePrice?.toLocaleString()}</span>
                <span className={`text-sm ${muted}`}>/ night</span>
              </div>

              {/* Quick stats — Lucide icons only */}
              <div className={`grid grid-cols-3 gap-3 mt-6 p-4 rounded-xl border ${card}`}>
                {[
                  [Users,    `${room.capacity} Guests`],
                  [BedDouble, `${room.bedNumber} ${room.bedType}`],
                  [Maximize2, `${room.roomSize}`],
                ].map(([Icon, val], i) => (
                  <div key={i} className="text-center">
                    <Icon size={20} className="text-[#cbb19d] mx-auto mb-1" />
                    <span className={`text-xs ${muted}`}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p className={`mt-6 text-sm leading-relaxed ${text} whitespace-pre-wrap`}>
                <span className="font-semibold block mb-1">Description:</span>
                {room.roomDescription}
              </p>

              {/* Policies */}
              <div className={`mt-7 p-4 rounded-xl border ${card}`}>
                <h3 className={`font-semibold text-sm mb-3 ${text}`}>Policies</h3>
                <p className={`text-xs whitespace-pre-wrap ${muted}`}>{room.reserveCondition}</p>
              </div>

              {/* ── CREATE RESERVATION BUTTON — always shown ── */}
              <div className="mt-8">
                <button
                  onClick={handleReservationClick}
                  className="w-full flex items-center justify-center gap-2 bg-[#cbb19d] hover:bg-[#b89f8a]
                             text-white py-3.5 rounded-full font-medium transition-all
                             shadow-lg shadow-[#cbb19d]/25 active:scale-95"
                >
                  <CalendarCheck size={18} />
                  Create Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomDetailPage;
