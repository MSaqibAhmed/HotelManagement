import React from "react";

const THEME = "#d6c3b3";

const RoomStatusOverview = () => {
  const stats = [
    { title: "Total Rooms", value: 48, bg: "bg-white" },
    { title: "Available", value: 18, bg: "bg-emerald-50" },
    { title: "Occupied", value: 16, bg: "bg-rose-50" },
    { title: "Cleaning", value: 8, bg: "bg-sky-50" },
    { title: "Maintenance", value: 6, bg: "bg-amber-50" },
  ];

  const floorData = [
    { floor: "Ground Floor", available: 4, occupied: 3, cleaning: 1, maintenance: 1 },
    { floor: "First Floor", available: 6, occupied: 5, cleaning: 2, maintenance: 1 },
    { floor: "Second Floor", available: 5, occupied: 4, cleaning: 3, maintenance: 2 },
    { floor: "Third Floor", available: 3, occupied: 4, cleaning: 2, maintenance: 2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            Room Status Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor overall room occupancy, cleaning progress, and maintenance load.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
          {stats.map((item, index) => (
            <div
              key={index}
              className={`${item.bg} rounded-2xl border border-gray-200 p-5 shadow-sm`}
            >
              <p className="text-sm text-gray-500">{item.title}</p>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-2">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-lg font-extrabold text-gray-900">Current Operational Summary</h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5 border border-emerald-100 bg-emerald-50">
                <p className="text-sm font-semibold text-emerald-700">Ready for Booking</p>
                <h3 className="text-2xl font-extrabold text-emerald-800 mt-2">18 Rooms</h3>
              </div>
              <div className="rounded-2xl p-5 border border-rose-100 bg-rose-50">
                <p className="text-sm font-semibold text-rose-700">Currently Occupied</p>
                <h3 className="text-2xl font-extrabold text-rose-800 mt-2">16 Rooms</h3>
              </div>
              <div className="rounded-2xl p-5 border border-sky-100 bg-sky-50">
                <p className="text-sm font-semibold text-sky-700">Pending Cleaning</p>
                <h3 className="text-2xl font-extrabold text-sky-800 mt-2">8 Rooms</h3>
              </div>
              <div className="rounded-2xl p-5 border border-amber-100 bg-amber-50">
                <p className="text-sm font-semibold text-amber-700">Under Maintenance</p>
                <h3 className="text-2xl font-extrabold text-amber-800 mt-2">6 Rooms</h3>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ backgroundColor: `${THEME}33`, borderColor: `${THEME}66` }}
          >
            <h2 className="text-lg font-extrabold text-gray-900">Quick Insight</h2>
            <p className="text-sm text-gray-700 mt-3 leading-6">
              Current booking-ready inventory is healthy, but cleaning and maintenance
              load should be monitored closely to avoid booking pressure in peak hours.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-extrabold text-gray-900">Floor-wise Breakdown</h2>
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
                    <tr key={index}>
                      <td className="px-6 py-4 font-semibold text-gray-900">{item.floor}</td>
                      <td className="px-6 py-4 text-emerald-700 font-semibold">{item.available}</td>
                      <td className="px-6 py-4 text-rose-700 font-semibold">{item.occupied}</td>
                      <td className="px-6 py-4 text-sky-700 font-semibold">{item.cleaning}</td>
                      <td className="px-6 py-4 text-amber-700 font-semibold">{item.maintenance}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomStatusOverview;