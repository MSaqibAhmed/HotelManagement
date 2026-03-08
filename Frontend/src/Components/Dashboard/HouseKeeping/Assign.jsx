import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { FaTimes, FaCheckCircle, FaCircle, FaInfoCircle, FaClipboardList } from "react-icons/fa";
import api from "../../../api";

const Assign = () => {
  const [roomBoard, setRoomBoard] = useState([]);
  const [guestRequests, setGuestRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedHouseKeeper, setSelectedHouseKeeper] = useState("");
  const [roomType, setRoomType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [roomsRes, staffRes, requestsRes] = await Promise.all([
        api.get("/housekeeping/room-status"),
        api.get("/auth/staff"),
        api.get("/housekeeping/guest-requests").catch(() => ({ data: { requests: [] } })),
      ]);

      const roomsData = roomsRes?.data?.rooms || [];
      const housekeepingStaff =
        staffRes?.data?.staff?.filter(
          (staff) => String(staff.role).toLowerCase() === "housekeeping"
        ) || [];
      const requests = requestsRes?.data?.requests || [];

      setRoomBoard(roomsData);
      setStaffList(housekeepingStaff);
      setGuestRequests(requests);
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

  // Build a map: roomId -> guestRequest
  const requestByRoom = useMemo(() => {
    const map = {};
    guestRequests.forEach((req) => {
      const roomId = req?.room?._id || req?.room;
      if (roomId) {
        if (!map[roomId]) map[roomId] = req;
      }
    });
    return map;
  }, [guestRequests]);

  const normalizedRooms = useMemo(() => {
    return roomBoard.map((item) => {
      const room = item?.room || {};
      const task = item?.housekeepingTask || null;
      // Use guestRequest from roomBoard OR from separate guest requests endpoint
      const guestReq = item?.guestRequest || requestByRoom[String(room._id)] || null;

      const isMaintenance = room?.status === "Maintenance";
      const alreadyAssigned =
        !!task?._id &&
        !!task?.assignedTo?._id &&
        ["Assigned", "InProgress"].includes(task?.status);

      return {
        ...room,
        housekeepingTask: task,
        guestRequest: guestReq,
        taskId: task?._id || "",
        taskStatus: task?.status || "",
        assignedTo: task?.assignedTo || null,
        taskType: guestReq ? "Guest Request" : task?.taskType || "",
        priority: guestReq?.priority || task?.priority || "Medium",
        isAssigned: !!task?.assignedTo?._id,
        isSelectable: !isMaintenance && !alreadyAssigned,
      };
    });
  }, [roomBoard, requestByRoom]);

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
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
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
          guestRequest: fallbackRoom?.guestRequest || null,
        };
      });

      await Promise.all(
        selectedRoomObjects.map(async ({ room, housekeepingTask, guestRequest }) => {
          if (!room?._id) return;

          const taskId = housekeepingTask?._id || "";

          if (taskId) {
            await api.patch(`/housekeeping/tasks/${taskId}/assign`, {
              assignedTo: selectedHouseKeeper,
              priority: housekeepingTask?.priority || "Medium",
              note: `Assigned from dashboard for Room ${room.roomNumber}`,
            });
            return;
          }

          // Create new task – bring checklist from guestRequest if exists
          await api.post("/housekeeping/tasks", {
            roomId: room._id,
            reservationId: guestRequest?.reservation || null,
            assignedTo: selectedHouseKeeper,
            taskType: guestRequest
              ? "OccupiedCleaning"
              : room?.status === "Occupied"
                ? "OccupiedCleaning"
                : room?.status === "Cleaning"
                  ? "CheckoutCleaning"
                  : "Inspection",
            priority: guestRequest?.priority || "Medium",
            note: guestRequest?.title
              ? `Guest Request: ${guestRequest.title}`
              : `Manual cleaning for Room ${room.roomNumber}`,
            checklist: guestRequest?.checklist?.length ? guestRequest.checklist : undefined,
          });

          // Mark guest request as Assigned
          if (guestRequest?._id) {
            await api
              .patch(`/housekeeping/guest-requests/${guestRequest._id}/status`, {
                status: "Assigned",
              })
              .catch((e) => console.error("Could not update Guest Request status", e));
          }
        })
      );

      toast.success("Task(s) assigned successfully");
      setSelectedRooms([]);
      setSelectedHouseKeeper("");
      setExpandedRoom(null);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to assign task");
    } finally {
      setAssigning(false);
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "Available": return "text-emerald-600 bg-emerald-50 border border-emerald-200";
      case "Occupied": return "text-rose-600 bg-rose-50 border border-rose-200";
      case "Cleaning": return "text-amber-600 bg-amber-50 border border-amber-200";
      case "Maintenance": return "text-gray-600 bg-gray-100 border border-gray-200";
      default: return "text-gray-600 bg-gray-100 border border-gray-200";
    }
  };

  const getPriorityClasses = (priority) => {
    switch (String(priority || "").toLowerCase()) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "urgent": return "text-red-700 bg-red-100 border-red-300";
      case "low": return "text-slate-600 bg-slate-50 border-slate-200";
      default: return "text-amber-600 bg-amber-50 border-amber-200";
    }
  };

  const toggleExpand = (roomId) => {
    setExpandedRoom((prev) => (prev === roomId ? null : roomId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Assign House Keeping</h1>
        <p className="text-sm text-gray-500 mt-1">
          Assign cleaning tasks to housekeeping staff. Guest requests are highlighted.
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
                <option key={type} value={type}>{type}</option>
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

        {/* Summary Stats */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <span className="text-xs font-semibold text-gray-500">
            {selectedRooms.length > 0 && (
              <span className="bg-[#1e266d] text-white px-2 py-0.5 rounded-full mr-2">
                {selectedRooms.length} selected
              </span>
            )}
            {guestRequests.length > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full mr-2 animate-pulse">
                {guestRequests.length} guest request(s)
              </span>
            )}
            {filteredRooms.length} rooms shown
          </span>
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
          <div className="space-y-3">
            {filteredRooms.map((room) => {
              const isChecked = selectedRooms.includes(room._id);
              const isExpanded = expandedRoom === room._id;
              const hasGuestReq = !!room.guestRequest;

              return (
                <div
                  key={room._id}
                  className={`border rounded-xl bg-gray-50 transition-shadow ${room.isSelectable ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed opacity-70"
                    } ${isChecked ? "ring-2 ring-[#1e266d] border-[#1e266d] bg-indigo-50" : "border-gray-200"}`}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 flex items-center gap-3"
                    onClick={() => handleSelectRoom(room._id, room.isSelectable)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      disabled={!room.isSelectable}
                      className="h-4 w-4 accent-[#1e266d] shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#1e266d] text-sm">
                          Room {room.roomNumber}
                        </span>
                        {room.roomType && (
                          <span className="text-xs text-gray-500">({room.roomType})</span>
                        )}
                        {room.floor && (
                          <span className="text-xs text-gray-400">Floor {room.floor}</span>
                        )}

                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(room.status)}`}>
                          {room.status}
                        </span>

                        {hasGuestReq && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            Guest Request
                          </span>
                        )}

                        {room.taskId && (
                          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            Task: {room.taskStatus}
                          </span>
                        )}

                        {room.assignedTo?.name && (
                          <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            → {room.assignedTo.name}
                          </span>
                        )}

                        {!room.isSelectable && (
                          <span className="text-xs text-red-500 font-medium">Not eligible</span>
                        )}
                      </div>
                    </div>

                    {/* Expand button if has guest request */}
                    {hasGuestReq && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(room._id);
                        }}
                        className="shrink-0 p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg transition"
                        title="View Request Details"
                      >
                        <FaInfoCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Expanded Guest Request Details */}
                  {isExpanded && hasGuestReq && (
                    <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#1e266d] flex items-center gap-2">
                          <FaClipboardList className="w-4 h-4" />
                          Guest Request Details
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            #{room.guestRequest.requestNumber}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityClasses(room.guestRequest.priority)}`}
                          >
                            {room.guestRequest.priority}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Title</p>
                          <p className="text-gray-800 font-medium">{room.guestRequest.title}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Category</p>
                          <p className="text-gray-800">{room.guestRequest.category}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p>
                          <p className="text-gray-700 bg-gray-50 rounded-lg p-2 text-xs">
                            {room.guestRequest.description}
                          </p>
                        </div>
                        {room.guestRequest?.guest?.name && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Requested By</p>
                            <p className="text-gray-800">{room.guestRequest.guest.name}</p>
                          </div>
                        )}
                      </div>

                      {/* Checklist from guest */}
                      {Array.isArray(room.guestRequest.checklist) && room.guestRequest.checklist.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                            Guest Checklist ({room.guestRequest.checklist.filter(i => i.isDone).length}/{room.guestRequest.checklist.length} done)
                          </p>
                          <div className="space-y-1.5">
                            {room.guestRequest.checklist.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                {item.isDone ? (
                                  <FaCheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                ) : (
                                  <FaCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                )}
                                <span className={item.isDone ? "line-through text-gray-400" : "text-gray-700"}>
                                  {item.label}
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-indigo-600 mt-2 font-medium">
                            ✓ This checklist will be attached to the housekeeping task when assigned.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
            {assigning ? "Assigning..." : `Assign ${selectedRooms.length > 0 ? `(${selectedRooms.length})` : ""} Selected Rooms`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assign;