import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, Bed, Maximize, Wifi, Tv, Wind, Coffee, Bath, ArrowLeft, Star } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../api";

const amenityIcons = {
  "Free Wi-Fi": Wifi, "Smart TV": Tv, "Air Conditioning": Wind,
  "Coffee Maker": Coffee, "En-suite Bathroom": Bath,
};

const RoomDetailPage = () => {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const { dark } = useTheme();

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await api.get(`/rooms/public/getsingleroom/${id}`);
        setRoom(data.data);
      } catch (err) {
        console.error("Failed to fetch room details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const muted = dark ? "text-gray-400" : "text-gray-500";
  const text  = dark ? "text-white"    : "text-gray-900";
  const card  = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";

  if (loading) {
    return (
      <div className={`min-h-screen pt-32 pb-20 px-6 text-center ${dark ? "bg-[#111111] text-gray-400" : "bg-white text-gray-600"}`}>
        Loading room details...
      </div>
    );
  }

  if (!room) {
    return (
      <div className={`min-h-screen pt-32 pb-20 px-6 text-center ${dark ? "bg-[#111111] text-gray-400" : "bg-white text-gray-600"}`}>
        <p className="text-xl">Room not found</p>
        <Link to="/rooms" className="text-[#cbb19d] mt-4 inline-block hover:underline border border-[#cbb19d] px-4 py-2 rounded-full">Explore Other Rooms</Link>
      </div>
    );
  }

  // Combine cover image with gallery images
  const allImgs = [room.coverImage?.url, ...(room.galleryImages || []).map(g => g.url)].filter(Boolean);
  if (allImgs.length === 0) {
     allImgs.push("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80");
  }

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 ${dark ? "bg-[#111111]" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">

        <Link to="/rooms" className={`inline-flex items-center gap-2 text-sm mb-8 ${muted} hover:text-[#cbb19d] transition-colors`}>
          <ArrowLeft size={16} /> Back to Rooms
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="rounded-2xl overflow-hidden h-80 md:h-96 shadow-xl">
              <img src={allImgs[activeImg]} alt={room.roomName || room.roomNumber} className="w-full h-full object-cover" />
            </div>
            {allImgs.length > 1 && (
            <div className="flex gap-3 mt-4">
              {allImgs.slice(0, 4).map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`rounded-xl overflow-hidden h-20 flex-1 border-2 transition-all ${activeImg === i ? "border-[#cbb19d]" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full mr-2 ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{room.roomType}</span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${room.status === "Available" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{room.status}</span>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_,i) => <Star key={i} size={14} className="text-[#cbb19d] fill-[#cbb19d]" />)}
              </div>
            </div>

            <h1 className={`text-3xl md:text-4xl font-serif mt-3 ${text}`}>{room.roomName || room.roomNumber}</h1>

            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-[#cbb19d] font-serif text-4xl font-semibold">${room.pricing?.basePrice}</span>
              <span className={`text-sm ${muted}`}>/ night</span>
            </div>

            <div className={`grid grid-cols-3 gap-3 mt-6 p-4 rounded-xl border ${card}`}>
              {[[Users,`${room.capacity} Guests`],[Bed,`${room.bedNumber} ${room.bedType}`],[Maximize,`${room.roomSize}`]].map(([Icon,val],i)=>(
                <div key={i} className="text-center">
                  <Icon size={20} className="text-[#cbb19d] mx-auto mb-1" />
                  <span className={`text-xs ${muted}`}>{val}</span>
                </div>
              ))}
            </div>

            <p className={`mt-6 text-sm leading-relaxed ${text} whitespace-pre-wrap`}>
                <span className="font-semibold block mb-1">Description:</span>
                {room.roomDescription}
            </p>

            {room.amenities && room.amenities.length > 0 && (
                <div className="mt-7">
                <h3 className={`font-semibold text-sm mb-3 ${text}`}>Room Amenities</h3>
                <div className="flex flex-wrap gap-2">
                    {room.amenities.map(a => {
                    const Icon = amenityIcons[a] || Wind; // Fallback icon
                    return (
                        <span key={a} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${dark ? "border-gray-700 text-gray-300 bg-[#1a1a1a]" : "border-gray-200 text-gray-600 bg-white"}`}>
                        {Icon && <Icon size={12} className="text-[#cbb19d]" />} {a}
                        </span>
                    );
                    })}
                </div>
                </div>
            )}

            <div className={`mt-7 p-4 rounded-xl border ${card}`}>
              <h3 className={`font-semibold text-sm mb-3 ${text}`}>Policies</h3>
              <p className={`text-xs whitespace-pre-wrap ${muted}`}>{room.reserveCondition}</p>
            </div>

            <div className="mt-8">
              <Link to="/login"
                className="w-full flex items-center justify-center gap-2 bg-[#cbb19d] text-white py-3.5 rounded-full font-medium hover:bg-[#b89f8a] transition-all shadow-lg shadow-[#cbb19d]/20">
                Login to Book This Room
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailPage;
