import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEye, FaStar, FaRegStar } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const Feedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    roomNumber: "",
    rating: 5,
    category: "Service",
    title: "",
    comments: "",
  });

  const [errors, setErrors] = useState({});

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/guest/feedback");
      setFeedbackList(data.feedback || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const filteredFeedback = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return feedbackList.filter((f) => {
      const matchesSearch = f.guestName?.toLowerCase().includes(q) || f.title?.toLowerCase().includes(q) || f.category?.toLowerCase().includes(q);
      const matchesRating = ratingFilter === "All" || f.rating === parseInt(ratingFilter);
      return matchesSearch && matchesRating;
    });
  }, [feedbackList, searchTerm, ratingFilter]);

  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);

  const paginatedFeedback = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFeedback.slice(start, start + itemsPerPage);
  }, [filteredFeedback, currentPage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.guestName.trim()) newErrors.guestName = "Guest name is required";
    if (!formData.guestEmail.trim()) newErrors.guestEmail = "Email is required";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.comments.trim()) newErrors.comments = "Comments are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await api.post("/guest/feedback", formData);
      toast.success("Feedback submitted successfully");
      setShowForm(false);
      setFormData({ guestName: "", guestEmail: "", roomNumber: "", rating: 5, category: "Service", title: "", comments: "" });
      fetchFeedback();
    } catch (error) {
      if (error.response?.data?.message) toast.error(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? <FaStar key={star} className="text-yellow-400" /> : <FaRegStar key={star} className="text-yellow-400" />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Guest Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">Share your experience with us</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto">
          <FaPlus className="w-4 h-4" />
          Submit Feedback
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by guest name, title, category..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <select value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }} className="w-full lg:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
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
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedFeedback.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-16"><p className="text-gray-500 font-medium">No feedback found</p></td></tr>
                  ) : (
                    paginatedFeedback.map((fb) => (
                      <tr key={fb._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(fb.guestName?.charAt(0) || "G").toUpperCase()}</div>
                            <div><p className="font-medium text-gray-800">{fb.guestName}</p><p className="text-xs text-gray-500">{fb.guestEmail}</p></div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><p className="text-sm font-medium text-gray-800">{fb.title}</p></td>
                        <td className="px-6 py-4"><span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{fb.category}</span></td>
                        <td className="px-6 py-4">{renderStars(fb.rating)}</td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{fb.roomNumber || "-"}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{fb.submittedDate?.split("T")[0]}</p></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleView(fb)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><FaEye className="w-4 h-4" /></button>
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
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No feedback found</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedFeedback.map((fb) => (
                    <div key={fb._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(fb.guestName?.charAt(0) || "G").toUpperCase()}</div>
                          <div><p className="font-medium text-gray-800">{fb.guestName}</p><p className="text-xs text-gray-500">{fb.title}</p></div>
                        </div>
                        <div>{renderStars(fb.rating)}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-400 text-xs mb-1">Category</p><p className="text-gray-700">{fb.category}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Room</p><p className="text-gray-700">{fb.roomNumber || "-"}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Date</p><p className="text-gray-700">{fb.submittedDate?.split("T")[0]}</p></div>
                      </div>
                      <button onClick={() => handleView(fb)} className="w-full px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">View Details</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredFeedback.length)} of {filteredFeedback.length}</p>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Submit Feedback</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Guest Name *</label>
                  <input type="text" name="guestName" value={formData.guestName} onChange={handleChange} placeholder="Enter your name" className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${errors.guestName ? "border-red-500" : "border-gray-200"}`} />
                  {errors.guestName && <p className="text-red-500 text-xs font-semibold mt-2">{errors.guestName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input type="email" name="guestEmail" value={formData.guestEmail} onChange={handleChange} placeholder="your@gmail.com" className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${errors.guestEmail ? "border-red-500" : "border-gray-200"}`} />
                  {errors.guestEmail && <p className="text-red-500 text-xs font-semibold mt-2">{errors.guestEmail}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
                  <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} placeholder="e.g. 101" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
                    <option value="Service">Service</option>
                    <option value="Cleanliness">Cleanliness</option>
                    <option value="Facilities">Facilities</option>
                    <option value="Staff">Staff</option>
                    <option value="Food">Food</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Brief summary of your feedback" className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${errors.title ? "border-red-500" : "border-gray-200"}`} />
                  {errors.title && <p className="text-red-500 text-xs font-semibold mt-2">{errors.title}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => handleRatingChange(star)} className="text-3xl focus:outline-none transition-transform hover:scale-110">
                        {star <= formData.rating ? <FaStar className="text-yellow-400" /> : <FaRegStar className="text-gray-300" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Comments *</label>
                  <textarea name="comments" value={formData.comments} onChange={handleChange} rows="5" placeholder="Share your detailed feedback..." className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none ${errors.comments ? "border-red-500" : "border-gray-200"}`} />
                  {errors.comments && <p className="text-red-500 text-xs font-semibold mt-2">{errors.comments}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black disabled:opacity-60">{loading ? "Submitting..." : "Submit Feedback"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">Feedback Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-bold text-xl">{(selectedFeedback.guestName?.charAt(0) || "G").toUpperCase()}</div>
                <div><p className="text-lg font-bold text-gray-800">{selectedFeedback.guestName}</p><p className="text-sm text-gray-500">{selectedFeedback.guestEmail}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Category</p><p className="font-medium text-gray-800">{selectedFeedback.category}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p><p className="font-medium text-gray-800">{selectedFeedback.roomNumber || "-"}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Rating</p><div className="mt-1">{renderStars(selectedFeedback.rating)}</div></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Date</p><p className="font-medium text-gray-800">{selectedFeedback.submittedDate?.split("T")[0]}</p></div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Title</p>
                <p className="font-medium text-gray-800">{selectedFeedback.title}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Comments</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedFeedback.comments}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
