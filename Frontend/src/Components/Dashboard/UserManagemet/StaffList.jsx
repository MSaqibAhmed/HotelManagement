import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaSearch, FaEdit, FaTrash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";
import EditStaffModal from "./EditStaffModal";

const StaffList = () => {
  const [staffList, setStaffList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const itemsPerPage = 5;

  //Fetch staff from backend
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/staff");
      setStaffList(res.data.staff || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  //Search filter
  const filteredStaff = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return staffList.filter((s) => {
      return (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.role?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q)
      );
    });
  }, [staffList, searchTerm]);

  //Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStaff.slice(start, start + itemsPerPage);
  }, [filteredStaff, currentPage]);

  // Toggle active/inactive
  const toggleStatus = async (staff) => {
    try {
      const newStatus = !staff.isActive;

      await api.patch(`/auth/staff/${staff._id}/status`, {
        isActive: newStatus,
      });

      setStaffList((prev) =>
        prev.map((s) =>
          s._id === staff._id ? { ...s, isActive: newStatus } : s
        )
      );

      toast.success(`${staff.name} is now ${newStatus ? "Active" : "Inactive"}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Status update failed");
    }
  };

  // Delete staff
  const handleDelete = async (staff) => {
    const ok = window.confirm(`Delete ${staff.name}?`);
    if (!ok) return;

    try {
      await api.delete(`/auth/staff/${staff._id}`);

      setStaffList((prev) => prev.filter((s) => s._id !== staff._id));

      toast.success("Staff deleted successfully");

      // if deleting last item of page, go back one page safely
      setCurrentPage((prevPage) => {
        const newLength = filteredStaff.length - 1;
        const newTotalPages = Math.max(1, Math.ceil(newLength / itemsPerPage));
        return Math.min(prevPage, newTotalPages);
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  // Update local list after modal update
  const handleUpdateStaff = (updatedStaff) => {
    setStaffList((prev) =>
      prev.map((s) => (s._id === updatedStaff._id ? updatedStaff : s))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your hotel staff</p>
        </div>

        <Link
          to="/dashboard/user-management/add-staff"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition shadow-xl w-full sm:w-auto"
        >
          <FaPlus className="w-4 h-4" />
          Add New Staff
        </Link>
      </div>

      {/* Search Card */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, role, or department..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <span className="text-sm text-gray-500 sm:whitespace-nowrap">
            {filteredStaff.length} staff members
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
            {/* Desktop / Tablet Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Staff
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                      Department
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
                  {paginatedStaff.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
                        <div className="flex flex-col items-center">
                          <p className="text-gray-500 font-medium">No staff found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Try changing search or add a new staff member
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedStaff.map((staff) => (
                      <tr key={staff._id} className="hover:bg-gray-50">
                        {/* Staff */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                              {(staff.name?.charAt(0) || "U").toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{staff.name}</p>
                              <p className="text-xs text-gray-500">
                                {staff.address ? staff.address.slice(0, 30) : ""}
                                {staff.address && staff.address.length > 30 ? "..." : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700">{staff.email}</p>
                          <p className="text-sm text-gray-500">{staff.phone}</p>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-[#1e266d]/10 text-[#1e266d] capitalize">
                            {staff.role}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 capitalize">
                            {staff.department || "-"}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleStatus(staff)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                staff.isActive ? "bg-green-500" : "bg-gray-300"
                              }`}
                              title="Toggle status"
                            >
                              <span
                                className={`inline-block h-4 w-4 rounded-full bg-white transform transition-transform ${
                                  staff.isActive ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>

                            <span
                              className={`text-sm font-medium ${
                                staff.isActive ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              {staff.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedStaff(staff)}
                              className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                              title="Edit"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(staff)}
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
              {paginatedStaff.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-gray-500 font-medium">No staff found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try changing search or add a new staff member
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paginatedStaff.map((staff) => (
                    <div key={staff._id} className="p-4 space-y-3">
                      {/* Top */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                            {(staff.name?.charAt(0) || "U").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{staff.name}</p>
                            <p className="text-sm text-gray-500 truncate">{staff.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setSelectedStaff(staff)}
                            className="p-2 text-gray-500 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg"
                            title="Edit"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(staff)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info rows */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Phone</p>
                          <p className="text-gray-700">{staff.phone || "-"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Role</p>
                          <p className="text-gray-700 capitalize">{staff.role}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Department</p>
                          <p className="text-gray-700 capitalize">
                            {staff.department || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Status</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleStatus(staff)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                staff.isActive ? "bg-green-500" : "bg-gray-300"
                              }`}
                              title="Toggle status"
                            >
                              <span
                                className={`inline-block h-4 w-4 rounded-full bg-white transform transition-transform ${
                                  staff.isActive ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                            <span
                              className={`text-xs font-medium ${
                                staff.isActive ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              {staff.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {staff.address && (
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Address</p>
                          <p className="text-sm text-gray-700 break-words">{staff.address}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of{" "}
                  {filteredStaff.length}
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

      {/* Edit Modal */}
      {selectedStaff && (
        <EditStaffModal
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onUpdate={handleUpdateStaff}
        />
      )}
    </div>
  );
};

export default StaffList;