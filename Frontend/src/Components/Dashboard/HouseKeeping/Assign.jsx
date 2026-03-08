import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../api";

const Assign = () => {
  const [roomBoard, setRoomBoard] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedHouseKeeper, setSelectedHouseKeeper] = useState("");
  const [roomType, setRoomType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [roomsRes, staffRes] = await Promise.all([
        api.get("/housekeeping/room-status"),
        api.get("/auth/staff"),
      ]);

      const roomsData = roomsRes?.data?.rooms || [];
      const housekeepingStaff =
        staffRes?.data?.staff?.filter(
          (staff) => String(staff.role).toLowerCase() === "housekeeping"
        ) || [];

      setRoomBoard(roomsData);
      setStaffList(housekeepingStaff);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch data");
      setRoomBoard([]);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const normalizedRooms = useMemo(() => {
    return roomBoard.map((item) => {
      const room = item?.room || {};
      const task = item?.housekeepingTask || null;

      const isMaintenance = room?.status === "Maintenance";
      const alreadyAssigned =
        !!task?._id &&
        !!task?.assignedTo?._id &&
        ["Assigned", "InProgress"].includes(task?.status);

      return {
        ...room,
        housekeepingTask: task,
        taskId: task?._id || "",
        taskStatus: task?.status || "",
        assignedTo: task?.assignedTo || null,
        taskType: task?.taskType || "",
        priority: task?.priority || "Medium",
        isAssigned: !!task?.assignedTo?._id,
        isSelectable: !isMaintenance && !alreadyAssigned,
      };
    });
  }, [roomBoard]);

  const roomTypeOptions = useMemo(() => {
    return [...new Set(normalizedRooms.map((room) => room.roomType).filter(Boolean))];
  }, [normalizedRooms]);

  const filteredRooms = useMemo(() => {
    return normalizedRooms.filter((room) => {
      const matchesRoomType = roomType
        ? String(room.roomType || "").toLowerCase() === String(roomType).toLowerCase()
        : true;

      const matchesStatus = statusFilter
        ? String(room.status || "").toLowerCase() === String(statusFilter).toLowerCase()
        : true;

      return matchesRoomType && matchesStatus;
    });
  }, [normalizedRooms, roomType, statusFilter]);

  const handleSelectRoom = (roomId, isSelectable) => {
    if (!isSelectable) return;

    setSelectedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleAssign = async () => {
    if (!selectedHouseKeeper) {
      toast.error("Please select a house keeper first");
      return;
    }

    if (selectedRooms.length === 0) {
      toast.error("Please select at least one room");
      return;
    }

    try {
      setAssigning(true);

      const latestRes = await api.get("/housekeeping/room-status");
      const latestBoard = latestRes?.data?.rooms || [];

      const selectedRoomObjects = selectedRooms.map((roomId) => {
        const matched = latestBoard.find((item) => item?.room?._id === roomId);

        if (matched) return matched;

        const fallbackRoom = normalizedRooms.find((room) => room._id === roomId);
        return {
          room: fallbackRoom || null,
          housekeepingTask: fallbackRoom?.housekeepingTask || null,
        };
      });

      await Promise.all(
        selectedRoomObjects.map(async ({ room, housekeepingTask }) => {
          if (!room?._id) return;

          let taskId = housekeepingTask?._id || "";

          if (taskId) {
            await api.patch(`/housekeeping/tasks/${taskId}/assign`, {
              assignedTo: selectedHouseKeeper,
              priority: housekeepingTask?.priority || "Medium",
              note: `Assigned from dashboard for Room ${room.roomNumber}`,
            });
            return;
          }

          await api.post("/housekeeping/tasks", {
            roomId: room._id,
            assignedTo: selectedHouseKeeper,
            taskType:
              room?.status === "Occupied"
                ? "OccupiedCleaning"
                : room?.status === "Cleaning"
                ? "CheckoutCleaning"
                : "Inspection",
            priority: "Medium",
            note: `Manual cleaning request for Room ${room.roomNumber}`,
          });
        })
      );

      toast.success("Task assigned successfully");
      setSelectedRooms([]);
      setSelectedHouseKeeper("");
      fetchData();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to assign task"
      );
    } finally {
      setAssigning(false);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "Available":
        return "text-emerald-600";
      case "Occupied":
        return "text-rose-600";
      case "Cleaning":
        return "text-amber-600";
      case "Maintenance":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getTaskStatusText = (room) => {
    if (!room.taskId) return "Task: Not Created";
    if (room.taskType) return `Task: ${room.taskType}`;
    return "Task: Created";
  };

  const getAssignedText = (room) => {
    if (room.assignedTo?.name) return `Assigned: ${room.assignedTo.name}`;
    return "Not Assigned";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Assign House Keeping</h1>
        <p className="text-sm text-gray-500 mt-1">
          Assign cleaning tasks to housekeeping staff
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              House Keeper
            </label>
            <select
              value={selectedHouseKeeper}
              onChange={(e) => setSelectedHouseKeeper(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10"
            >
              <option value="">Choose...</option>
              {staffList.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10"
            >
              <option value="">All Types</option>
              {roomTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10"
            >
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-[#1e266d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a205c] transition disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Apply Filters"}
            </button>
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
            {filteredRooms.map((room) => {
              const isChecked = selectedRooms.includes(room._id);

              return (
                <div
                  key={room._id}
                  onClick={() => handleSelectRoom(room._id, room.isSelectable)}
                  className={`border rounded-xl p-5 bg-gray-50 relative hover:shadow-md transition-shadow ${
                    room.isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                  } ${
                    isChecked ? "ring-2 ring-[#1e266d] border-[#1e266d]" : "border-gray-200"
                  }`}
                >
                  <div className="absolute top-3 right-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      disabled={!room.isSelectable}
                      className="h-4 w-4 accent-[#1e266d]"
                    />
                  </div>

                  <div className="text-center mt-4">
                    <div className="text-[#1e266d] font-semibold text-sm">
                      Room No. {room.roomNumber}
                    </div>

                    <div className={`text-xs mt-1 font-medium ${getStatusClasses(room.status)}`}>
                      {room.status}
                    </div>

                    {room.floor ? (
                      <div className="text-xs text-gray-500 mt-1">Floor {room.floor}</div>
                    ) : null}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                    <p className="text-xs text-gray-500 text-center">
                      {getTaskStatusText(room)}
                    </p>

                    <p className="text-xs text-gray-500 text-center">
                      {getAssignedText(room)}
                    </p>

                    {room.taskStatus ? (
                      <p className="text-xs text-gray-500 text-center">
                        Status: {room.taskStatus}
                      </p>
                    ) : null}

                    {!room.isSelectable && (
                      <p className="text-[11px] text-red-500 text-center font-medium">
                        Not eligible for assignment
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleAssign}
            disabled={!selectedHouseKeeper || selectedRooms.length === 0 || assigning}
            className="px-6 py-2.5 bg-[#1e266d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a205c] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? "Assigning..." : "Assign Selected Rooms"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assign;