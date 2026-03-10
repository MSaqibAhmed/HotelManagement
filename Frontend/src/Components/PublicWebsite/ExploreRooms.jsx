import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import RoomCard from "./RoomCard";
import api from "../../api";

const ExploreRooms = () => {
  const { dark } = useTheme();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get("/rooms/public/available");
        // Only slice the first 3 for the home page
        setFeatured(data.data?.slice(0, 3) || []);
      } catch (err) {
        console.error("Failed to fetch rooms for ExploreRooms:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <section className={`py-20 px-6 ${dark ? "bg-[#0f0f0f]" : "bg-[#faf8f6]"}`}>
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-10">
          <h2 className={`text-2xl md:text-3xl font-serif ${dark ? "text-white" : "text-gray-900"}`}>
            Explore Our Rooms
          </h2>
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 text-sm text-[#cbb19d] font-medium
                       border border-[#cbb19d] px-4 py-2 rounded-full
                       hover:bg-[#cbb19d] hover:text-white transition-all duration-200"
          >
            Explore Rooms <ArrowRight size={14} />
          </Link>
        </div>

        {/* ── Cards grid ── */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading rooms...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((room) => (
              <RoomCard
                key={room._id}
                id={room._id}
                title={room.roomName || room.roomNumber}
                price={room.pricing?.basePrice}
                img={room.coverImage?.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80"}
                /* No status/type badges on home page — clean look */
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default ExploreRooms;
