import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../api";

const EditStaffModal = ({ staff, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
    role: "",
  });

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || "",
        phone: staff.phone || "",
        department: staff.department || "",
        role: staff.role || "",
      });
    }
  }, [staff]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    const nameRegex = /^[A-Za-z\s]{3,}$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    if (!nameRegex.test(formData.name.trim())) {
      toast.error("Name must be at least 3 letters");
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

    if (!formData.role) {
      toast.error("Role required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await api.put(`/auth/staff/${staff._id}`, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        role: formData.role,
      });

      toast.success("Staff updated successfully");

      onUpdate(res.data.staff);
      onClose();

    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!staff) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">

        <h2 className="text-2xl font-bold text-[#1e266d] mb-6">
          Edit Staff
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
          />

          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
          />

          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Department"
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

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border rounded-xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#1e1e1e] text-white rounded-xl hover:bg-black disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;