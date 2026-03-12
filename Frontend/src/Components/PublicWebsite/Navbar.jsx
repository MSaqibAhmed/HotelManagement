import React, { useState, useEffect, useMemo, useRef } from "react";
import Logo from "../../assets/logo.png";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { dark, setDark } = useTheme();

  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Auth Check
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }

    // Outside click logic
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login");
  };

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Rooms", path: "/rooms" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const linkClass = ({ isActive }) =>
    `relative text-sm font-medium tracking-wide transition-colors duration-200 group ${isActive
      ? "text-[#cbb19d]"
      : dark
        ? "text-gray-300 hover:text-[#cbb19d]"
        : "text-gray-700 hover:text-[#9a836c]"
    }`;

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled
          ? dark
            ? "bg-[#111111]/95 backdrop-blur-md shadow-lg shadow-black/20"
            : "bg-white/95 backdrop-blur-md shadow-md"
          : dark
            ? "bg-[#111111]"
            : "bg-white"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src={Logo} alt="LuxuryStay" className="h-11 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={linkClass} end={link.path === "/"}>
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#cbb19d] transition-all duration-300 group-hover:w-full" />
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${dark
                ? "bg-[#2a2a2a] text-[#cbb19d] hover:bg-[#333]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated && user ? (
            <div ref={dropdownRef} className="relative ml-2">
              <button
                onClick={() => setShowDropdown((p) => !p)}
                className={`flex items-center gap-2 p-1.5 rounded-lg transition border ${showDropdown
                    ? dark ? "border-[#cbb19d] bg-[#1a1a1a]" : "border-[#cbb19d] bg-gray-50"
                    : dark ? "border-transparent hover:border-gray-700 hover:bg-[#1a1a1a]" : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold bg-[#cbb19d]">
                  {initial}
                </div>
                <div className="hidden md:block text-left mr-1">
                  <p className={`text-sm font-semibold leading-4 ${dark ? "text-gray-200" : "text-gray-800"}`}>
                    {user.name || "User"}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180 text-[#cbb19d]" : dark ? "text-gray-400" : "text-gray-500"}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden z-50 ${dark ? "bg-[#1f1f1f] border-gray-800 shadow-black/40" : "bg-white border-gray-100 shadow-xl"
                  }`}>
                  <div className={`px-4 py-3 border-b ${dark ? "border-gray-800" : "border-gray-100"}`}>
                    <p className={`text-sm font-semibold truncate ${dark ? "text-white" : "text-gray-800"}`}>{user.name}</p>
                    <p className={`text-xs truncate ${dark ? "text-gray-400" : "text-gray-500"}`}>{user.email}</p>
                  </div>

                  <div className="py-1">
                    {String(user.role).toLowerCase() === "guest" ? (
                      <>
                        <Link to="/guest/my-reservations" onClick={() => setShowDropdown(false)} className={`block px-4 py-2 text-sm font-medium transition-colors ${dark ? "text-gray-300 hover:text-[#cbb19d] hover:bg-[#111111]" : "text-gray-700 hover:text-[#cbb19d] hover:bg-gray-50"}`}>
                          My Reservations
                        </Link>
                        <Link to="/guest/request-services" onClick={() => setShowDropdown(false)} className={`block px-4 py-2 text-sm font-medium transition-colors ${dark ? "text-gray-300 hover:text-[#cbb19d] hover:bg-[#111111]" : "text-gray-700 hover:text-[#cbb19d] hover:bg-gray-50"}`}>
                          Request Service / Tech
                        </Link>
                        <Link to="/guest/feedback" onClick={() => setShowDropdown(false)} className={`block px-4 py-2 text-sm font-medium transition-colors ${dark ? "text-gray-300 hover:text-[#cbb19d] hover:bg-[#111111]" : "text-gray-700 hover:text-[#cbb19d] hover:bg-gray-50"}`}>
                          Feedback
                        </Link>
                      </>
                    ) : (
                      <Link to="/dashboard" onClick={() => setShowDropdown(false)} className={`block px-4 py-2 text-sm font-medium transition-colors ${dark ? "text-gray-300 hover:text-[#cbb19d] hover:bg-[#111111]" : "text-gray-700 hover:text-[#cbb19d] hover:bg-gray-50"}`}>
                        Admin Dashboard
                      </Link>
                    )}
                  </div>

                  <div className={`border-t py-1 ${dark ? "border-gray-800" : "border-gray-100"}`}>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink
                to="/login"
                className={`text-sm font-medium px-4 py-2 rounded-full border transition-all duration-200 ${dark
                    ? "border-gray-600 text-gray-300 hover:border-[#cbb19d] hover:text-[#cbb19d]"
                    : "border-gray-300 text-gray-700 hover:border-[#cbb19d] hover:text-[#9a836c]"
                  }`}
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className="text-sm font-medium bg-[#cbb19d] text-white px-5 py-2 rounded-full hover:bg-[#b89f8a] transition-all duration-200 shadow-sm"
              >
                Register
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile buttons */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${dark ? "bg-[#2a2a2a] text-[#cbb19d]" : "bg-gray-100 text-gray-600"
              }`}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={dark ? "text-gray-300" : "text-gray-700"}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          className={`md:hidden px-6 py-6 space-y-3 border-t ${dark ? "bg-[#111111] border-gray-800" : "bg-white border-gray-100"
            }`}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `block py-2 text-sm font-medium transition-colors ${isActive
                  ? "text-[#cbb19d]"
                  : dark
                    ? "text-gray-300"
                    : "text-gray-700"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800">
            {isAuthenticated && user ? (
              <>
                <div className={`p-4 rounded-xl border ${dark ? "bg-[#1a1a1a] border-gray-800" : "bg-gray-50 border-gray-100"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center text-white font-bold bg-[#cbb19d]">
                      {initial}
                    </div>
                    <div className="overflow-hidden">
                      <p className={`text-sm font-semibold truncate ${dark ? "text-white" : "text-gray-900"}`}>{user.name}</p>
                      <p className={`text-xs truncate ${dark ? "text-gray-400" : "text-gray-500"}`}>{user.email}</p>
                    </div>
                  </div>
                  {String(user.role).toLowerCase() === "guest" ? (
                    <>
                      <NavLink to="/guest/my-reservations" onClick={() => setIsOpen(false)} className={`block w-full text-center py-2.5 rounded-lg border text-sm font-medium ${dark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"} mb-2`}>
                        My Reservations
                      </NavLink>
                      <NavLink to="/guest/request-services" onClick={() => setIsOpen(false)} className={`block w-full text-center py-2.5 rounded-lg border text-sm font-medium ${dark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"} mb-2`}>
                        Request Service / Tech
                      </NavLink>
                      <NavLink to="/guest/feedback" onClick={() => setIsOpen(false)} className={`block w-full text-center py-2.5 rounded-lg border text-sm font-medium ${dark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"} mb-2`}>
                        Feedback
                      </NavLink>
                    </>
                  ) : (
                    <NavLink to="/dashboard" onClick={() => setIsOpen(false)} className={`block w-full text-center py-2.5 rounded-lg border text-sm font-medium ${dark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"} mb-2`}>
                      Admin Dashboard
                    </NavLink>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-center py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium shadow-sm hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className={`text-center py-2.5 rounded-full border text-sm font-medium ${dark ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-700"
                    }`}
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-2.5 rounded-full bg-[#cbb19d] text-white text-sm font-medium"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
