import React, { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaEye,
  FaStar,
  FaRegStar,
  FaEdit,
  FaTrash,
  FaCommentDots,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const FEEDBACK_CATEGORIES = [
  "Stay",
  "Service",
  "Staff",
  "Cleanliness",
  "Food",
  "Other",
];

const INITIAL_FORM_DATA = {
  category: "Service",
  rating: 5,
  title: "",
  message: "",
};

const Feedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [currentStay, setCurrentStay] = useState(null);

  const [loading, setLoading] = useState(false);
  const [stayLoading, setStayLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);

  const [selectedFeedback, setSelectedFeedback] = useState(null);
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

  const normalizeFeedback = (item) => {
    const guestSnapshot = item?.guestSnapshot || {};
    const room = item?.room || {};
    const roomSnapshot = item?.roomSnapshot || {};
    const reservation = item?.reservation || {};

    return {
      _id: item?._id,
      feedbackNumber: item?.feedbackNumber || `FDB-${String(item?._id || "").slice(-4)}`,
      guestName: guestSnapshot?.name || user?.name || "Guest",
      guestEmail: guestSnapshot?.email || user?.email || "",
      category: item?.category || "Service",
      rating: Number(item?.rating || 0),
      title: item?.title || "",
      message: item?.message || "",
      status: item?.status || "Submitted",
      adminResponse: item?.adminResponse || "",
      respondedBy: item?.respondedBy || null,
      respondedAt: item?.respondedAt || "",
      roomNumber: room?.roomNumber || roomSnapshot?.roomNumber || "",
      roomType: room?.roomType || roomSnapshot?.roomType || "",
      reservationNumber: reservation?.reservationNumber || "",
      bookingStatus: reservation?.bookingStatus || "",
      createdAt: item?.createdAt || "",
      updatedAt: item?.updatedAt || "",
    };
  };

  const fetchCurrentStay = async () => {
    try {
      setStayLoading(true);
      const { data } = await api.get("/guest/current-stay");
      setCurrentStay(data?.stay || null);
    } catch {
      setCurrentStay(null);
    } finally {
      setStayLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/guest/feedback");
      const raw = data?.feedback || [];
      setFeedbackList(raw.map(normalizeFeedback));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isGuest) {
      fetchFeedback();
      fetchCurrentStay();
    }
  }, [isGuest]);

  const filteredFeedback = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return feedbackList.filter((f) => {
      const matchesSearch =
        !q ||
        f.guestName?.toLowerCase().includes(q) ||
        f.guestEmail?.toLowerCase().includes(q) ||
        f.title?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q) ||
        f.message?.toLowerCase().includes(q) ||
        f.feedbackNumber?.toLowerCase().includes(q) ||
        String(f.roomNumber || "").toLowerCase().includes(q);

      const matchesRating =
        ratingFilter === "All" || f.rating === Number(ratingFilter);

      const matchesStatus =
        statusFilter === "All" || f.status === statusFilter;

      return matchesSearch && matchesRating && matchesStatus;
    });
  }, [feedbackList, searchTerm, ratingFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFeedback.length / itemsPerPage));

  const paginatedFeedback = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFeedback.slice(start, start + itemsPerPage);
  }, [filteredFeedback, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    return {
      total: feedbackList.length,
      submitted: feedbackList.filter((f) => f.status === "Submitted").length,
      reviewed: feedbackList.filter((f) => f.status === "Reviewed").length,
      averageRating: feedbackList.length
        ? (
            feedbackList.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
            feedbackList.length
          ).toFixed(1)
        : "0.0",
    };
  }, [feedbackList]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
    setErrors((prev) => ({ ...prev, rating: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    if (!formData.rating) newErrors.rating = "Rating is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setEditingFeedback(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (feedback) => {
    setEditingFeedback(feedback);
    setFormData({
      category: feedback.category || "Service",
      rating: feedback.rating || 5,
      title: feedback.title || "",
      message: feedback.message || "",
    });
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const canEditOrDelete = (feedback) => String(feedback?.status || "") !== "Reviewed";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);

      const payload = {
        category: formData.category,
        rating: formData.rating,
        title: formData.title.trim(),
        message: formData.message.trim(),
      };

      if (editingFeedback?._id) {
        const { data } = await api.put(`/guest/feedback/${editingFeedback._id}`, payload);
        const updated = normalizeFeedback(data?.feedback || { ...editingFeedback, ...payload });

        setFeedbackList((prev) =>
          prev.map((item) => (item._id === editingFeedback._id ? updated : item))
        );

        if (selectedFeedback?._id === editingFeedback._id) {
          setSelectedFeedback(updated);
        }

        toast.success(data?.message || "Feedback updated successfully");
      } else {
        const { data } = await api.post("/guest/feedback", payload);
        const newFeedback = normalizeFeedback(data?.feedback || payload);
        setFeedbackList((prev) => [newFeedback, ...prev]);
        toast.success(data?.message || "Feedback submitted successfully");
      }

      closeForm();
      setCurrentPage(1);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleView = async (feedback) => {
    try {
      const { data } = await api.get(`/guest/feedback/${feedback._id}`);
      setSelectedFeedback(normalizeFeedback(data?.feedback || feedback));
      setShowModal(true);
    } catch (error) {
      setSelectedFeedback(feedback);
      setShowModal(true);
      toast.error(error?.response?.data?.message || "Failed to fetch feedback details");
    }
  };

  const handleDelete = async (feedback) => {
    const ok = window.confirm(`Delete feedback "${feedback.title}"?`);
    if (!ok) return;

    try {
      setDeleteLoadingId(feedback._id);
      const { data } = await api.delete(`/guest/feedback/${feedback._id}`);

      setFeedbackList((prev) => prev.filter((item) => item._id !== feedback._id));

      if (selectedFeedback?._id === feedback._id) {
        setSelectedFeedback(null);
        setShowModal(false);
      }

      toast.success(data?.message || "Feedback deleted successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete feedback");
    } finally {
      setDeleteLoadingId("");
    }
  };

  const renderStars = (rating, size = "text-yellow-400") => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) =>
          star <= Number(rating) ? (
            <FaStar key={star} className={size} />
          ) : (
            <FaRegStar key={star} className={size} />
          )
        )}
      </div>
    );
  };

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
          <h1 className="text-2xl font-bold text-[#1e266d]">Guest Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">
            Share your experience and manage your submitted feedback
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto"
        >
          <FaPlus className="w-4 h-4" />
          Submit Feedback
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1e266d]/10 flex items-center justify-center text-[#1e266d] shrink-0">
            <FaCommentDots className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">Current Stay Context</h3>

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
              <p className="text-sm text-gray-500 mt-2">
                No current checked-in stay found. You can still submit general feedback.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total Feedback</p>
          <p className="text-2xl font-bold text-[#1e266d] mt-1">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Submitted</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.submitted}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Reviewed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.reviewed}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Average Rating</p>
          <p className="text-2xl font-bold text-[#1e266d] mt-1">{stats.averageRating}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by feedback no, title, category, message, room..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full lg:w-44 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full lg:w-44 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
          >
            <option value="All">All Status</option>
            <option value="Submitted">Submitted</option>
            <option value="Reviewed">Reviewed</option>
          </select>

          <span className="text-sm text-gray-500">{filteredFeedback.length} feedback</span>
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
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Feedback
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Room
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
                  {paginatedFeedback.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-16">
                        <p className="text-gray-500 font-medium">No feedback found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedFeedback.map((fb) => (
                      <tr key={fb._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                              {(fb.guestName?.charAt(0) || "G").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{fb.guestName}</p>
                              <p className="text-xs text-gray-500">{fb.guestEmail}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-800">{fb.title}</p>
                          <p className="text-xs text-gray-500">{fb.feedbackNumber}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {fb.category}
                          </span>
                        </td>

                        <td className="px-6 py-4">{renderStars(fb.rating)}</td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{fb.roomNumber || "-"}</p>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              fb.status === "Reviewed"
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                          >
                            {fb.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{formatDate(fb.createdAt)}</p>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleView(fb)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>

                            {canEditOrDelete(fb) && (
                              <>
                                <button
                                  onClick={() => openEditForm(fb)}
                                  className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                  title="Edit"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDelete(fb)}
                                  disabled={deleteLoadingId === fb._id}
                                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                  title="Delete"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </>
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
              {paginatedFeedback.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No feedback found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedFeedback.map((fb) => (
                    <div key={fb._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                            {(fb.guestName?.charAt(0) || "G").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{fb.guestName}</p>
                            <p className="text-xs text-gray-500">{fb.title}</p>
                          </div>
                        </div>

                        <div>{renderStars(fb.rating)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Category</p>
                          <p className="text-gray-700">{fb.category}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Room</p>
                          <p className="text-gray-700">{fb.roomNumber || "-"}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Date</p>
                          <p className="text-gray-700">{formatDate(fb.createdAt)}</p>
                        </div>

                        <div>
                          <p className="text-gray-400 text-xs mb-1">Status</p>
                          <p className="text-gray-700">{fb.status}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(fb)}
                          className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          View Details
                        </button>

                        {canEditOrDelete(fb) && (
                          <button
                            onClick={() => openEditForm(fb)}
                            className="flex-1 px-3 py-2 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100"
                          >
                            Edit
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
                  {Math.min(currentPage * itemsPerPage, filteredFeedback.length)} of{" "}
                  {filteredFeedback.length}
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
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">
                {editingFeedback ? "Edit Feedback" : "Submit Feedback"}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Auto Guest Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Guest Name</p>
                    <p className="text-sm font-medium text-gray-800">{user?.name || "Guest"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                    <p className="text-sm font-medium text-gray-800">{user?.email || "N/A"}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Room</p>
                    <p className="text-sm font-medium text-gray-800">
                      {currentStay?.room?.roomNumber || "General Feedback"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                  >
                    {FEEDBACK_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rating *
                  </label>
                  <div className="flex gap-2 pt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(star)}
                        className="text-3xl focus:outline-none transition-transform hover:scale-110"
                      >
                        {star <= formData.rating ? (
                          <FaStar className="text-yellow-400" />
                        ) : (
                          <FaRegStar className="text-gray-300" />
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.rating && (
                    <p className="text-red-500 text-xs font-semibold mt-2">{errors.rating}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief summary of your feedback"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${
                      errors.title ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs font-semibold mt-2">{errors.title}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    placeholder="Share your detailed feedback..."
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none ${
                      errors.message ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.message && (
                    <p className="text-red-500 text-xs font-semibold mt-2">{errors.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black disabled:opacity-60"
                >
                  {submitLoading
                    ? editingFeedback
                      ? "Updating..."
                      : "Submitting..."
                    : editingFeedback
                    ? "Update Feedback"
                    : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Feedback Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {(selectedFeedback.guestName?.charAt(0) || "G").toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{selectedFeedback.guestName}</p>
                  <p className="text-sm text-gray-500">{selectedFeedback.guestEmail}</p>
                  <p className="text-xs text-gray-400 mt-1">{selectedFeedback.feedbackNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Category</p>
                  <p className="font-medium text-gray-800">{selectedFeedback.category}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p>
                  <p className="font-medium text-gray-800">{selectedFeedback.roomNumber || "-"}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Rating</p>
                  <div className="mt-1">{renderStars(selectedFeedback.rating)}</div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                  <p className="font-medium text-gray-800">{formatDate(selectedFeedback.createdAt)}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <p className="font-medium text-gray-800">{selectedFeedback.status}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Reservation</p>
                  <p className="font-medium text-gray-800">
                    {selectedFeedback.reservationNumber || "-"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Title</p>
                <p className="font-medium text-gray-800">{selectedFeedback.title}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Message</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>

              {selectedFeedback.adminResponse ? (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Admin Response
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedFeedback.adminResponse}
                  </p>
                  {selectedFeedback.respondedAt ? (
                    <p className="text-xs text-gray-400 mt-2">
                      Responded on {formatDate(selectedFeedback.respondedAt)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              {canEditOrDelete(selectedFeedback) && (
                <>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      openEditForm(selectedFeedback);
                    }}
                    className="px-6 py-2.5 border border-amber-300 text-amber-600 rounded-xl font-semibold hover:bg-amber-50"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(selectedFeedback)}
                    disabled={deleteLoadingId === selectedFeedback._id}
                    className="px-6 py-2.5 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 disabled:opacity-50"
                  >
                    {deleteLoadingId === selectedFeedback._id ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFeedback(null);
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

export default Feedback;