import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Side from "../assets/sideimage.jpg";
import api from "../api";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // NEW: empty-field errors
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value, }));

    // NEW: remove error as user types
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const nameRegex = /^[A-Za-z\s]{3,}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  const phoneRegex = /^[0-9]{10,15}$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

  // NEW: required validation (empty inputs)
  const validateRequired = () => {
    const newErrors = {};

    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim();
    const phone = (formData.phone || "").trim();
    const password = (formData.password || "").trim();
    const address = (formData.address || "").trim();

    if (!name) newErrors.name = "Full Name is required";
    if (!email) newErrors.email = "Email is required";
    if (!phone) newErrors.phone = "Phone is required";
    if (!password) newErrors.password = "Password is required";
    if (!address) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {


    const name = (formData.name || "").trim();
    const email = (formData.email || "").trim();
    const phone = (formData.phone || "").trim();
    const password = formData.password || "";
    const address = (formData.address || "").trim();

    if (!nameRegex.test(name)) {
      toast.error("Name must contain only letters");
      return false;
    }

    if (!emailRegex.test(email)) {
      toast.error("Email must be @gmail.com");
      return false;
    }

    if (!phoneRegex.test(phone)) {
      toast.error("Phone must be 10-15 digits");
      return false;
    }

    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must have 1 uppercase, 1 number, 1 special char & be 6+ long"
      );
      return false;
    }

    if (!address) {
      toast.error("Address required");
      return false;
    }

    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // ✅ NEW: required first (empty check)
    if (!validateRequired()) return;

    // ✅ Existing validation stays same
    if (!validateForm()) return;

    setLoading(true);

    try {
      await api.post("/auth/register", {
        ...formData,
        name: formData.name?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
        address: formData.address?.trim(),
      });

      toast.success("Registered successfully");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans selection:bg-blue-100">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src={Side}
          alt="Modern Architecture"
          className="absolute inset-0 w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-10 left-10 flex items-center gap-2 text-white z-20">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
            <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
          </div>
          <span className="text-xl font-semibold tracking-wide">Luxury Hospitality</span>
        </div>

        <div className="absolute bottom-20 left-10 text-white max-w-md z-20">
          <h1 className="text-6xl font-extrabold leading-tight drop-shadow-lg">
            Join Our <br /> Community
          </h1>
          <p className="mt-4 text-white/90 text-lg font-medium italic">
            Your dream home is waiting...
          </p>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-10"></div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center relative bg-white overflow-y-auto">
        <div className="absolute top-6 right-6 md:top-10 md:right-10 z-30">
          <Link to="/login">
            <button className="bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-md">
              Sign in
            </button>
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto px-6 sm:px-12 py-16 lg:py-8">
          <div className="text-left mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1e266d] mb-2 tracking-tight">
              Create Account
            </h2>
            <p className="text-gray-400 text-sm font-medium">
              Join us today to find your sweet home
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter Name"
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all bg-gray-50/50 ${
                  errors.name ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs font-semibold mt-2">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Your Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter Email"
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all bg-gray-50/50 ${
                  errors.email ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs font-semibold mt-2">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 234 567"
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all bg-gray-50/50 ${
                    errors.phone ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all bg-gray-50/50 ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs font-semibold mt-2">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                placeholder="Enter your full address"
                rows="2"
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all bg-gray-50/50 resize-none ${
                  errors.address ? "border-red-500" : "border-gray-200"
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-xs font-semibold mt-2">
                  {errors.address}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs md:text-sm text-gray-600">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-black rounded cursor-pointer"
                required
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-blue-600 font-bold">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-blue-600 font-bold">
                  privacy policy
                </Link>
                .
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e1e1e] text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-gray-200 mt-2 disabled:opacity-60"
            >
              {loading ? "Registering..." : "Register"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Already have an account?
              <Link
                to="/login"
                className="text-blue-600 font-extrabold hover:underline ml-1"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;