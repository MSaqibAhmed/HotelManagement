import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTools } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";

const MaintenanceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 5;

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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      priority: "Medium",
      category: "Electrical",
    });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/maintainence/my-requests");
      setRequests(data?.requests || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return requests.filter((r) => {
      return (
        r.title?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.requestNumber?.toLowerCase().includes(q)
      );
    });
  }, [requests, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
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
    const title = formData.title.trim();
    const description = formData.description.trim();
    const location = formData.location.trim();

    if (!title || !description || !location) {
      toast.error("Please fill all required fields");
      return false;
    }

    if (title.length < 3) {
      toast.error("Title must be at least 3 characters");
      return false;
    }

    if (description.length < 8) {
      toast.error("Description must be at least 8 characters");
      return false;
    }

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
        await api.put(`/maintainence/${selectedRequest._id}`, payload);
        toast.success("Request updated successfully");
      } else {
        await api.post("/maintainence/create", payload);
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
    const ok = window.confirm(`Delete request "${request.title}"?`);
    if (!ok) return;

    try {
      setDeletingId(request._id);
      await api.delete(`/maintainence/${request._id}`);
      toast.success("Request deleted successfully");
      fetchRequests();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  };

  const getStatusColor = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-indigo-100 text-indigo-800";
      case "in-progress":
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (String(priority || "").toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "in-progress" || normalized === "in progress") return "In Progress";
    if (normalized === "pending") return "Pending";
    if (normalized === "assigned") return "Assigned";
    if (normalized === "completed") return "Completed";
    if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
    return status || "Unknown";
  };

  const canEditRequest = (request) => {
    const status = String(request?.status || "").toLowerCase();
    const hasAssignment = !!request?.assignedTo;

    if (role === "guest") {
      return status === "pending" && !hasAssignment;
    }

    if (["admin", "manager", "receptionist"].includes(role)) {
      return !["completed", "cancelled", "canceled"].includes(status);
    }

    return false;
  };

  const canDeleteRequest = (request) => {
    const status = String(request?.status || "").toLowerCase();
    const hasAssignment = !!request?.assignedTo;

    if (role === "guest") {
      return status === "pending" && !hasAssignment;
    }

    if (["admin", "manager", "receptionist"].includes(role)) {
      return !["completed", "cancelled", "canceled"].includes(status);
    }

    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Maintenance Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage maintenance requests
          </p>
        </div>

        <Link
          to="#"
          onClick={(e) => {
            e.preventDefault();
            handleOpenModal();
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto"
        >
          <FaPlus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request no, title, location, category, or status..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <span className="text-sm text-gray-500 sm:whitespace-nowrap">
            {filteredRequests.length} requests
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Request
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <FaTools className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No requests found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Try changing search or create a new request
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{request.title}</p>
                            <p className="text-xs text-gray-400">
                              {request.requestNumber || "No Request No"}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {request.description}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{request.location}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 capitalize">
                            {request.category}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(
                              request.priority
                            )}`}
                          >
                            {request.priority}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {formatStatus(request.status)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {request.createdAt
                              ? new Date(request.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {canEditRequest(request) && (
                              <button
                                onClick={() => handleOpenModal(request)}
                                className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                                title="Edit"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                            )}

                            {canDeleteRequest(request) && (
                              <button
                                onClick={() => handleDelete(request)}
                                disabled={deletingId === request._id}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                title="Delete"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            )}

                            {!canEditRequest(request) && !canDeleteRequest(request) && (
                              <span className="text-xs text-gray-400">No actions</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden">
              {paginatedRequests.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <FaTools className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No requests found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try changing search or create a new request
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedRequests.map((request) => (
                    <div key={request._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 truncate">{request.title}</p>
                          <p className="text-xs text-gray-400">
                            {request.requestNumber || "No Request No"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{request.location}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {canEditRequest(request) && (
                            <button
                              onClick={() => handleOpenModal(request)}
                              className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                          )}

                          {canDeleteRequest(request) && (
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
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Category</p>
                          <p className="text-gray-700 capitalize">{request.category}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Priority</p>
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityColor(
                              request.priority
                            )}`}
                          >
                            {request.priority}
                          </span>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Status</p>
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {formatStatus(request.status)}
                          </span>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Date</p>
                          <p className="text-gray-700">
                            {request.createdAt
                              ? new Date(request.createdAt).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of{" "}
                  {filteredRequests.length}
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                        currentPage === page
                          ? "bg-[#1e1e1e] text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-[#1e266d]">
                {selectedRequest ? "Edit Request" : "New Maintenance Request"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                  placeholder="e.g., Room 101, Lobby"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="HVAC">HVAC</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Appliances">Appliances</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1e1e1e] text-white font-semibold hover:bg-black transition disabled:opacity-50"
                >
                  {submitting
                    ? selectedRequest
                      ? "Updating..."
                      : "Submitting..."
                    : selectedRequest
                    ? "Update Request"
                    : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceRequests;