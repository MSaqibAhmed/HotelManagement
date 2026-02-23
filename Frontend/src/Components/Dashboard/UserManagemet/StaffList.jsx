import React, { useState, useMemo } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";

const StaffList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const staffList = [
    {
      _id: "1",
      name: "Ali Khan",
      email: "ali@gmail.com",
      phone: "03001234567",
      role: "manager",
    },
    {
      _id: "2",
      name: "Sara Ahmed",
      email: "sara@gmail.com",
      phone: "03111234567",
      role: "receptionist",
    },
    {
      _id: "3",
      name: "Usman Tariq",
      email: "usman@gmail.com",
      phone: "03221234567",
      role: "housekeeping",
    },
    {
      _id: "4",
      name: "Hassan Raza",
      email: "hassan@gmail.com",
      phone: "03331234567",
      role: "maintenance",
    },
  ];

  // 🔎 Search Filter
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) =>
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">
            Staff Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your hotel staff
          </p>
        </div>

        <Link
          to="/dashboard/user-management/add-staff"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition-all shadow-xl"
        >
          <FaPlus className="w-5 h-5" />
          Add New Staff
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50"
            />
          </div>

          <span className="text-sm text-gray-500 flex items-center">
            {filteredStaff.length} staff members
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Staff
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                  Role
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-16">
                    <p className="text-gray-500 font-medium">
                      No staff found
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1e266d] to-[#1e1e1e] rounded-full flex items-center justify-center text-white font-semibold">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {staff.name}
                          </p>
                          <p className="text-sm text-gray-500 md:hidden">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600">
                        {staff.email}
                      </p>
                      <p className="text-sm text-gray-500">
                        {staff.phone}
                      </p>
                    </td>

                    <td className="px-6 py-4 capitalize font-medium text-gray-700">
                      {staff.role}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default StaffList;