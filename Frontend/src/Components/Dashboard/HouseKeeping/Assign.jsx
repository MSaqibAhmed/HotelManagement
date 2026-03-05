import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../api";

const Assign = () => {
  const [rooms, setRooms] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedHouseKeeper, setSelectedHouseKeeper] = useState("");
  const [roomType, setRoomType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, staffRes] = await Promise.all([
        api.get("/room/getroom"),
        api.get("/auth/staff"),
      ]);
      setRooms(roomsRes.data.rooms || []);
      const housekeepingStaff = staffRes.data.staff?.filter((s) => s.role === "housekeeping") || [];
      setStaffList(housekeepingStaff);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch data");
      setRooms([]);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRooms = rooms.filter((room) => {
    const matchesRoomType = roomType ? room.roomType === roomType : true;
    const matchesStatus = statusFilter ? room.status === statusFilter : true;
    return matchesRoomType && matchesStatus;
  });

  const handleAssign = async () => {
    if (!selectedHouseKeeper) {
      toast.error("Please select a house keeper first");
      return;
    }
    if (filteredRooms.length === 0) {
      toast.error("No rooms available to assign");
      return;
    }
    try {
      setAssigningId("assigning");
      await api.post("/housekeeping/assign-task", {
        roomId: filteredRooms[0]._id,
        staffId: selectedHouseKeeper,
        roomType,
      });
      toast.success("Task assigned successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign task");
    } finally {
      setAssigningId(null);
    }
  };

  const handleToggle = async (roomId) => {
    try {
      setAssigningId(roomId);
      const room = rooms.find((r) => r._id === roomId);
      await api.patch(`/housekeeping/toggle-assignment/${roomId}`, {
        isAssigned: !room.isAssigned,
      });
      setRooms((prev) =>
        prev.map((r) =>
          r._id === roomId ? { ...r, isAssigned: !r.isAssigned } : r
        )
      );
      toast.success("Assignment status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update assignment");
    } finally {
      setAssigningId(null);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "Available": return "text-emerald-600";
      case "Occupied": return "text-rose-600";
      case "Cleaning": return "text-amber-600";
      case "Maintenance": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Assign House Keeping</h1>
        <p className="text-sm text-gray-500 mt-1">Assign cleaning tasks to housekeeping staff</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">House Keeper</label>
            <select value={selectedHouseKeeper} onChange={(e) => setSelectedHouseKeeper(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10">
              <option value="">Choose...</option>
              {staffList.map((staff) => (
                <option key={staff._id} value={staff._id}>{staff.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Room Type</label>
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10">
              <option value="">All Types</option>
              <option value="Single">Single Room</option>
              <option value="Double">Double Room</option>
              <option value="Twin">Twin Room</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10">
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleAssign} disabled={assigningId === "assigning"} className="w-full px-4 py-2.5 bg-[#1e266d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a205c] transition disabled:opacity-60">Apply Filters</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 font-medium">No rooms found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map((room) => (
              <div key={room._id} className="border border-gray-200 rounded-xl p-5 bg-gray-50 relative hover:shadow-md transition-shadow">
                <div className="absolute top-3 right-3">
                  <button
                    onClick={() => handleToggle(room._id)}
                    disabled={assigningId === room._id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${room.isAssigned ? "bg-emerald-500" : "bg-gray-300"} ${assigningId === room._id ? "opacity-60 cursor-not-allowed" : ""}`}
                    title="Toggle assignment"
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transform transition-transform ${room.isAssigned ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div className="text-center mt-4">
                  <div className="text-[#1e266d] font-semibold text-sm">Room No. {room.roomNumber}</div>
                  <div className={`text-xs mt-1 font-medium ${getStatusClasses(room.status)}`}>{room.status}</div>
                  {room.floor && <div className="text-xs text-gray-500 mt-1">Floor {room.floor}</div>}
                </div>
                {room.isAssigned && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">Assigned</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button onClick={handleAssign} disabled={!selectedHouseKeeper || filteredRooms.length === 0 || assigningId === "assigning"} className="px-6 py-2.5 bg-[#1e266d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a205c] transition disabled:opacity-50 disabled:cursor-not-allowed">
            {assigningId === "assigning" ? "Assigning..." : "Assign Selected Rooms"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assign;
