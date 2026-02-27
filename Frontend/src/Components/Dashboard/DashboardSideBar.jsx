import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";

import {
  FaChevronDown,
  FaTachometerAlt,
  FaUsers,
  FaUserPlus,
  FaBed,
  FaClipboardList,
  FaCalendarCheck,
  FaFileInvoiceDollar,
  FaBroom,
  FaTools,
  FaUserFriends,
  FaCog,
  FaChartBar,
  FaBell,
} from "react-icons/fa";

const THEME = "#d6c3b3";

const DashboardSidebar = ({ open, setOpen, collapsed, setCollapsed }) => {
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState({
    "User Management": false,
    "Room Management": false,
    Reservations: false,
    "Billing & Invoicing": false,
    Housekeeping: false,
    Maintenance: false,
    Guest: false,
    System: false,
  });

  const menu = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <FaTachometerAlt />,
      type: "single",
    },

    {
      title: "User Management",
      type: "dropdown",
      icon: <FaUsers />,
      subItems: [
        {
          title: "Staff List",
          path: "/dashboard/user-management/staff",
          icon: <FaUsers />,
        },
        {
          title: "Add Staff",
          path: "/dashboard/user-management/add-staff",
          icon: <FaUserPlus />,
        },
      ],
    },

    {
      title: "Room Management",
      type: "dropdown",
      icon: <FaBed />,
      subItems: [
        { title: "Room List", path: "/dashboard/room-management/rooms", icon: <FaClipboardList /> },
        { title: "Add Room", path: "/dashboard/room-management/add-room", icon: <FaClipboardList /> },
        { title: "Pricing Control", path: "/dashboard/room-management/pricing-control", icon: <FaClipboardList /> },
        { title: "Room Status Overview", path: "/dashboard/room-management/status-overview", icon: <FaClipboardList /> },
      ],
    },

    {
      title: "Reservations",
      type: "dropdown",
      icon: <FaCalendarCheck />,
      subItems: [
        { title: "View All Reservations", path: "/dashboard/reservations", icon: <FaClipboardList /> },
        { title: "Create Reservation", path: "/dashboard/reservations/create", icon: <FaClipboardList /> },
        { title: "Modify / Cancel Reservation", path: "/dashboard/reservations/modify", icon: <FaClipboardList /> },
        { title: "Check-In", path: "/dashboard/reservations/check-in", icon: <FaClipboardList /> },
        { title: "Check-Out", path: "/dashboard/reservations/check-out", icon: <FaClipboardList /> },
      ],
    },

    {
      title: "Billing & Invoicing",
      type: "dropdown",
      icon: <FaFileInvoiceDollar />,
      subItems: [
        { title: "Billing Overview", path: "/dashboard/billing", icon: <FaFileInvoiceDollar /> },
        { title: "Invoices", path: "/dashboard/billing/invoices", icon: <FaFileInvoiceDollar /> },
        { title: "Payments", path: "/dashboard/billing/payments", icon: <FaFileInvoiceDollar /> },
      ],
    },

    {
      title: "Housekeeping",
      type: "dropdown",
      icon: <FaBroom />,
      subItems: [
        { title: "Room Status", path: "", icon: <FaBroom /> },
        { title: "Assigned Tasks", path: "", icon: <FaBroom /> },
        { title: "Report Issue", path: "", icon: <FaBroom /> },
      ],
    },

    {
      title: "Maintenance",
      type: "dropdown",
      icon: <FaTools />,
      subItems: [
        { title: "Maintenance Requests", path: "", icon: <FaTools /> },
        { title: "Update Status", path: "", icon: <FaTools /> },
        { title: "History", path: "", icon: <FaTools /> },
      ],
    },

    {
      title: "Guest",
      type: "dropdown",
      icon: <FaUserFriends />,
      subItems: [
        { title: "My Reservations", path: "/dashboard/guest/my-reservations", icon: <FaUserFriends /> },
        { title: "Request Services", path: "/dashboard/guest/request-services", icon: <FaUserFriends /> },
        { title: "Feedback", path: "/dashboard/guest/feedback", icon: <FaUserFriends /> },
      ],
    },

    {
      title: "System",
      type: "dropdown",
      icon: <FaCog />,
      subItems: [
        { title: "Reports & Analytics", path: "", icon: <FaChartBar /> },
        { title: "Notifications", path: "", icon: <FaBell /> },
        { title: "Setting", path: "", icon: <FaCog /> },
      ],
    },
  ];

  // ✅ Mobile pe hi close karo
  const closeOnMobile = () => {
    if (window.innerWidth < 1024) setOpen(false);
  };

  const isActive = (path) => path && location.pathname === path;

  const isSubActive = (subItems = []) =>
    subItems.some((s) => s.path && location.pathname === s.path);

  const toggleMenu = (title) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <>
      {/* ✅ Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 h-screen bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${collapsed ? "w-[80px]" : "w-[300px]"}`}
      >
        {/* Toggle Button for Desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-6 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full p-1.5 shadow-sm z-50 transition-transform"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <FaChevronDown
            className={`text-xs transition-transform duration-300 ${collapsed ? "-rotate-90" : "rotate-90"
              }`}
          />
        </button>

        {/* Logo Section */}
        <div className="h-20 border-b border-gray-200 flex items-center justify-center px-4 bg-white shrink-0 overflow-hidden">
          <div className={`flex items-center gap-3 w-full transition-all duration-300 ${collapsed ? "justify-center" : "justify-start"}`}>
            <img
              src={logo}
              alt="LuxuryStay"
              className={`object-contain rounded-xl shadow-sm transition-all duration-300 ${collapsed ? "h-10 w-10 min-w-10" : "h-12 w-12 min-w-12"}`}
            />
            {/* Show only when not collapsed */}
            <div className={`whitespace-nowrap transition-opacity duration-300 ${collapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}>
              <p className="text-lg font-bold text-gray-800 leading-tight">
                LUXURYSTAY
              </p>
              <p className="text-xs text-gray-500">Hotel Management</p>
            </div>
          </div>
        </div>

        {/* Optional Subheading */}
        <div className={`px-5 pt-3 pb-2 flex transition-opacity duration-300 ${collapsed ? "opacity-0 hidden" : "opacity-100"}`}>
          <h3 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-500 whitespace-nowrap">
            Universal
          </h3>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-1 scrollbar-hide overflow-x-hidden">
          {menu.map((item) => {
            // ===== Single =====
            if (item.type === "single") {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={closeOnMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] transition-all"
                  style={{
                    backgroundColor: active ? `${THEME}66` : "transparent",
                    borderLeft: active ? `4px solid ${THEME}` : "4px solid transparent",
                    color: active ? "#111827" : "#374151",
                  }}
                >
                  <span className={`text-[16px] ${collapsed ? "mx-auto" : ""}`} title={collapsed ? item.title : ""}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="font-medium whitespace-nowrap">{item.title}</span>}
                </Link>
              );
            }

            // ===== Dropdown =====
            const parentActive = isSubActive(item.subItems);
            const expanded = openMenus[item.title] || parentActive;

            return (
              <div key={item.title}>
                <button
                  type="button"
                  onClick={() => toggleMenu(item.title)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] transition-all"
                  style={{
                    backgroundColor: parentActive ? `${THEME}55` : "transparent",
                    color: parentActive ? "#111827" : "#374151",
                  }}
                >
                  <span className={`text-[16px] flex-shrink-0 ${collapsed ? "mx-auto" : ""}`} title={collapsed ? item.title : ""}>
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.title}
                      </span>
                      <FaChevronDown
                        className={`text-[12px] flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""
                          }`}
                      />
                    </>
                  )}
                </button>

                {expanded && !collapsed && (
                  <div
                    className="ml-8 mt-1 mb-2 pl-3 border-l-2 space-y-1"
                    style={{ borderColor: THEME }}
                  >
                    {item.subItems.map((sub) => {
                      const active = isActive(sub.path);

                      return (
                        <Link
                          key={sub.title}
                          to={sub.path || "#"}
                          onClick={closeOnMobile}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] transition-all"
                          style={{
                            backgroundColor: active ? `${THEME}55` : "transparent",
                            color: active ? "#111827" : "#4b5563",
                            fontWeight: active ? 600 : 400,
                          }}
                        >
                          <span className="text-[12px] opacity-80">{sub.icon}</span>
                          <span>{sub.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;