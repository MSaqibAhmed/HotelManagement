import React, { useEffect, useMemo, useState } from "react";
import {
  FaTools,
  FaUserCog,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaClipboardList,
  FaSpinner,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#1e266d";

const UpdateStatus = () => {
  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [statusForm, setStatusForm] = useState({
    status: "Pending",
    notes: "",
  });

  const [assignForm, setAssignForm] = useState({
    assignedTo: "",
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/maintainence/active");
      setRequests(data?.requests || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data } = await api.get("/auth/staff");
      const staff = data?.staff || data || [];

      const maintenanceOnly = staff.filter(
        (item) => String(item?.role || "").toLowerCase() === "maintenance"
      );

      setStaffList(maintenanceOnly);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load staff");
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStaff();
  }, []);

  const filteredRequests = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return requests.filter((r) => {
      const matchesSearch =
        !q ||
        r.title?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.requestNumber?.toLowerCase().includes(q) ||
        r.assignedTo?.name?.toLowerCase().includes(q);

      const normalizedStatus = String(r.status || "").toLowerCase();
      const matchesStatus =
        statusFilter === "All" ||
        normalizedStatus === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(
        (r) => String(r.status || "").toLowerCase() === "pending"
      ).length,
      assigned: requests.filter(
        (r) => String(r.status || "").toLowerCase() === "assigned"
      ).length,
      inProgress: requests.filter(
        (r) => String(r.status || "").toLowerCase() === "in-progress"
      ).length,
    };
  }, [requests]);

  const handleOpenStatusModal = (request) => {
    setSelectedRequest(request);
    setStatusForm({
      status: normalizeStatusValue(request.status),
      notes: "",
    });
    setShowStatusModal(true);
  };

  const handleOpenAssignModal = (request) => {
    setSelectedRequest(request);
    setAssignForm({
      assignedTo: request.assignedTo?._id || "",
    });
    setShowAssignModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedRequest(null);
    setStatusForm({
      status: "Pending",
      notes: "",
    });
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedRequest(null);
    setAssignForm({
      assignedTo: "",
    });
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();

    if (!selectedRequest?._id) {
      toast.error("No request selected");
      return;
    }

    try {
      setStatusUpdating(true);

      await api.patch(`/maintainence/${selectedRequest._id}/status`, {
        status: statusForm.status,
        note: statusForm.notes,
      });

      toast.success("Status updated successfully");
      closeStatusModal();
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();

    if (!assignForm.assignedTo) {
      toast.error("Please select maintenance staff");
      return;
    }

    try {
      setAssigning(true);

      await api.patch(`/maintainence/${selectedRequest._id}/assign`, {
        assignedTo: assignForm.assignedTo,
      });

      toast.success("Staff assigned successfully");
      closeAssignModal();
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to assign staff");
    } finally {
      setAssigning(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          icon: FaClock,
          label: "Pending",
        };
      case "assigned":
        return {
          bg: "bg-indigo-100",
          text: "text-indigo-800",
          icon: FaUserCog,
          label: "Assigned",
        };
      case "in-progress":
        return {
          bg: "bg-blue-100",
          text: "text-blue-800",
          icon: FaTools,
          label: "In Progress",
        };
      case "completed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          icon: FaCheckCircle,
          label: "Completed",
        };
      case "cancelled":
        return {
          bg: "bg-red-100",
          text: "text-red-800",
          icon: FaTimesCircle,
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-800",
          icon: FaClock,
          label: "Unknown",
        };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (String(priority || "").toLowerCase()) {
      case "high":
        return { bg: "bg-red-100", text: "text-red-800" };
      case "medium":
        return { bg: "bg-yellow-100", text: "text-yellow-800" };
      case "low":
        return { bg: "bg-green-100", text: "text-green-800" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800" };
    }
  };

  const normalizeStatusValue = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "pending") return "Pending";
    if (value === "assigned") return "Assigned";
    if (value === "in-progress" || value === "in progress") return "In-Progress";
    if (value === "completed") return "Completed";
    if (value === "cancelled" || value === "canceled") return "Cancelled";

    return "Pending";
  };

  const selectedStaff = staffList.find((s) => s._id === assignForm.assignedTo);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Update Maintenance Status</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update request status and assign maintenance staff
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Active Requests</p>
          <p className="text-2xl font-bold text-[#1e266d] mt-1">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Assigned</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.assigned}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, request no, location, category, assigned staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d] mx-auto" />
            <p className="text-gray-500 mt-4">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <FaClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No active maintenance requests</p>
            <p className="text-sm text-gray-400 mt-1">Matching requests will appear here</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            const priorityConfig = getPriorityConfig(request.priority);

            return (
              <div
                key={request._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>

                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${priorityConfig.bg} ${priorityConfig.text}`}
                        >
                          {request.priority}
                        </span>

                        {request.requestNumber && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            {request.requestNumber}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-gray-800">{request.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{request.location}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                    <p className="text-sm font-medium text-gray-700">{request.category}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{request.description}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Assigned To</p>
                    {request.assignedTo ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: THEME }}
                        >
                          {request.assignedTo.name?.charAt(0)?.toUpperCase() || "M"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {request.assignedTo.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.assignedTo.role}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">Not assigned yet</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                      <p className="text-sm text-gray-600">
                        {request.createdAt
                          ? new Date(request.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Requested By</p>
                      <p className="text-sm text-gray-600">
                        {request.requestedBy?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                  <button
                    onClick={() => handleOpenStatusModal(request)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition"
                    style={{ backgroundColor: THEME }}
                  >
                    <FaTools className="w-4 h-4" />
                    Update Status
                  </button>

                  <button
                    onClick={() => handleOpenAssignModal(request)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition"
                    style={{ borderColor: THEME, color: THEME }}
                  >
                    <FaUserCog className="w-4 h-4" />
                    {request.assignedTo ? "Reassign" : "Assign"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-[#1e266d]">Update Status</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedRequest.title}</p>
              </div>

              <button
                onClick={closeStatusModal}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: "Pending",
                      label: "Pending",
                      bg: "bg-yellow-100",
                      text: "text-yellow-800",
                    },
                    {
                      value: "Assigned",
                      label: "Assigned",
                      bg: "bg-indigo-100",
                      text: "text-indigo-800",
                    },
                    {
                      value: "In-Progress",
                      label: "In Progress",
                      bg: "bg-blue-100",
                      text: "text-blue-800",
                    },
                    {
                      value: "Completed",
                      label: "Completed",
                      bg: "bg-green-100",
                      text: "text-green-800",
                    },
                    {
                      value: "Cancelled",
                      label: "Cancelled",
                      bg: "bg-red-100",
                      text: "text-red-800",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setStatusForm((prev) => ({ ...prev, status: opt.value }))
                      }
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition border-2 ${
                        statusForm.status === opt.value
                          ? "border-[#1e266d]"
                          : "border-transparent"
                      } ${opt.bg} ${opt.text}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) =>
                    setStatusForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
                  placeholder="Add any notes about this status update..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeStatusModal}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={statusUpdating}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1e1e1e] text-white font-semibold hover:bg-black transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {statusUpdating && <FaSpinner className="animate-spin" />}
                  {statusUpdating ? "Updating..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-[#1e266d]">Assign Staff</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedRequest.title}</p>
              </div>

              <button
                onClick={closeAssignModal}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAssignStaff} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Maintenance Staff
                </label>

                <select
                  value={assignForm.assignedTo}
                  onChange={(e) =>
                    setAssignForm((prev) => ({ ...prev, assignedTo: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                  required
                >
                  <option value="">-- Select Staff --</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStaff && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Selected Staff</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: THEME }}
                    >
                      {selectedStaff.name?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{selectedStaff.name}</p>
                      <p className="text-xs text-gray-500">{selectedStaff.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {!staffList.length && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">
                    No maintenance staff found. Please create maintenance staff first.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={assigning || !staffList.length}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1e1e1e] text-white font-semibold hover:bg-black transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {assigning && <FaSpinner className="animate-spin" />}
                  {assigning ? "Assigning..." : "Assign Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateStatus;