import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../api";

const AddStaff = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    role: "receptionist",
    password: "",
    confirmPassword: "",
  });

  // ✅ NEW: empty-field errors
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    // ✅ NEW: remove error as user types
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // ✅ NEW: required validation (empty inputs)
  const validateRequired = () => {
    const newErrors = {};

    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim();
    const phone = (formData.phone || "").trim();
    const department = (formData.department || "").trim();
    const address = (formData.address || "").trim();
    const password = (formData.password || "").trim();
    const confirmPassword = (formData.confirmPassword || "").trim();

    if (!name) newErrors.name = "Full Name is required";
    if (!email) newErrors.email = "Email is required";
    if (!phone) newErrors.phone = "Phone is required";
    if (!department) newErrors.department = "Department is required";
    if (!address) newErrors.address = "Address is required";
    if (!password) newErrors.password = "Password is required";
    if (!confirmPassword) newErrors.confirmPassword = "Confirm Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const nameRegex = /^[A-Za-z\s]{3,}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^[0-9]{10,15}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;

    if (!nameRegex.test(formData.name.trim())) {
      toast.error("Name must be 3+ letters");
      return false;
    }

    if (!emailRegex.test(formData.email.trim())) {
      toast.error("Email must be @gmail.com");
      return false;
    }

    if (!phoneRegex.test(formData.phone.trim())) {
      toast.error("Phone must be 10-15 digits");
      return false;
    }

    if (!formData.department.trim()) {
      toast.error("Department required");
      return false;
    }

    if (!formData.address.trim()) {
      toast.error("Address required");
      return false;
    }

    if (!passwordRegex.test(formData.password)) {
      toast.error("Password must have uppercase, number & special char");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ NEW: required first (empty check)
    if (!validateRequired()) return;

    // ✅ Existing validation stays same
    if (!validateForm()) return;

    setLoading(true);

    try {
      await api.post("/auth/createstaff", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        department: formData.department.trim(),
        role: formData.role,
        password: formData.password,
      });

      toast.success("Staff created successfully");
      navigate("/dashboard/user-management/staff");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 sm:p-7 lg:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1e266d]">
              Add New Staff
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              Create a new staff account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] focus:border-transparent outline-none ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email (@gmail.com)"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] focus:border-transparent outline-none ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] focus:border-transparent outline-none ${
                    errors.phone ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. Front Desk"
                  value={formData.department}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] focus:border-transparent outline-none ${
                    errors.department ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.department && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] focus:border-transparent outline-none bg-white"
                >
                  <option value="manager">Manager</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] focus:border-transparent outline-none resize-none ${
                    errors.address ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] focus:border-transparent outline-none ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#1e266d] focus:border-transparent outline-none ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/dashboard/user-management/staff")}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[170px] bg-[#1e1e1e] text-white py-3 px-6 rounded-xl font-bold hover:bg-black transition disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Staff"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStaff;