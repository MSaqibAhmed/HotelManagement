import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const RoomStatusOverview = () => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/room/getroom");
      setRooms(Array.isArray(data?.rooms) ? data.rooms : []);
    } catch (err) {
      console.log("ROOM STATUS FETCH ERROR:", err?.response || err);
      toast.error(err?.response?.data?.message || "Failed to fetch rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // ✅ overall stats by status (your backend uses: Available/Occupied/Cleaning/Maintenance)
  const statusCounts = useMemo(() => {
    const counts = {
      Total: 0,
      Available: 0,
      Occupied: 0,
      Cleaning: 0,
      Maintenance: 0,
    };

    (rooms || []).forEach((r) => {
      if (r?.isActive === false) return; // optional: ignore inactive
      counts.Total += 1;
      const s = r?.status || "Available";
      if (counts[s] !== undefined) counts[s] += 1;
    });

    return counts;
  }, [rooms]);

  // ✅ floor wise breakdown from rooms.floor
  const floorData = useMemo(() => {
    const map = new Map();

    (rooms || []).forEach((r) => {
      if (r?.isActive === false) return; // optional
      const floorNum = Number(r?.floor);
      const floorKey = Number.isFinite(floorNum) ? floorNum : "Unknown";

      if (!map.has(floorKey)) {
        map.set(floorKey, {
          floor: floorKey,
          available: 0,
          occupied: 0,
          cleaning: 0,
          maintenance: 0,
        });
      }

      const row = map.get(floorKey);
      const s = (r?.status || "Available").toLowerCase();

      if (s === "available") row.available += 1;
      else if (s === "occupied") row.occupied += 1;
      else if (s === "cleaning") row.cleaning += 1;
      else if (s === "maintenance") row.maintenance += 1;

      map.set(floorKey, row);
    });

    const arr = Array.from(map.values()).sort((a, b) => {
      if (a.floor === "Unknown") return 1;
      if (b.floor === "Unknown") return -1;
      return Number(a.floor) - Number(b.floor);
    });

    return arr.map((x) => ({
      ...x,
      floorLabel:
        x.floor === "Unknown"
          ? "Unknown"
          : Number(x.floor) === 0
          ? "Ground Floor"
          : `Floor ${x.floor}`,
    }));
  }, [rooms]);

  const stats = [
    { title: "Total Rooms", value: statusCounts.Total, bg: "bg-white" },
    { title: "Available", value: statusCounts.Available, bg: "bg-emerald-50" },
    { title: "Occupied", value: statusCounts.Occupied, bg: "bg-rose-50" },
    { title: "Cleaning", value: statusCounts.Cleaning, bg: "bg-sky-50" },
    { title: "Maintenance", value: statusCounts.Maintenance, bg: "bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Room Status Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Live status from database (Available / Occupied / Cleaning / Maintenance).
            </p>
          </div>

          <button
            type="button"
            onClick={fetchRooms}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border font-semibold hover:bg-gray-50 transition disabled:opacity-60"
            style={{ backgroundColor: `${THEME}33`, borderColor: `${THEME}66` }}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          {stats.map((item, index) => (
            <div
              key={index}
              className={`${item.bg} rounded-2xl border border-gray-200 p-5 shadow-sm`}
            >
              <p className="text-sm text-gray-500">{item.title}</p>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2">
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-lg font-extrabold text-gray-900">
              Current Operational Summary
            </h2>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5 border border-emerald-100 bg-emerald-50">
                <p className="text-sm font-semibold text-emerald-700">
                  Ready for Booking
                </p>
                <h3 className="text-2xl font-extrabold text-emerald-800 mt-2">
                  {statusCounts.Available} Rooms
                </h3>
              </div>

              <div className="rounded-2xl p-5 border border-rose-100 bg-rose-50">
                <p className="text-sm font-semibold text-rose-700">
                  Currently Occupied
                </p>
                <h3 className="text-2xl font-extrabold text-rose-800 mt-2">
                  {statusCounts.Occupied} Rooms
                </h3>
              </div>

              <div className="rounded-2xl p-5 border border-sky-100 bg-sky-50">
                <p className="text-sm font-semibold text-sky-700">
                  Pending Cleaning
                </p>
                <h3 className="text-2xl font-extrabold text-sky-800 mt-2">
                  {statusCounts.Cleaning} Rooms
                </h3>
              </div>

              <div className="rounded-2xl p-5 border border-amber-100 bg-amber-50">
                <p className="text-sm font-semibold text-amber-700">
                  Under Maintenance
                </p>
                <h3 className="text-2xl font-extrabold text-amber-800 mt-2">
                  {statusCounts.Maintenance} Rooms
                </h3>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ backgroundColor: `${THEME}33`, borderColor: `${THEME}66` }}
          >
            <h2 className="text-lg font-extrabold text-gray-900">Quick Insight</h2>
            <p className="text-sm text-gray-700 mt-3 leading-6">
              {loading
                ? "Calculating insight..."
                : statusCounts.Available === 0
                ? "No rooms are currently available. Consider expediting cleaning/maintenance."
                : statusCounts.Cleaning + statusCounts.Maintenance > statusCounts.Available
                ? "Cleaning + Maintenance load is high. Monitor to avoid booking pressure."
                : "Booking-ready inventory looks healthy. Keep an eye on cleaning/maintenance to maintain availability."}
            </p>
          </div>
        </div>

        {/* Floor Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900">
              Floor-wise Breakdown
            </h2>
            <p className="text-sm text-gray-500">
              Active rooms only • Rows: {floorData.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-gray-50 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Floor</th>
                  <th className="px-6 py-4">Available</th>
                  <th className="px-6 py-4">Occupied</th>
                  <th className="px-6 py-4">Cleaning</th>
                  <th className="px-6 py-4">Maintenance</th>
                  <th className="px-6 py-4">Total</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {floorData.map((item, index) => {
                  const total =
                    item.available + item.occupied + item.cleaning + item.maintenance;

                  return (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {item.floorLabel}
                      </td>
                      <td className="px-6 py-4 text-emerald-700 font-semibold">
                        {item.available}
                      </td>
                      <td className="px-6 py-4 text-rose-700 font-semibold">
                        {item.occupied}
                      </td>
                      <td className="px-6 py-4 text-sky-700 font-semibold">
                        {item.cleaning}
                      </td>
                      <td className="px-6 py-4 text-amber-700 font-semibold">
                        {item.maintenance}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">{total}</td>
                    </tr>
                  );
                })}

                {floorData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-semibold">
                      {loading ? "Loading..." : "No rooms found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Small note */}
        <p className="text-xs text-gray-400 mt-4">
          Source: GET <span className="font-mono">/room/getroom</span> • Status values from DB.
        </p>
      </div>
    </div>
  );
};

export default RoomStatusOverview;