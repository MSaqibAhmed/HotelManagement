import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTools, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const MaintenanceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [assigningId, setAssigningId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewedRequest, setViewedRequest] = useState(null);
  const [maintenanceStaff, setMaintenanceStaff] = useState([]);
  const [assignStaffId, setAssignStaffId] = useState("");

  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    priority: "Medium",
    category: "Electrical",
  });

  const getUserFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isStaff = ["admin", "manager", "receptionist"].includes(role);
  const isMaintenance = role === "maintenance";

  const resetForm = () => {
    setFormData({ title: "", description: "", location: "", priority: "Medium", category: "Electrical" });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let endpoint = "/maintenance/my-requests";
      if (isStaff) endpoint = "/maintenance/active";
      if (isMaintenance) endpoint = "/maintenance/my-tasks";

      const { data } = await api.get(endpoint);
      setRequests(data?.requests || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceStaff = async () => {
    if (!isStaff) return;
    try {
      const { data } = await api.get("/auth/staff");
      const staff = (data?.staff || []).filter(
        (s) => String(s.role || "").toLowerCase() === "maintenance"
      );
      setMaintenanceStaff(staff);
    } catch { }
  };

  useEffect(() => {
    fetchRequests();
    fetchMaintenanceStaff();
  }, [role]);

  const filteredRequests = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return requests.filter((r) => {
      const matchesSearch =
        !q ||
        r.title?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.requestNumber?.toLowerCase().includes(q) ||
        r.room?.roomNumber?.toLowerCase().includes(q);

      const matchesStatus = statusFilter
        ? String(r.status || "").toLowerCase() === statusFilter.toLowerCase()
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleOpenModal = (request = null) => {
    if (request) {
      setSelectedRequest(request);
      setFormData({
        title: request.title || "",
        description: request.description || "",
        location: request.location || "",
        priority: request.priority || "Medium",
        category: request.category || "Electrical",
      });
    } else {
      setSelectedRequest(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    resetForm();
  };

  const validateForm = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (formData.title.trim().length < 3) { toast.error("Title must be at least 3 characters"); return false; }
    if (formData.description.trim().length < 8) { toast.error("Description must be at least 8 characters"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      priority: formData.priority,
      category: formData.category,
    };

    try {
      setSubmitting(true);
      if (selectedRequest) {
        await api.put(`/maintenance/${selectedRequest._id}`, payload);
        toast.success("Request updated successfully");
      } else {
        await api.post("/maintenance/create", payload);
        toast.success("Request created successfully");
      }
      handleCloseModal();
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (request) => {
    if (!window.confirm(`Delete request "${request.title}"?`)) return;
    try {
      setDeletingId(request._id);
      await api.delete(`/maintenance/${request._id}`);
      toast.success("Request deleted");
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  };

  const handleAssignStaff = async (requestId) => {
    if (!assignStaffId) { toast.error("Please select maintenance staff"); return; }
    try {
      setAssigningId(requestId);
      await api.patch(`/maintenance/${requestId}/assign`, { assignedTo: assignStaffId });
      toast.success("Maintenance staff assigned");
      setAssignStaffId("");
      setViewedRequest(null);
      setShowViewModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Assignment failed");
    } finally {
      setAssigningId("");
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      await api.patch(`/maintenance/${requestId}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchRequests();
      if (showViewModal) {
        setViewedRequest((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Status update failed");
    }
  };

  const getStatusColor = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending": return "bg-amber-100 text-amber-800 border border-amber-200";
      case "assigned": return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "in-progress": case "in progress": return "bg-blue-100 text-blue-800 border border-blue-200";
      case "completed": return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "cancelled": case "canceled": return "bg-red-100 text-red-800 border border-red-200";
      default: return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (String(priority || "").toLowerCase()) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-amber-100 text-amber-800";
      case "low": return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status) => {
    const n = String(status || "").toLowerCase();
    if (n === "in-progress" || n === "in progress") return "In Progress";
    if (n === "pending") return "Pending";
    if (n === "assigned") return "Assigned";
    if (n === "completed") return "Completed";
    if (n === "cancelled" || n === "canceled") return "Cancelled";
    return status || "Unknown";
  };

  const canEdit = (request) => {
    const s = String(request?.status || "").toLowerCase();
    if (role === "guest") return s === "pending" && !request?.assignedTo;
    if (isStaff) return !["completed", "cancelled"].includes(s);
    return false;
  };

  const canDelete = (request) => {
    const s = String(request?.status || "").toLowerCase();
    if (role === "guest") return s === "pending" && !request?.assignedTo;
    if (isStaff) return !["completed", "cancelled"].includes(s);
    return false;
  };

  const canAssign = (request) => {
    if (!isStaff) return false;
    const s = String(request?.status || "").toLowerCase();
    return !["completed", "cancelled"].includes(s);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Maintenance Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff ? "View and manage all active maintenance requests" : isMaintenance ? "Your assigned maintenance tasks" : "Create and track your maintenance requests"}
          </p>
        </div>

        {!isMaintenance && (
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto"
          >
            <FaPlus className="w-4 h-4" />
            New Request
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, room, location, category, or status..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white text-sm"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In-Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <span className="text-sm text-gray-500 sm:whitespace-nowrap">
            {filteredRequests.length} requests
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Request</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    {isStaff && <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={isStaff ? 8 : 7} className="text-center py-16">
                        <FaTools className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No requests found</p>
                        <p className="text-sm text-gray-400 mt-1">Try changing filters or create a new request</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{request.title}</p>
                          <p className="text-xs text-gray-400">{request.requestNumber || "—"}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{request.description}</p>
                        </td>
                        <td className="px-6 py-4">
                          {request.room?.roomNumber ? (
                            <span className="text-sm font-medium text-[#1e266d] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                              Room {request.room.roomNumber}
                            </span>
                          ) : (
                            <p className="text-sm text-gray-500">{request.location || "—"}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 capitalize">{request.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {formatStatus(request.status)}
                          </span>
                        </td>
                        {isStaff && (
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {request.assignedTo?.name || <span className="text-gray-400 italic">Not assigned</span>}
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setViewedRequest(request); setShowViewModal(true); }}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            {canEdit(request) && (
                              <button
                                onClick={() => handleOpenModal(request)}
                                className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete(request) && (
                              <button
                                onClick={() => handleDelete(request)}
                                disabled={deletingId === request._id}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                title="Delete"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="md:hidden divide-y divide-gray-200">
              {paginatedRequests.map((request) => (
                <div key={request._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">{request.title}</p>
                      <p className="text-xs text-gray-400">{request.requestNumber || "—"}</p>
                      {request.room?.roomNumber && (
                        <span className="text-xs text-[#1e266d] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Room {request.room.roomNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setViewedRequest(request); setShowViewModal(true); }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      {canEdit(request) && (
                        <button onClick={() => handleOpenModal(request)} className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg">
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete(request) && (
                        <button onClick={() => handleDelete(request)} disabled={deletingId === request._id} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                          <FaTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-xs text-gray-400 mb-1">Priority</p><span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getPriorityColor(request.priority)}`}>{request.priority}</span></div>
                    <div><p className="text-xs text-gray-400 mb-1">Status</p><span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>{formatStatus(request.status)}</span></div>
                    {isStaff && <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Assigned To</p><p className="text-gray-700 text-xs">{request.assignedTo?.name || "Not assigned"}</p></div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm font-medium rounded-lg ${currentPage === page ? "bg-[#1e1e1e] text-white" : "border border-gray-200 hover:bg-gray-50"}`}>{page}</button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1e266d]">
                {selectedRequest ? "Edit Request" : "New Maintenance Request"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <FaTools className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                  placeholder="e.g. AC not cooling"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
                  placeholder="Describe the issue in detail..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                  placeholder="e.g. Room 101, Lobby"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
                    {["Electrical", "Plumbing", "HVAC", "Carpentry", "Appliances", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
                    {["Low", "Medium", "High"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 rounded-xl bg-[#1e1e1e] text-white font-semibold hover:bg-black disabled:opacity-50">
                  {submitting ? (selectedRequest ? "Updating..." : "Submitting...") : (selectedRequest ? "Update" : "Submit Request")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Assign Modal */}
      {showViewModal && viewedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-[#1e266d]">Request Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">{viewedRequest.requestNumber}</p>
              </div>
              <button onClick={() => { setShowViewModal(false); setViewedRequest(null); setAssignStaffId(""); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg text-xl">×</button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Title</p><p className="font-medium text-gray-800">{viewedRequest.title}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewedRequest.status)}`}>{formatStatus(viewedRequest.status)}</span></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Room</p><p className="font-medium text-gray-800">{viewedRequest.room?.roomNumber ? `Room ${viewedRequest.room.roomNumber}` : viewedRequest.location || "—"}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Category</p><p className="font-medium text-gray-800 capitalize">{viewedRequest.category}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Priority</p><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(viewedRequest.priority)}`}>{viewedRequest.priority}</span></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Assigned To</p><p className="font-medium text-gray-800">{viewedRequest.assignedTo?.name || "Not assigned"}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Requested By</p><p className="font-medium text-gray-800">{viewedRequest.requestedBy?.name || "—"} <span className="text-xs text-gray-500">({viewedRequest.requestedByRole})</span></p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Created At</p><p className="font-medium text-gray-800">{viewedRequest.createdAt ? new Date(viewedRequest.createdAt).toLocaleDateString() : "—"}</p></div>
              </div>

              <div><p className="text-xs text-gray-500 uppercase font-semibold mb-1">Description</p><p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{viewedRequest.description}</p></div>

              {/* Assign section for staff */}
              {canAssign(viewedRequest) && isStaff && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Assign Maintenance Staff</p>
                  <div className="flex gap-2">
                    <select
                      value={assignStaffId}
                      onChange={(e) => setAssignStaffId(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white text-sm"
                    >
                      <option value="">Select staff...</option>
                      {maintenanceStaff.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssignStaff(viewedRequest._id)}
                      disabled={!assignStaffId || assigningId === viewedRequest._id}
                      className="px-4 py-2.5 bg-[#1e266d] text-white text-sm font-semibold rounded-xl hover:bg-[#1a205c] disabled:opacity-50"
                    >
                      {assigningId === viewedRequest._id ? "Assigning..." : "Assign"}
                    </button>
                  </div>
                </div>
              )}

              {/* Status update for maintenance staff */}
              {isMaintenance && !["Completed", "Cancelled"].includes(viewedRequest.status) && (
                <div className="pt-4 border-t border-gray-200 flex gap-2">
                  {viewedRequest.status !== "In-Progress" && (
                    <button onClick={() => handleUpdateStatus(viewedRequest._id, "In-Progress")} className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">
                      Mark In Progress
                    </button>
                  )}
                  <button onClick={() => handleUpdateStatus(viewedRequest._id, "Completed")} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700">
                    Mark Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceRequests;