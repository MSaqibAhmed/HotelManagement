import React from "react";
import { Link } from "react-router-dom";
import {
  LuPencilLine,
  LuTrash2,
  LuPlus,
  LuSearch,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";

const THEME = "#d6c3b3";

const RoomList = () => {
  const rooms = [
    { id: 3, type: "Family Room", price: 4500, charge: 150, capacity: 4, size: "Queen", bedNo: 2, bedType: "Standard Queen", status: "Available" },
    { id: 4, type: "Deluxe Suite", price: 5500, charge: 130, capacity: 3, size: "King", bedNo: 1, bedType: "Luxury King", status: "Occupied" },
    { id: 5, type: "Standard Room", price: 3000, charge: 80, capacity: 2, size: "Queen", bedNo: 1, bedType: "Standard Queen", status: "Cleaning" },
    { id: 6, type: "Signal Room", price: 2500, charge: 70, capacity: 1, size: "Twin", bedNo: 1, bedType: "Standard Twin", status: "Maintenance" },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "Available":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Occupied":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "Cleaning":
        return "bg-sky-50 text-sky-600 border-sky-100";
      case "Maintenance":
        return "bg-amber-50 text-amber-600 border-amber-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 text-gray-700">
      <div className="max-w-[1400px] mx-auto">
        {/* Top */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Room List</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage rooms, pricing, and availability status.
            </p>
          </div>

          <Link
            to="/dashboard/room-management/add-room"
            className="px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm border transition"
            style={{
              backgroundColor: THEME,
              borderColor: `${THEME}66`,
              color: "#111827",
            }}
          >
            <LuPlus size={18} />
            Add Room
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-sm font-semibold text-gray-500">
              Show{" "}
              <select
                className="bg-gray-50 rounded-lg px-2 py-1 text-gray-700 border border-gray-200 ml-2"
                defaultValue="10"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>{" "}
              entries
            </div>

            <div className="relative w-full md:w-80">
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                placeholder="Search rooms..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ boxShadow: "none" }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Room Type</th>
                  <th className="px-6 py-4">Room Price</th>
                  <th className="px-6 py-4">Bed Charge</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Room Size</th>
                  <th className="px-6 py-4">Bed No</th>
                  <th className="px-6 py-4">Bed Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 text-sm">
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="transition-colors"
                    style={{ cursor: "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${THEME}14`)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td className="px-6 py-4 font-bold text-gray-400">#{room.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{room.type}</td>
                    <td className="px-6 py-4 font-semibold text-gray-700 font-mono">Rs {room.price}</td>
                    <td className="px-6 py-4 text-gray-600">Rs {room.charge}</td>
                    <td className="px-6 py-4 text-gray-600">{room.capacity}</td>
                    <td className="px-6 py-4 text-gray-600">{room.size}</td>
                    <td className="px-6 py-4 text-gray-600">{room.bedNo}</td>
                    <td className="px-6 py-4 text-gray-600">{room.bedType}</td>

                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-extrabold border uppercase ${getStatusStyle(room.status)}`}>
                        {room.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-4">
                        <button className="text-gray-400 hover:text-gray-900 transition" title="Edit">
                          <LuPencilLine size={18} />
                        </button>
                        <button className="text-gray-400 hover:text-rose-600 transition" title="Delete">
                          <LuTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-3 bg-gray-50">
            <p className="text-xs font-bold text-gray-500 uppercase">
              Showing 1 to {rooms.length} entries
            </p>

            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-gray-900 transition" title="Prev">
                <LuChevronLeft size={20} />
              </button>

              <button
                className="w-8 h-8 rounded-lg font-extrabold text-xs border"
                style={{ backgroundColor: THEME, borderColor: `${THEME}66`, color: "#111827" }}
              >
                1
              </button>

              <button className="p-2 text-gray-400 hover:text-gray-900 transition" title="Next">
                <LuChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomList;