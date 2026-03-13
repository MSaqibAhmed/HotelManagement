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

  const [touched, setTouched] = useState({});

  const nameRegex = /^[A-Za-z\s]{3,50}$/;
  // Complex email regex that specifically checks for starting dot, consecutive dots, etc
  const emailRegex = /^(?!\.)(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^\d{11}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const addressRegex = /^[A-Za-z0-9\s,.'-]{10,}$/;

  const validateField = (name, value, allData = formData) => {
    let error = "";
    if (!value || value.trim() === "") {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    } else {
      switch (name) {
        case "name":
          if (!nameRegex.test(value)) error = "Name must be 3-50 letters long.";
          break;
        case "email":
          if (value.startsWith(".")) {
             error = "Email cannot start with a dot (.)";
          } else if (!emailRegex.test(value)) {
             error = "Please enter a valid email address (e.g., mail@domain.com)";
          }
          break;
        case "phone":
          if (!phoneRegex.test(value)) error = "Phone number must be exactly 11 digits";
          break;
        case "address":
          if (!addressRegex.test(value)) error = "Address must be at least 10 characters long";
          break;
        case "password":
          if (!passwordRegex.test(value)) error = "Password must be 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char";
          break;
        case "confirmPassword":
          if (value !== allData.password) error = "Passwords do not match";
          break;
        default:
          break;
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    
    // Live validation
    if (touched[name] || value !== "") {
       const error = validateField(name, value, newData);
       setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateAll = () => {
    const newErrors = {};
    const fields = ["name", "email", "phone", "address", "password", "confirmPassword"];
    
    // Mark all as touched
    const newTouched = {};
    fields.forEach(f => newTouched[f] = true);
    setTouched(newTouched);

    fields.forEach(field => {
      const error = validateField(field, formData[field] || "");
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getInputStyle = (fieldName) => {
    const baseStyle = "w-full px-4 py-3 border rounded-xl focus:ring-4 outline-none transition-all";
    if (!touched[fieldName] && !formData[fieldName]) {
        return `${baseStyle} bg-gray-50/50 border-gray-200 focus:ring-blue-50 focus:border-blue-500`;
    }
    if (errors[fieldName]) {
        return `${baseStyle} bg-red-50 border-red-500 focus:ring-red-100 focus:border-red-500 text-red-900`;
    }
    return `${baseStyle} bg-green-50 border-green-500 focus:ring-green-100 focus:border-green-500 text-green-900`;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fix the errors in the form before submitting.");
      return;
    }

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
              Create Guest Account
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
                value={formData.name || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle("name")}
              />
              {errors.name && (
                <p className="text-red-500 text-xs font-semibold mt-2 transition-all">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter Email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputStyle("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs font-semibold mt-2 transition-all">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 234 567"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputStyle("phone")}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs font-semibold mt-2 transition-all">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Complete Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="Enter your complete address"
                value={formData.address || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                className={getInputStyle("address")}
              />
              {errors.address && (
                <p className="text-red-500 text-xs font-semibold mt-2 transition-all">
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter Password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputStyle("password")}
                />
                {errors.password && (
                  <p className="text-red-500 text-xs font-semibold mt-2 transition-all">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputStyle("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs font-semibold mt-2 transition-all">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
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