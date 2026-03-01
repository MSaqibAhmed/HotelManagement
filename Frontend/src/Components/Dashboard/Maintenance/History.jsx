import React, { useEffect, useMemo, useState } from "react";
import { FaHistory, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { toast } from "react-toastify";

const dummyHistory = [
  { _id: "3", title: "Broken Light", description: "Ceiling light is flickering", location: "Lobby", priority: "Medium", category: "Electrical", status: "completed", assignedTo: { name: "Mike Johnson" }, completedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { _id: "5", title: "Door Lock Jammed", description: "Cannot open door with card", location: "Room 410", priority: "High", category: "Carpentry", status: "cancelled", updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() }
];
const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    search: "",
  });

  const itemsPerPage = 5;

  // Fetch history from backend (mocked)
  const fetchHistory = () => {
    setLoading(true);
    setTimeout(() => {
      setHistory(dummyHistory);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Search filter
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const q = filters.search.toLowerCase().trim();
      const matchesSearch =
        !filters.search ||
        item.title?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q);

      const matchesStatus =
        filters.status === "all" ||
        item.status?.toLowerCase() === filters.status.toLowerCase();

      const matchesPriority =
        filters.priority === "all" ||
        item.priority?.toLowerCase() === filters.priority.toLowerCase();

      const matchesCategory =
        filters.category === "all" ||
        item.category?.toLowerCase() === filters.category.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [history, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, currentPage]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      priority: "all",
      category: "all",
      search: "",
    });
  };

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
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
          icon: FaHistory,
          label: status,
        };
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

  // Stats
  const stats = useMemo(() => {
    return {
      total: history.length,
      completed: history.filter((r) => r.status?.toLowerCase() === "completed").length,
      cancelled: history.filter((r) => r.status?.toLowerCase() === "cancelled").length,
    };
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Maintenance History</h1>
        <p className="text-sm text-gray-500 mt-1">
          View completed and cancelled maintenance requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Total History</p>
          <p className="text-2xl font-bold text-[#1e266d] mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="text-gray-400" />
          <h3 className="font-semibold text-gray-700">Filters</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder="Title or location..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white text-sm"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white text-sm"
            >
              <option value="all">All Categories</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="HVAC">HVAC</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Appliances">Appliances</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={clearFilters}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition text-sm"
          >
            Clear Filters
          </button>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Completed Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {paginatedHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <FaHistory className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No history found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Completed or cancelled requests will appear here
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((item) => {
                      const statusConfig = getStatusConfig(item.status);
                      const StatusIcon = statusConfig.icon;
                      const priorityConfig = getPriorityConfig(item.priority);

                      return (
                        <tr key={item._id} className="hover:bg-gray-50">
                          {/* Request */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-800">{item.title}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {item.description}
                              </p>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">{item.location}</p>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700 capitalize">{item.category}</p>
                          </td>

                          {/* Priority */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${priorityConfig.bg} ${priorityConfig.text}`}
                            >
                              {item.priority}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize ${statusConfig.bg} ${statusConfig.text}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </td>

                          {/* Assigned To */}
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">
                              {item.assignedTo?.name || "Unassigned"}
                            </p>
                          </td>

                          {/* Completed Date */}
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">
                              {item.completedAt
                                ? new Date(item.completedAt).toLocaleDateString()
                                : item.updatedAt
                                  ? new Date(item.updatedAt).toLocaleDateString()
                                  : "N/A"}
                            </p>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              {paginatedHistory.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <FaHistory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No history found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Completed or cancelled requests will appear here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedHistory.map((item) => {
                    const statusConfig = getStatusConfig(item.status);
                    const StatusIcon = statusConfig.icon;
                    const priorityConfig = getPriorityConfig(item.priority);

                    return (
                      <div key={item._id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 truncate">{item.location}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Category</p>
                            <p className="text-gray-700 capitalize">{item.category}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Priority</p>
                            <span
                              className={`inline-flex px-2 py-1 rounded text-xs font-medium capitalize ${priorityConfig.bg} ${priorityConfig.text}`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Status</p>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium capitalize ${statusConfig.bg} ${statusConfig.text}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Assigned To</p>
                            <p className="text-gray-700">{item.assignedTo?.name || "Unassigned"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of{" "}
                  {filteredHistory.length}
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
    </div>
  );
};

export default History;
