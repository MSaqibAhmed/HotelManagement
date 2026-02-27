import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEye } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../../api";

const THEME = "#d6c3b3";

const RequestServices = () => {
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 5;

  const [formData, setFormData] = useState({
    serviceType: "Housekeeping",
    description: "",
    priority: "Normal",
    roomNumber: "",
  });

  const [errors, setErrors] = useState({});

  const fetchServiceRequests = () => {
    setLoading(true);
    setTimeout(() => {
      setServiceRequests([
        { _id: "sr1", requestId: "REQ-0001", serviceType: "Housekeeping", roomNumber: "101", priority: "Normal", status: "Pending", description: "Need extra towels", requestDate: "2026-03-01T10:00:00.000Z" },
        { _id: "sr2", requestId: "REQ-0002", serviceType: "Room Service", roomNumber: "205", priority: "High", status: "In Progress", description: "Breakfast for two", requestDate: "2026-03-02T08:30:00.000Z" }
      ]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending": return "bg-amber-50 text-amber-600 border border-amber-200";
      case "In Progress": return "bg-blue-50 text-blue-600 border border-blue-200";
      case "Completed": return "bg-emerald-50 text-emerald-600 border border-emerald-200";
      case "Cancelled": return "bg-red-50 text-red-600 border border-red-200";
      default: return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  const filteredRequests = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return serviceRequests.filter((r) => {
      const matchesSearch = r.serviceType?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.roomNumber?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
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
    if (!formData.serviceType) newErrors.serviceType = "Service type is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.roomNumber.trim()) newErrors.roomNumber = "Room number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setTimeout(() => {
      const newRequest = {
        _id: "sr" + Date.now(),
        requestId: "REQ-" + Math.floor(Math.random() * 10000),
        ...formData,
        status: "Pending",
        requestDate: new Date().toISOString()
      };
      setServiceRequests(prev => [newRequest, ...prev]);
      toast.success("Service request submitted successfully (Dummy)");
      setShowForm(false);
      setFormData({ serviceType: "Housekeeping", description: "", priority: "Normal", roomNumber: "" });
      setLoading(false);
    }, 500);
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Request Services</h1>
          <p className="text-sm text-gray-500 mt-1">Request hotel services for your stay</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto">
          <FaPlus className="w-4 h-4" />
          New Service Request
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by service type, description..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="w-full lg:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Request ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Service Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Requested Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedRequests.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-16"><p className="text-gray-500 font-medium">No service requests found</p></td></tr>
                  ) : (
                    paginatedRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4"><p className="font-semibold text-gray-800">{req.requestId || `REQ${req._id.slice(-4)}`}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{req.serviceType}</p></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{req.roomNumber}</p></td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${req.priority === "High" ? "bg-red-50 text-red-600" : req.priority === "Urgent" ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-700"}`}>{req.priority}</span></td>
                        <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(req.status)}`}>{req.status}</span></td>
                        <td className="px-6 py-4"><p className="text-sm text-gray-700">{req.requestDate?.split("T")[0]}</p></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleView(req)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><FaEye className="w-4 h-4" /></button>
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
                <div className="text-center py-16 px-4"><p className="text-gray-500 font-medium">No service requests found</p></div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedRequests.map((req) => (
                    <div key={req._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">{(req.serviceType?.charAt(0) || "S").toUpperCase()}</div>
                          <div><p className="font-medium text-gray-800">{req.serviceType}</p><p className="text-xs text-gray-500">Room {req.roomNumber}</p></div>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(req.status)}`}>{req.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-gray-400 text-xs mb-1">Priority</p><p className="text-gray-700">{req.priority}</p></div>
                        <div><p className="text-gray-400 text-xs mb-1">Date</p><p className="text-gray-700">{req.requestDate?.split("T")[0]}</p></div>
                      </div>
                      <button onClick={() => handleView(req)} className="w-full px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">View Details</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}</p>
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
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#1e266d]">New Service Request</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Service Type *</label>
                  <select name="serviceType" value={formData.serviceType} onChange={handleChange} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${errors.serviceType ? "border-red-500" : "border-gray-200"}`}>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Room Service">Room Service</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Concierge">Concierge</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.serviceType && <p className="text-red-500 text-xs font-semibold mt-2">{errors.serviceType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number *</label>
                  <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} placeholder="e.g. 101" className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none ${errors.roomNumber ? "border-red-500" : "border-gray-200"}`} />
                  {errors.roomNumber && <p className="text-red-500 text-xs font-semibold mt-2">{errors.roomNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white">
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe your service request..." className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none ${errors.description ? "border-red-500" : "border-gray-200"}`} />
                  {errors.description && <p className="text-red-500 text-xs font-semibold mt-2">{errors.description}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl font-bold hover:bg-black disabled:opacity-60">{loading ? "Submitting..." : "Submit Request"}</button>
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
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Request ID</p><p className="font-semibold text-gray-800">{selectedRequest.requestId || `REQ${selectedRequest._id.slice(-4)}`}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Status</p><span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(selectedRequest.status)}`}>{selectedRequest.status}</span></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Service Type</p><p className="font-medium text-gray-800">{selectedRequest.serviceType}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Room Number</p><p className="font-medium text-gray-800">{selectedRequest.roomNumber}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Priority</p><p className="font-medium text-gray-800">{selectedRequest.priority}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Requested Date</p><p className="font-medium text-gray-800">{selectedRequest.requestDate?.split("T")[0]}</p></div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Description</p>
                <p className="text-sm text-gray-700">{selectedRequest.description}</p>
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

export default RequestServices;
