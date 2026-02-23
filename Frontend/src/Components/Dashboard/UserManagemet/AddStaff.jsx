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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-start justify-center px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1e266d]">
            Add New Staff
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create a new staff account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
            />

            <input
              type="email"
              name="email"
              placeholder="Email (@gmail.com)"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
            />

            <input
              type="text"
              name="department"
              placeholder="Department"
              value={formData.department}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
            >
              <option value="manager">Manager</option>
              <option value="receptionist">Receptionist</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="maintenance">Maintenance</option>
              <option value="admin">Admin</option>
            </select>

            <textarea
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none md:col-span-2"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
            />

          </div>

          {/* Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e1e1e] text-white py-3 rounded-xl font-bold hover:bg-black transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Staff"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddStaff;