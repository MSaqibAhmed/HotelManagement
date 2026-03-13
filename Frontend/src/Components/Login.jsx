import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import hotel from "../assets/hotel.jpg";
import api from "../api";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ NEW: field errors for empty inputs
  const [errors, setErrors] = useState({});

  const [touched, setTouched] = useState({});

  // Complex email regex that specifically checks for starting dot, consecutive dots, etc
  const emailRegex = /^(?!\.)(?!.*\.\.)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const validateField = (name, value) => {
    let error = "";
    if (!value || value.trim() === "") {
      error = `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    } else {
      switch (name) {
        case "email":
          if (value.startsWith(".")) {
             error = "Email cannot start with a dot (.)";
          } else if (!emailRegex.test(value)) {
             error = "Please enter a valid email address (e.g., mail@domain.com)";
          }
          break;
        case "password":
          if (!passwordRegex.test(value)) error = "Password must be 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char";
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
       const error = validateField(name, value);
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
    const fields = ["email", "password"];
    
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
    const baseStyle = "w-full px-4 py-3.5 border rounded-xl focus:ring-4 outline-none transition-all";
    if (!touched[fieldName] && !formData[fieldName]) {
        return `${baseStyle} bg-gray-50/50 border-gray-200 focus:ring-blue-50 focus:border-blue-500`;
    }
    if (errors[fieldName]) {
        return `${baseStyle} bg-red-50 border-red-500 focus:ring-red-100 focus:border-red-500 text-red-900`;
    }
    return `${baseStyle} bg-green-50 border-green-500 focus:ring-green-100 focus:border-green-500 text-green-900`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateAll()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", formData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Login Successful");

      setTimeout(() => {
        const userRole = res.data.user?.role?.toLowerCase() || "";
        if (userRole === "guest") {
          navigate("/");
        } else {
          navigate("/dashboard");
        }
      }, 900);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white font-sans">
      {/* LEFT SIDE */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={hotel}
          alt="Modern House"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-10 left-10 flex items-center gap-2 text-white z-20">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
            <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
          </div>
          <span className="text-xl font-semibold tracking-wide"></span>
        </div>

        <div className="absolute bottom-20 left-10 text-white z-20">
          <h1 className="text-6xl font-extrabold leading-tight">
            Find Your LuxuryStay
          </h1>
          <p className="mt-4 text-white/90 text-lg italic">...just a few clicks</p>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10"></div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center relative px-6 sm:px-12 md:px-20">
        <div className="absolute top-10 right-10">
          <Link to="/login">
            <button className="bg-black text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-md">
              Sign in
            </button>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h2 className="text-4xl font-bold text-[#1e266d] mb-2">
            Welcome Back to LuxuryStay
          </h2>
          <p className="text-gray-400 mb-10 text-sm">Sign in your account</p>

          <form noValidate onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Your Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="info@gmail.com"
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
              <label className="block text-sm font-bold text-gray-700 mb-2">
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-black rounded" />
                <span>Remember Me</span>
              </label>
              <Link to="/forgot-password" className="text-gray-400 font-bold">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1e1e1e] text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-50">
              Don't have an account?
              <Link
                to="/register"
                className="text-blue-600 font-extrabold hover:underline ml-1"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;