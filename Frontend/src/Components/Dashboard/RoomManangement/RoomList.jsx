import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuPencilLine, LuTrash2, LuSearch, LuPlus } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const RoomList = () => {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/room/getroom");
      setRooms(data.rooms || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const openDeleteModal = (id) => {
    setRoomToDelete(id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (actionLoadingId === roomToDelete) return;
    setDeleteModalOpen(false);
    setRoomToDelete(null);
  };

  const confirmDelete = async () => {
    if (!roomToDelete) return;

    try {
      setActionLoadingId(roomToDelete);
      const { data } = await api.delete(`/room/deleteroom/${roomToDelete}`);
      toast.success(data.message || "Room deleted successfully");
      setRooms((prev) => prev.filter((room) => room._id !== roomToDelete));
      setDeleteModalOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      setActionLoadingId(id);

      const { data } = await api.patch(
        `/room/updateactivestatus/${id}/active-status`,
        {
          isActive: !currentStatus,
        }
      );

      toast.success(data.message || "Room active status updated");

      setRooms((prev) =>
        prev.map((room) =>
          room._id === id ? { ...room, isActive: !currentStatus } : room
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update room active status");
    } finally {
      setActionLoadingId("");
    }
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const roomNumber = String(room.roomNumber || "").toLowerCase();
      const roomType = String(room.roomType || "").toLowerCase();
      const bedType = String(room.bedType || "").toLowerCase();

      const matchesSearch =
        roomNumber.includes(searchTerm.toLowerCase()) ||
        roomType.includes(searchTerm.toLowerCase()) ||
        bedType.includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ? true : room.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rooms, searchTerm, statusFilter]);

  const getStatusClasses = (status) => {
    switch (status) {
      case "Available":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "Occupied":
        return "bg-rose-50 text-rose-700 border border-rose-100";
      case "Cleaning":
        return "bg-sky-50 text-sky-700 border border-sky-100";
      case "Maintenance":
        return "bg-amber-50 text-amber-700 border border-amber-100";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-100";
    }
  };

  const getActiveClasses = (isActive) => {
    return isActive
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : "bg-gray-100 text-gray-600 border border-gray-200";
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e266d]">
              Room List
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Manage all rooms, pricing, floor details, gallery images, and room status.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard/room-management/add-room")}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition shadow-sm"
            style={{ backgroundColor: THEME, color: "#111827" }}
          >
            <LuPlus size={18} />
            Add Room
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#1e266d]/10"
              >
                <option value="All">All Status</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div className="w-full lg:w-[320px]">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Search
              </label>
              <div className="relative">
                <LuSearch
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search room no, type, bed type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#1e266d]/10"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1550px] text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-600 uppercase text-[11px] tracking-wider">
                  <th className="px-6 py-4 font-bold">#</th>
                  <th className="px-6 py-4 font-bold">Image</th>
                  <th className="px-6 py-4 font-bold">Room No</th>
                  <th className="px-6 py-4 font-bold">Type</th>
                  <th className="px-6 py-4 font-bold">Floor</th>
                  <th className="px-6 py-4 font-bold">Base Price</th>
                  <th className="px-6 py-4 font-bold">Extra Bed</th>
                  <th className="px-6 py-4 font-bold">Capacity</th>
                  <th className="px-6 py-4 font-bold">Size</th>
                  <th className="px-6 py-4 font-bold">Beds</th>
                  <th className="px-6 py-4 font-bold">Bed Type</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">State</th>
                  <th className="px-6 py-4 font-bold text-center">Toggle</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="15"
                      className="px-6 py-10 text-center text-gray-400 font-semibold"
                    >
                      Loading rooms...
                    </td>
                  </tr>
                ) : filteredRooms.length > 0 ? (
                  filteredRooms.map((room, index) => (
                    <tr key={room._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-500">
                        #{index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <img
                          src={
                            room.coverImage?.url ||
                            "https://via.placeholder.com/80x80?text=Room"
                          }
                          alt={room.roomType}
                          className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                        />
                      </td>

                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {room.roomNumber}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{room.roomType}</td>
                      <td className="px-6 py-4 text-gray-700">{room.floor}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        Rs {room.pricing?.basePrice || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        Rs {room.pricing?.extraBedCharge || 0}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{room.capacity}</td>
                      <td className="px-6 py-4 text-gray-700">{room.roomSize}</td>
                      <td className="px-6 py-4 text-gray-700">{room.bedNumber}</td>
                      <td className="px-6 py-4 text-gray-700">{room.bedType}</td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                            room.status
                          )}`}
                        >
                          {room.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getActiveClasses(
                            room.isActive
                          )}`}
                        >
                          {room.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleActive(room._id, room.isActive)}
                          disabled={actionLoadingId === room._id}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${room.isActive ? "bg-emerald-500" : "bg-gray-300"
                            } ${actionLoadingId === room._id ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${room.isActive ? "translate-x-8" : "translate-x-1"
                              }`}
                          />
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() =>
                              navigate(`/dashboard/room-management/edit-room/${room._id}`)
                            }
                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                            title="Edit"
                          >
                            <LuPencilLine size={16} />
                          </button>

                          <button
                            onClick={() => openDeleteModal(room._id)}
                            disabled={actionLoadingId === room._id}
                            className="p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                            title="Delete"
                          >
                            <LuTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="15"
                      className="px-6 py-10 text-center text-gray-400 font-semibold"
                    >
                      No rooms found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="font-semibold">{filteredRooms.length}</span> room(s)
            </p>

            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white transition">
                Prev
              </button>
              <button
                className="px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: THEME, color: "#111827" }}
              >
                1
              </button>
              <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white transition">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
                <LuTrash2 className="text-red-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Room</h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Are you sure you want to delete this room? This action cannot be undone and will remove all associated data.
              </p>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={closeDeleteModal}
                  disabled={actionLoadingId === roomToDelete}
                  className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold rounded-xl transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={actionLoadingId === roomToDelete}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoadingId === roomToDelete ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;