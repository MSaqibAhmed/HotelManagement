import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEye, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const INITIAL_FORM_DATA = {
  serviceType: "Housekeeping",
  description: "",
  priority: "Normal",
  roomNumber: "",
};

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Assigned", "Completed", "Rejected", "Cancelled"];

const RequestServices = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cancelLoadingId, setCancelLoadingId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});

  const itemsPerPage = 5;

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/housekeeping-requests/my");
      setServiceRequests(data?.requests || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch service requests");
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Approved":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Assigned":
        return "bg-indigo-50 text-indigo-600 border border-indigo-200";
      case "Completed":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Rejected":
        return "bg-red-50 text-red-600 border border-red-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-600 border border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Urgent":
        return "bg-orange-50 text-orange-600";
      case "High":
        return "bg-red-50 text-red-600";
      case "Normal":
        return "bg-gray-100 text-gray-700";
      case "Low":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredRequests = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return serviceRequests.filter((request) => {
      const requestNumber = String(request?.requestNumber || "").toLowerCase();
      const roomNumber = String(request?.roomSnapshot?.roomNumber || "").toLowerCase();
      const description = String(request?.description || "").toLowerCase();
      const priority = String(request?.priority || "").toLowerCase();
      const status = String(request?.status || "").toLowerCase();

      const matchesSearch =
        !q ||
        requestNumber.includes(q) ||
        roomNumber.includes(q) ||
        description.includes(q) ||
        priority.includes(q) ||
        status.includes(q);

      const matchesStatus =
        statusFilter === "All" || String(request?.status || "") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [serviceRequests, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = "Room number is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitLoading(true);

      const payload = {
        roomNumber: formData.roomNumber.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
      };

      const { data } = await api.post("/housekeeping-requests", payload);

      setServiceRequests((prev) => [data.request, ...prev]);
      toast.success(data?.message || "Housekeeping request submitted successfully");

      setShowForm(false);
      resetForm();
      setCurrentPage(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleView = async (request) => {
    try {
      const { data } = await api.get(`/housekeeping-requests/${request._id}`);
      setSelectedRequest(data?.request || request);
      setShowModal(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch request details");
    }
  };

  const handleCancelRequest = async (request) => {
    const ok = window.confirm(
      `Cancel housekeeping request ${request?.requestNumber || ""}?`
    );
    if (!ok) return;

    try {
      setCancelLoadingId(request._id);

      const { data } = await api.patch(`/housekeeping-requests/${request._id}/cancel`);

      setServiceRequests((prev) =>
        prev.map((item) => (item._id === request._id ? data.request : item))
      );

      if (selectedRequest?._id === request._id) {
        setSelectedRequest(data.request);
      }

      toast.success(data?.message || "Request cancelled successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel request");
    } finally {
      setCancelLoadingId("");
    }
  };

  const canCancel = (request) => String(request?.status || "") === "Pending";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Request Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit and track your housekeeping requests
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto"
        >
          <FaPlus className="w-4 h-4" />
          New Service Request
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request no, room number, status or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full lg:w-52 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-500">{filteredRequests.length} requests</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Request ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Service Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Room
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Requested Date
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
                        <p className="text-gray-500 font-medium">No service requests found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {request.requestNumber || `REQ-${String(request._id).slice(-4)}`}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">
                            {request.serviceType || "Housekeeping"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">
                            {request?.roomSnapshot?.roomNumber || "N/A"}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPriorityStyle(
                              request.priority
                            )}`}
                          >
                            {request.priority}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">
                            {request.requestedAt?.split("T")[0] || request.createdAt?.split("T")[0]}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(request)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>

                            {canCancel(request) && (
                              <button
                                onClick={() => handleCancelRequest(request)}
                                disabled={cancelLoadingId === request._id}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                title="Cancel"
                              >
                                <FaTimes className="w-4 h-4" />
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

            <div className="lg:hidden">
              {paginatedRequests.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No service requests found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedRequests.map((request) => (
                    <div key={request._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                            H
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Housekeeping</p>
                            <p className="text-xs text-gray-500">
                              Room {request?.roomSnapshot?.roomNumber || "N/A"}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            request.status
                          )}`}
                        >
                          {request.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Priority</p>
                          <p className="text-gray-700">{request.priority}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Date</p>
                          <p className="text-gray-700">
                            {request.requestedAt?.split("T")[0] || request.createdAt?.split("T")[0]}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(request)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          View Details
                        </button>

                        {canCancel(request) && (
                          <button
                            onClick={() => handleCancelRequest(request)}
                            disabled={cancelLoadingId === request._id}
                            className="flex-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                          >
                            {cancelLoadingId === request._id ? "Cancelling..." : "Cancel"}
                          </button>
                        )}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">New Service Request</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <input
                    type="text"
                    value="Housekeeping"
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Number *
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 101"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${
                      errors.roomNumber ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.roomNumber && (
                    <p className="text-red-500 text-xs font-semibold mt-2">
                      {errors.roomNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe your housekeeping request..."
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none ${
                      errors.description ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-xs font-semibold mt-2">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black disabled:opacity-60"
                >
                  {submitLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Service Request Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Request ID</p>
                  <p className="font-semibold text-gray-800">
                    {selectedRequest.requestNumber || `REQ-${String(selectedRequest._id).slice(-4)}`}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Service Type</p>
                  <p className="font-medium text-gray-800">
                    {selectedRequest.serviceType || "Housekeeping"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p>
                  <p className="font-medium text-gray-800">
                    {selectedRequest?.roomSnapshot?.roomNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Priority</p>
                  <p className="font-medium text-gray-800">{selectedRequest.priority}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Requested Date</p>
                  <p className="font-medium text-gray-800">
                    {selectedRequest.requestedAt?.split("T")[0] ||
                      selectedRequest.createdAt?.split("T")[0]}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Description</p>
                <p className="text-sm text-gray-700">{selectedRequest.description}</p>
              </div>

              {selectedRequest.note ? (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Note</p>
                  <p className="text-sm text-gray-700">{selectedRequest.note}</p>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              {canCancel(selectedRequest) && (
                <button
                  onClick={() => handleCancelRequest(selectedRequest)}
                  disabled={cancelLoadingId === selectedRequest._id}
                  className="px-6 py-2.5 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelLoadingId === selectedRequest._id ? "Cancelling..." : "Cancel Request"}
                </button>
              )}

              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                }}
                className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestServices;