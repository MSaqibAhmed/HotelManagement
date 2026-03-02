import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash, FaTools } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const INITIAL_REQUESTS = [
  { _id: "1", title: "Leaky Faucet", description: "Faucet in room 101 is leaking", location: "Room 101", priority: "Low", category: "Plumbing", status: "pending", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: "2", title: "AC Not Working", description: "AC is blowing warm air", location: "Room 205", priority: "High", category: "HVAC", status: "in-progress", createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { _id: "3", title: "Broken Light", description: "Ceiling light is flickering", location: "Lobby", priority: "Medium", category: "Electrical", status: "completed", createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { _id: "4", title: "TV No Signal", description: "TV shows no signal", location: "Room 302", priority: "Low", category: "Appliances", status: "pending", createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { _id: "5", title: "Door Lock Jammed", description: "Cannot open door with card", location: "Room 410", priority: "High", category: "Carpentry", status: "cancelled", createdAt: new Date(Date.now() - 5 * 86400000).toISOString() }
];

const MaintenanceRequests = () => {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
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

  // Fetch requests from backend (mocked)
  const fetchRequests = () => {
    setLoading(true);
    setTimeout(() => {
      setRequests([...INITIAL_REQUESTS]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Search filter
  const filteredRequests = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return requests.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.status?.toLowerCase().includes(q)
    );
  }, [requests, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

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
      setFormData({
        title: "",
        description: "",
        location: "",
        priority: "Medium",
        category: "Electrical",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      try {
        if (selectedRequest) {
          setRequests((prev) => prev.map((r) => (r._id === selectedRequest._id ? { ...r, ...formData } : r)));
          toast.success("Request updated successfully");
        } else {
          const newRequest = { ...formData, _id: Date.now().toString(), status: "pending", createdAt: new Date().toISOString() };
          setRequests((prev) => [newRequest, ...prev]);
          toast.success("Request created successfully");
        }
        handleCloseModal();
      } catch (err) {
        toast.error("Operation failed");
      }
    }, 500);
  };

  const handleDelete = (request) => {
    const ok = window.confirm(`Delete request "${request.title}"?`);
    if (!ok) return;

    setTimeout(() => {
      try {
        setRequests((prev) => prev.filter((r) => r._id !== request._id));
        toast.success("Request deleted successfully");
        setCurrentPage((prevPage) => {
          const newLength = requests.filter((r) => r._id !== request._id).length;
          const newTotalPages = Math.max(1, Math.ceil(newLength / itemsPerPage));
          return Math.min(prevPage, newTotalPages);
        });
      } catch (err) {
        toast.error("Delete failed");
      }
    }, 500);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Maintenance Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Manage maintenance requests</p>
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

      {/* Search Card */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, location, category, or status..."
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

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
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
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
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
                        {/* Request */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{request.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {request.description}
                            </p>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{request.location}</p>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 capitalize">{request.category}</span>
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(
                              request.priority
                            )}`}
                          >
                            {request.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(request)}
                              className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(request)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
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
                          <p className="text-xs text-gray-500 truncate">{request.location}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenModal(request)}
                            className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(request)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
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
                            {request.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
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
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg ${currentPage === page
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

      {/* Modal */}
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                  placeholder="e.g., Room 101, Lobby"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                  className="flex-1 px-4 py-3 rounded-xl bg-[#1e1e1e] text-white font-semibold hover:bg-black transition"
                >
                  {selectedRequest ? "Update" : "Submit"} Request
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
