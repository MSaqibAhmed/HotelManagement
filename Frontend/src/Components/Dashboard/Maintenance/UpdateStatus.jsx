import React, { useEffect, useMemo, useState } from "react";
import { FaTools, FaUserCog, FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "react-toastify";

let dummyDashboardRequests = [
  { _id: "1", title: "Leaky Faucet", description: "Faucet in room 101 is leaking", location: "Room 101", priority: "Low", category: "Plumbing", status: "pending", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: "2", title: "AC Not Working", description: "AC is blowing warm air", location: "Room 205", priority: "High", category: "HVAC", status: "in-progress", assignedTo: { _id: "s1", name: "John Doe", role: "Technician" }, createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { _id: "4", title: "TV No Signal", description: "TV shows no signal", location: "Room 302", priority: "Low", category: "Appliances", status: "pending", createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
];

const dummyStaff = [
  { _id: "s1", name: "John Doe", role: "Technician" },
  { _id: "s2", name: "Jane Smith", role: "Plumber" },
  { _id: "s3", name: "Mike Johnson", role: "Electrician" }
];

const THEME = "#1e266d";

const UpdateStatus = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [staffList, setStaffList] = useState([]);

  const [statusForm, setStatusForm] = useState({
    status: "pending",
    notes: "",
  });

  const [assignForm, setAssignForm] = useState({
    assignedTo: "",
  });

  // Fetch requests
  const fetchRequests = () => {
    setLoading(true);
    setTimeout(() => {
      const data = [...dummyDashboardRequests];
      setRequests(
        data.filter(
          (r) =>
            r.status?.toLowerCase() !== "completed" &&
            r.status?.toLowerCase() !== "cancelled"
        )
      );
      setLoading(false);
    }, 500);
  };

  // Fetch staff list
  const fetchStaff = () => {
    setStaffList(dummyStaff);
  };

  useEffect(() => {
    fetchRequests();
    fetchStaff();
  }, []);

  const handleOpenStatusModal = (request) => {
    setSelectedRequest(request);
    setStatusForm({
      status: request.status?.toLowerCase() || "pending",
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

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    setTimeout(() => {
      try {
        dummyDashboardRequests = dummyDashboardRequests.map(r =>
          r._id === selectedRequest._id ? { ...r, status: statusForm.status } : r
        );
        toast.success("Status updated successfully");
        setShowStatusModal(false);
        fetchRequests();
      } catch (err) {
        toast.error("Failed to update status");
      }
    }, 500);
  };

  const handleAssignStaff = (e) => {
    e.preventDefault();
    setTimeout(() => {
      try {
        const staffMember = dummyStaff.find(s => s._id === assignForm.assignedTo);
        dummyDashboardRequests = dummyDashboardRequests.map(r =>
          r._id === selectedRequest._id ? { ...r, assignedTo: staffMember } : r
        );
        toast.success("Staff assigned successfully");
        setShowAssignModal(false);
        fetchRequests();
      } catch (err) {
        toast.error("Failed to assign staff");
      }
    }, 500);
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", icon: FaClock, label: "Pending" };
      case "in-progress":
        return { bg: "bg-blue-100", text: "text-blue-800", icon: FaTools, label: "In Progress" };
      case "completed":
        return { bg: "bg-green-100", text: "text-green-800", icon: FaCheckCircle, label: "Completed" };
      case "cancelled":
        return { bg: "bg-red-100", text: "text-red-800", icon: FaTimesCircle, label: "Cancelled" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", icon: FaClock, label: "Unknown" };
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Update Maintenance Status</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update status and assign staff to maintenance requests
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d] mx-auto" />
            <p className="text-gray-500 mt-4">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <FaCheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No pending requests</p>
            <p className="text-sm text-gray-400 mt-1">All caught up!</p>
          </div>
        ) : (
          requests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            const priorityConfig = getPriorityConfig(request.priority);

            return (
              <div
                key={request._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
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
                      </div>
                      <h3 className="font-semibold text-gray-800">{request.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{request.location}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Category</p>
                    <p className="text-sm font-medium text-gray-700">{request.category}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
                  </div>

                  {request.assignedTo && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Assigned To</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: THEME }}
                        >
                          {request.assignedTo.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {request.assignedTo.name}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                    <p className="text-sm text-gray-600">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
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
                    Assign
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1e266d]">Update Status</h2>
              <button
                onClick={() => setShowStatusModal(false)}
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
                    { value: "pending", label: "Pending", bg: "bg-yellow-100", text: "text-yellow-800" },
                    { value: "in-progress", label: "In Progress", bg: "bg-blue-100", text: "text-blue-800" },
                    { value: "completed", label: "Completed", bg: "bg-green-100", text: "text-green-800" },
                    { value: "cancelled", label: "Cancelled", bg: "bg-red-100", text: "text-red-800" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStatusForm({ ...statusForm, status: opt.value })}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition border-2 ${statusForm.status === opt.value
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
                  placeholder="Add any notes about this status update..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1e1e1e] text-white font-semibold hover:bg-black transition"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1e266d]">Assign Staff</h2>
              <button
                onClick={() => setShowAssignModal(false)}
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
                  Select Staff
                </label>
                <select
                  value={assignForm.assignedTo}
                  onChange={(e) =>
                    setAssignForm({ assignedTo: e.target.value })
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

              {assignForm.assignedTo && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Selected:{" "}
                    <span className="font-semibold text-gray-800">
                      {staffList.find((s) => s._id === assignForm.assignedTo)?.name}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1e1e1e] text-white font-semibold hover:bg-black transition"
                >
                  Assign Staff
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
