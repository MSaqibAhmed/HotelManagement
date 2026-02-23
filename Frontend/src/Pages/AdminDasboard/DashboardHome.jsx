import React, { useMemo } from "react";

const DashboardHome = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-[#1e266d]">Welcome, {user?.name || "User"} 👋</h2>
        <p className="text-gray-600 mt-1">
          Role: <span className="font-semibold">{user?.role || "guest"}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Total Rooms</p>
          <p className="text-2xl font-extrabold mt-1">--</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Active Reservations</p>
          <p className="text-2xl font-extrabold mt-1">--</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-extrabold mt-1">--</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;