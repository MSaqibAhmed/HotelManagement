import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const THEME = "#d6c3b3";

const DashboardNavbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [showDropdown, setShowDropdown] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    navigate("/login");
  };

  const goProfile = () => {
    setShowDropdown(false);
    navigate("/dashboard/profile");
  };

  const initial = (user?.name?.charAt(0) || "U").toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg transition"
          style={{ backgroundColor: "transparent" }}
          aria-label="Toggle Sidebar"
        >
          <div className="p-1 rounded-lg" style={{ backgroundColor: `${THEME}33` }}>
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </div>
        </button>

        <h1 className="text-base sm:text-lg font-bold text-gray-800">
          Dashboard{" "}
          <span className="hidden sm:inline text-sm font-semibold" style={{ color: THEME }}>
            • LuxuryStay
          </span>
        </h1>
      </div>

      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setShowDropdown((p) => !p)}
          className="flex items-center gap-2 p-1.5 rounded-lg transition"
          style={{ backgroundColor: showDropdown ? `${THEME}22` : "transparent" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: THEME }}
          >
            {initial}
          </div>

          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-800 leading-4">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || ""}</p>
          </div>

          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${
              showDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500 break-all">{user?.email || ""}</p>
            </div>

            <button
              onClick={goProfile}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${THEME}22`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold"
              style={{ color: "#9b5b4a" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${THEME}22`)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardNavbar;