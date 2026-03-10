import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import RoomCard from "./RoomCard";
import api from "../../api";

const RoomsGrid = () => {
  const { dark } = useTheme();
  const [searchParams] = useSearchParams();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search,        setSearch]        = useState("");
  const [typeFilter,    setTypeFilter]    = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [priceMax,      setPriceMax]      = useState(1000);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get("/rooms/public/available");
        setRooms(data.data || []);
      } catch (err) {
        console.error("Failed to fetch rooms for RoomsGrid:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const filtered = rooms.filter(r => {
    const title = r.roomName || r.roomNumber || "";
    if (search && !title.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "All" && r.roomType !== typeFilter) return false;
    if (availableOnly && r.status !== "Available") return false;
    if (r.pricing?.basePrice > priceMax) return false;
    return true;
  });

  const clearAll = () => {
    setSearch(""); setTypeFilter("All"); setAvailableOnly(false); setPriceMax(1000);
  };

  const inp  = dark
    ? "bg-[#111111] border-gray-700 text-white placeholder-gray-500 focus:border-[#cbb19d]"
    : "bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#cbb19d]";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const filt  = dark ? "bg-[#1a1a1a] border-gray-800" : "bg-[#faf8f6] border-gray-100";

  return (
    <>
      {/* ── Filters bar ── */}
      <div className={`flex flex-wrap gap-4 items-center p-4 rounded-xl border mb-6 ${filt}`}>
        <SlidersHorizontal size={15} className="text-[#cbb19d]" />

        {/* Search */}
        <div className="relative flex-1 min-w-36">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className={`w-full border rounded-lg pl-8 pr-3 py-2 text-sm outline-none transition-colors ${inp}`} />
        </div>

        {/* Type */}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className={`border rounded-lg px-3 py-2 text-sm outline-none ${inp}`}>
          <option value="All">All Types</option>
          <option value="Standard">Standard</option>
          <option value="Deluxe">Deluxe</option>
          <option value="Executive">Executive</option>
          <option value="Family">Family</option>
        </select>

        {/* Price range */}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${muted}`}>Max:</span>
          <input type="range" min="99" max="5000" step="50" value={priceMax}
            onChange={e => setPriceMax(Number(e.target.value))}
            className="w-20 accent-[#cbb19d]" />
          <span className="text-[#cbb19d] text-sm font-medium w-14">${priceMax}</span>
        </div>

        {/* Available only */}
        <label className={`flex items-center gap-2 text-sm cursor-pointer ${muted}`}>
          <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)}
            className="accent-[#cbb19d]" />
          Available Only
        </label>

        {/* Clear */}
        <button onClick={clearAll}
          className={`flex items-center gap-1 text-sm ml-auto ${muted} hover:text-[#cbb19d] transition-colors`}>
          <X size={14} /> Clear
        </button>
      </div>

      {/* Results count */}
      <p className={`text-xs mb-6 ${muted}`}>
        {filtered.length} room{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* ── Grid ── */}
      {loading ? (
        <div className={`text-center py-24 ${muted}`}>Loading available rooms...</div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-24 ${muted}`}>
          <div className="text-5xl mb-4">🛏</div>
          <p className="text-lg font-medium">No rooms found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(room => (
            <RoomCard
              key={room._id}
              id={room._id}
              title={room.roomName || room.roomNumber}
              price={room.pricing?.basePrice}
              img={room.coverImage?.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80"}
              status={room.status}
              type={room.roomType}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default RoomsGrid;
