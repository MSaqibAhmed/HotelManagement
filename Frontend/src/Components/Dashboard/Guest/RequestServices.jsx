import React, { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEye,
  FaTimes,
  FaBed,
  FaTools,
  FaBroom,
  FaClipboardList,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const INITIAL_FORM_DATA = {
  serviceType: "Housekeeping",
  title: "",
  description: "",
  priority: "Normal",
  category: "Cleaning",
  checklist: [
    { label: "Change bedsheets", isDone: false },
    { label: "Restock towels", isDone: false },
    { label: "Clean washroom", isDone: false },
  ],
};

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Assigned",
  "In-Progress",
  "Completed",
  "Cancelled",
];

const HOUSEKEEPING_CATEGORIES = [
  "Cleaning",
  "Laundry",
  "Supplies",
  "Room Setup",
  "Other",
];

const MAINTENANCE_CATEGORIES = [
  "Electrical",
  "Plumbing",
  "HVAC",
  "Carpentry",
  "Appliances",
  "Other",
];

const HOUSEKEEPING_PRIORITIES = ["Low", "Normal", "High"];
const MAINTENANCE_PRIORITIES = ["Low", "Medium", "High"];

const RequestServices = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [currentStay, setCurrentStay] = useState(null);

  const [loading, setLoading] = useState(false);
  const [stayLoading, setStayLoading] = useState(false);
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

  const getUserFromStorage = () => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  };

  const user = useMemo(() => getUserFromStorage(), []);
  const role = String(user?.role || "").toLowerCase();
  const isGuest = role === "guest";

  const formatDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };

  const normalizeStatus = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "pending") return "Pending";
    if (value === "assigned") return "Assigned";
    if (value === "in-progress" || value === "in progress") return "In-Progress";
    if (value === "completed") return "Completed";
    if (value === "cancelled" || value === "canceled") return "Cancelled";

    return status || "Pending";
  };

  const normalizeServiceRequest = (item) => ({
    _id: item?._id,
    requestNumber: item?.requestNumber || `REQ-${String(item?._id || "").slice(-4)}`,
    serviceType: item?.serviceType || "Housekeeping",
    title: item?.title || "",
    description: item?.description || "",
    location: item?.location || "",
    category: item?.category || "Other",
    priority: item?.priority || "Normal",
    status: normalizeStatus(item?.status),
    assignedTo: item?.assignedTo || null,
    room: item?.room || null,
    createdAt: item?.createdAt || "",
    updatedAt: item?.updatedAt || "",
  });

  const fetchCurrentStay = async () => {
    try {
      setStayLoading(true);
      const { data } = await api.get("/guest/current-stay");
      setCurrentStay(data?.stay || null);
    } catch (err) {
      setCurrentStay(null);
    } finally {
      setStayLoading(false);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/guest/service-requests");
      const raw = data?.requests || [];
      setServiceRequests(raw.map(normalizeServiceRequest));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch service requests");
      setServiceRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isGuest) {
      fetchCurrentStay();
      fetchServiceRequests();
    }
  }, [isGuest]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-600 border border-amber-200";
      case "Assigned":
        return "bg-indigo-50 text-indigo-600 border border-indigo-200";
      case "In-Progress":
        return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Completed":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Cancelled":
        return "bg-gray-100 text-gray-600 border border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (String(priority || "").toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-600";
      case "medium":
        return "bg-orange-50 text-orange-600";
      case "normal":
        return "bg-gray-100 text-gray-700";
      case "low":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredRequests = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return serviceRequests.filter((request) => {
      const requestNumber = String(request?.requestNumber || "").toLowerCase();
      const roomNumber = String(request?.room?.roomNumber || "").toLowerCase();
      const description = String(request?.description || "").toLowerCase();
      const title = String(request?.title || "").toLowerCase();
      const priority = String(request?.priority || "").toLowerCase();
      const status = String(request?.status || "").toLowerCase();
      const serviceType = String(request?.serviceType || "").toLowerCase();
      const category = String(request?.category || "").toLowerCase();

      const matchesSearch =
        !q ||
        requestNumber.includes(q) ||
        roomNumber.includes(q) ||
        description.includes(q) ||
        title.includes(q) ||
        priority.includes(q) ||
        status.includes(q) ||
        serviceType.includes(q) ||
        category.includes(q);

      const matchesStatus =
        statusFilter === "All" || String(request?.status || "") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [serviceRequests, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      total: serviceRequests.length,
      pending: serviceRequests.filter((r) => r.status === "Pending").length,
      inProgress: serviceRequests.filter((r) => r.status === "In-Progress").length,
      completed: serviceRequests.filter((r) => r.status === "Completed").length,
    };
  }, [serviceRequests]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "serviceType") {
        if (value === "Housekeeping") {
          updated.priority = "Normal";
          updated.category = "Cleaning";
          updated.checklist = INITIAL_FORM_DATA.checklist;
        } else {
          updated.priority = "Medium";
          updated.category = "Electrical";
          updated.checklist = [];
        }
      }

      return updated;
    });

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!currentStay) {
      toast.error("Only checked-in guests can request services");
      return false;
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
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
        serviceType: formData.serviceType,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category,
        checklist: formData.serviceType === "Housekeeping" ? formData.checklist : undefined,
      };

      const { data } = await api.post("/guest/service-requests", payload);

      const newRequest = normalizeServiceRequest(data?.request || {});
      setServiceRequests((prev) => [newRequest, ...prev]);

      toast.success(data?.message || "Service request submitted successfully");

      setShowForm(false);
      resetForm();
      setCurrentPage(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleCancelRequest = async (request) => {
    const ok = window.confirm(
      `Cancel ${request?.serviceType} request ${request?.requestNumber || ""}?`
    );
    if (!ok) return;

    try {
      setCancelLoadingId(request._id);

      const { data } = await api.patch(
        `/guest/service-requests/${request.serviceType}/${request._id}/cancel`
      );

      setServiceRequests((prev) =>
        prev.map((item) =>
          item._id === request._id
            ? { ...item, status: "Cancelled" }
            : item
        )
      );

      if (selectedRequest?._id === request._id) {
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: "Cancelled" } : prev
        );
      }

      toast.success(data?.message || "Request cancelled successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel request");
    } finally {
      setCancelLoadingId("");
    }
  };

  const canCancel = (request) =>
    ["Pending", "Assigned"].includes(String(request?.status || ""));

  const isHousekeeping = formData.serviceType === "Housekeeping";
  const currentCategories = isHousekeeping
    ? HOUSEKEEPING_CATEGORIES
    : MAINTENANCE_CATEGORIES;
  const currentPriorities = isHousekeeping
    ? HOUSEKEEPING_PRIORITIES
    : MAINTENANCE_PRIORITIES;

  if (!isGuest) {
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
        <p className="text-lg font-semibold text-red-600">Access Denied</p>
        <p className="text-sm text-gray-500 mt-2">
          This page is only available for guest accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Request Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Request housekeeping or maintenance service during your stay
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentStay) {
              toast.error("Only checked-in guests can request services");
              return;
            }
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto"
        >
          <FaPlus className="w-4 h-4" />
          New Service Request
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1e266d]/10 flex items-center justify-center text-[#1e266d] shrink-0">
            <FaBed className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Current Stay</h3>

            {stayLoading ? (
              <p className="text-sm text-gray-500 mt-1">Loading stay details...</p>
            ) : currentStay ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Reservation</p>
                  <p className="text-sm font-medium text-gray-800">
                    {currentStay?.reservationNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p>
                  <p className="text-sm font-medium text-gray-800">
                    {currentStay?.room?.roomNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Room Type</p>
                  <p className="text-sm font-medium text-gray-800">
                    {currentStay?.room?.roomType || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Check-Out</p>
                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(currentStay?.checkOutDate)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-red-600 font-medium">
                  No checked-in stay found.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Service requests can only be created by checked-in guests.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Requests</p>
          <p className="text-2xl font-bold text-[#1e266d] mt-1">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by request no, type, room, category, status or title..."
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
              <table className="w-full min-w-[1050px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Request ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Service Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Title
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
                      <td colSpan="8" className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <FaClipboardList className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No service requests found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Your guest service requests will appear here
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">
                            {request.requestNumber}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {request.serviceType === "Maintenance" ? (
                              <FaTools className="text-[#1e266d]" />
                            ) : (
                              <FaBroom className="text-[#1e266d]" />
                            )}
                            <p className="text-sm text-gray-700">{request.serviceType}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-800">{request.title}</p>
                          <p className="text-xs text-gray-500">{request.category}</p>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">
                            {request?.room?.roomNumber || currentStay?.room?.roomNumber || "N/A"}
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
                          <p className="text-sm text-gray-700">{formatDate(request.createdAt)}</p>
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
                  <FaClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No service requests found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedRequests.map((request) => (
                    <div key={request._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                            {request.serviceType === "Maintenance" ? "M" : "H"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{request.serviceType}</p>
                            <p className="text-xs text-gray-500">
                              Room {request?.room?.roomNumber || "N/A"}
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

                      <div>
                        <p className="text-sm font-medium text-gray-800">{request.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{request.category}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Priority</p>
                          <p className="text-gray-700">{request.priority}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Date</p>
                          <p className="text-gray-700">{formatDate(request.createdAt)}</p>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
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

            {!currentStay ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600 font-medium">
                  No checked-in stay found. You must be checked-in to request services.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Room Auto Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Reservation</p>
                      <p className="text-sm font-medium text-gray-800">
                        {currentStay?.reservationNumber || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p>
                      <p className="text-sm font-medium text-gray-800">
                        {currentStay?.room?.roomNumber || "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Room Type</p>
                      <p className="text-sm font-medium text-gray-800">
                        {currentStay?.room?.roomType || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                    >
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                    >
                      {currentCategories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
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
                      {currentPriorities.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder={
                        formData.serviceType === "Housekeeping"
                          ? "e.g. Room cleaning needed"
                          : "e.g. AC not cooling"
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${errors.title ? "border-red-500" : "border-gray-200"
                        }`}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-xs font-semibold mt-2">
                        {errors.title}
                      </p>
                    )}
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
                      placeholder={
                        formData.serviceType === "Housekeeping"
                          ? "Describe your housekeeping request..."
                          : "Describe the maintenance issue..."
                      }
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none ${errors.description ? "border-red-500" : "border-gray-200"
                        }`}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-xs font-semibold mt-2">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {formData.serviceType === "Housekeeping" && (
                    <div className="md:col-span-2 mt-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Housekeeping Checklist
                      </label>
                      <div className="bg-white border text-sm border-gray-200 rounded-xl p-3 space-y-2">
                        {formData.checklist?.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={item.isDone}
                              onChange={(e) => {
                                const newChecklist = [...formData.checklist];
                                newChecklist[index].isDone = e.target.checked;
                                setFormData({ ...formData, checklist: newChecklist });
                              }}
                              className="w-4 h-4 accent-[#1e266d] bg-gray-100 border-gray-300 rounded"
                            />
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => {
                                const newChecklist = [...formData.checklist];
                                newChecklist[index].label = e.target.value;
                                setFormData({ ...formData, checklist: newChecklist });
                              }}
                              className="flex-1 bg-transparent border-none outline-none text-gray-700 focus:ring-0 p-0"
                              placeholder="Task name"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newChecklist = formData.checklist.filter((_, i) => i !== index);
                                setFormData({ ...formData, checklist: newChecklist });
                              }}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              checklist: [...(formData.checklist || []), { label: "", isDone: false }],
                            });
                          }}
                          className="text-sm font-semibold text-[#1e266d] hover:text-blue-800 flex items-center gap-1 mt-2"
                        >
                          <FaPlus className="w-3 h-3" /> Add Item
                        </button>
                      </div>
                    </div>
                  )}
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
            )}
          </div>
        </div>
      )}

      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1e266d]">Service Request Details</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedRequest.requestNumber}</p>
              </div>

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
                  <p className="font-semibold text-gray-800">{selectedRequest.requestNumber}</p>
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
                  <p className="font-medium text-gray-800">{selectedRequest.serviceType}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p>
                  <p className="font-medium text-gray-800">
                    {selectedRequest?.room?.roomNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Category</p>
                  <p className="font-medium text-gray-800">{selectedRequest.category}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Priority</p>
                  <p className="font-medium text-gray-800">{selectedRequest.priority}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Requested Date</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Assigned To</p>
                  <p className="font-medium text-gray-800">
                    {selectedRequest?.assignedTo?.name || "Not assigned"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Title</p>
                <p className="text-sm text-gray-700">{selectedRequest.title}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Description</p>
                <p className="text-sm text-gray-700">{selectedRequest.description}</p>
              </div>

              {selectedRequest.location ? (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Location</p>
                  <p className="text-sm text-gray-700">{selectedRequest.location}</p>
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