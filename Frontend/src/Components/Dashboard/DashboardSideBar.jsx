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

const DashboardSidebar = ({ open, setOpen }) => {
  const location = useLocation();

  const [openMenus, setOpenMenus] = useState({
    "User Management": true,
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
        { title: "View All Reservations", path: "", icon: <FaClipboardList /> },
        { title: "Create Reservation", path: "", icon: <FaClipboardList /> },
        { title: "Modify / Cancel Reservation", path: "", icon: <FaClipboardList /> },
        { title: "Check-In", path: "", icon: <FaClipboardList /> },
        { title: "Check-Out", path: "", icon: <FaClipboardList /> },
      ],
    },

    {
      title: "Billing & Invoicing",
      type: "dropdown",
      icon: <FaFileInvoiceDollar />,
      subItems: [
        { title: "Billing Overview", path: "", icon: <FaFileInvoiceDollar /> },
        { title: "Invoices", path: "", icon: <FaFileInvoiceDollar /> },
        { title: "Payments", path: "", icon: <FaFileInvoiceDollar /> },
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
        { title: "My Reservations", path: "", icon: <FaUserFriends /> },
        { title: "Request Services", path: "", icon: <FaUserFriends /> },
        { title: "Feedback", path: "", icon: <FaUserFriends /> },
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

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[300px] bg-white border-r border-gray-200 shadow-sm transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="h-20 border-b border-gray-200 flex items-center justify-center px-4 bg-white">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="LuxuryStay"
              className="h-12 w-12 object-contain rounded-xl shadow-sm"
            />
            <div>
              <p className="text-lg font-bold text-gray-800 leading-tight">
                LUXURYSTAY
              </p>
              <p className="text-xs text-gray-500">Hotel Management</p>
            </div>
          </div>
        </div>

        <div className="px-5 pt-3 pb-2">
          <h3 className="text-xs font-bold tracking-[0.12em] uppercase text-gray-500">
            Universal
          </h3>
        </div>

        {/* Menu */}
        <nav className="px-3 pb-4 overflow-y-auto max-h-[calc(100vh-120px)] space-y-1">
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
                  <span className="text-[16px]">{item.icon}</span>
                  <span className="font-medium">{item.title}</span>
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
                  <span className="text-[16px]">{item.icon}</span>
                  <span className="flex-1 text-left font-medium">{item.title}</span>

                  <FaChevronDown
                    className={`text-[12px] transition-transform duration-200 ${expanded ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {expanded && (
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