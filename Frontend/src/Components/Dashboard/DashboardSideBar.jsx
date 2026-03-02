import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  FaQrcode,
  FaListUl,
  FaPlus,
  FaEdit,
  FaSignInAlt,
  FaSignOutAlt,
  FaDollarSign,
  FaFileAlt,
  FaCreditCard,
  FaClipboardCheck,
  FaTasks,
  FaChartLine,
  FaExclamationTriangle,
  FaHistory,
  FaHome,
  FaConciergeBell,
  FaComment,
  FaCogs,
} from "react-icons/fa";

const THEME = "#d6c3b3";

const DashboardSidebar = ({ open, setOpen, collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Close all dropdowns when navigating to a different section
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Check if current path belongs to each menu section
    const menuSections = {
      "User Management": "/dashboard/user-management",
      "Room Management": "/dashboard/room-management",
      Reservations: "/dashboard/reservations",
      "Billing & Invoicing": "/dashboard/billing",
      Housekeeping: "/dashboard/housekeeping",
      Maintenance: "/dashboard/maintenance",
      Guest: "/dashboard/guest",
      System: "/dashboard/system",
    };

    // Find which section the current path belongs to
    const activeSection = Object.keys(menuSections).find(
      (section) => currentPath.startsWith(menuSections[section])
    );

    // Close all menus first, then open only the active section's menu
    setOpenMenus({
      "User Management": false,
      "Room Management": false,
      Reservations: false,
      "Billing & Invoicing": false,
      Housekeeping: false,
      Maintenance: false,
      Guest: false,
      System: false,
    });

    // Open the active section's menu (if any)
    if (activeSection) {
      setOpenMenus((prev) => ({ ...prev, [activeSection]: true }));
    }
  }, [location.pathname]);

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
      parentPath: "/dashboard/user-management/staff",
      subItems: [
        { title: "Staff List", path: "/dashboard/user-management/staff", icon: <FaListUl /> },
        { title: "Add Staff", path: "/dashboard/user-management/add-staff", icon: <FaUserPlus /> },
      ],
    },
    {
      title: "Room Management",
      type: "dropdown",
      icon: <FaBed />,
      parentPath: "/dashboard/room-management/rooms",
      subItems: [
        { title: "Room List", path: "/dashboard/room-management/rooms", icon: <FaListUl /> },
        { title: "Add Room", path: "/dashboard/room-management/add-room", icon: <FaPlus /> },
        { title: "Pricing Control", path: "/dashboard/room-management/pricing-control", icon: <FaDollarSign /> },
        { title: "Room Status", path: "/dashboard/room-management/status-overview", icon: <FaClipboardCheck /> },
      ],
    },
    {
      title: "Reservations",
      type: "dropdown",
      icon: <FaCalendarCheck />,
      parentPath: "/dashboard/reservations",
      subItems: [
        { title: "View All", path: "/dashboard/reservations", icon: <FaListUl /> },
        { title: "Create", path: "/dashboard/reservations/create", icon: <FaPlus /> },
        { title: "Modify/Cancel", path: "/dashboard/reservations/modify", icon: <FaEdit /> },
        { title: "Check-In", path: "/dashboard/reservations/check-in", icon: <FaSignInAlt /> },
        { title: "Check-Out", path: "/dashboard/reservations/check-out", icon: <FaSignOutAlt /> },
      ],
    },
    {
      title: "Billing & Invoicing",
      type: "dropdown",
      icon: <FaFileInvoiceDollar />,
      parentPath: "/dashboard/billing",
      subItems: [
        { title: "Overview", path: "/dashboard/billing", icon: <FaChartLine /> },
        { title: "Invoices", path: "/dashboard/billing/invoices", icon: <FaFileAlt /> },
        { title: "Payments", path: "/dashboard/billing/payments", icon: <FaCreditCard /> },
      ],
    },
    {
      title: "Housekeeping",
      type: "dropdown",
      icon: <FaBroom />,
      parentPath: "/dashboard/housekeeping/room-status",
      subItems: [
        { title: "Room Status", path: "/dashboard/housekeeping/room-status", icon: <FaClipboardCheck /> },
        { title: "Assigned Tasks", path: "/dashboard/housekeeping/assigned-tasks", icon: <FaTasks /> },
        { title: "Cleaning Report", path: "/dashboard/housekeeping/cleaning-report", icon: <FaChartBar /> },
        { title: "Checklist", path: "/dashboard/housekeeping/checklist", icon: <FaClipboardList /> },
        { title: "Room QR Codes", path: "/dashboard/housekeeping/room-qr-list", icon: <FaQrcode /> },
      ],
    },
    {
      title: "Maintenance",
      type: "dropdown",
      icon: <FaTools />,
      parentPath: "/dashboard/maintenance/requests",
      subItems: [
        { title: "Requests", path: "/dashboard/maintenance/requests", icon: <FaExclamationTriangle /> },
        { title: "Update Status", path: "/dashboard/maintenance/update-status", icon: <FaEdit /> },
        { title: "History", path: "/dashboard/maintenance/history", icon: <FaHistory /> },
      ],
    },
    {
      title: "Guest",
      type: "dropdown",
      icon: <FaUserFriends />,
      parentPath: "/dashboard/guest/my-reservations",
      subItems: [
        { title: "My Reservations", path: "/dashboard/guest/my-reservations", icon: <FaHome /> },
        { title: "Request Services", path: "/dashboard/guest/request-services", icon: <FaConciergeBell /> },
        { title: "Feedback", path: "/dashboard/guest/feedback", icon: <FaComment /> },
      ],
    },
    {
      title: "System",
      type: "dropdown",
      icon: <FaCog />,
      parentPath: "/dashboard/system/reports-analytics",
      subItems: [
        { title: "Reports", path: "/dashboard/system/reports-analytics", icon: <FaChartBar /> },
        { title: "Notifications", path: "/dashboard/system/notifications", icon: <FaBell /> },
        { title: "Settings", path: "/dashboard/system/settings", icon: <FaCogs /> },
      ],
    },
  ];

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) setOpen(false);
  };

  const isActive = (path) => path && location.pathname === path;

  const isSubActive = (subItems = []) =>
    subItems.some((s) => s.path && location.pathname === s.path);

  const toggleMenu = (title) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleDropdownClick = (item) => {
    if (collapsed && item.parentPath) {
      navigate(item.parentPath);
    } else {
      toggleMenu(item.title);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 h-screen bg-white border-r border-gray-200 shadow-xl flex flex-col transition-all duration-300 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${collapsed ? "w-[80px]" : "w-[300px]"}`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-6 bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-full p-1.5 shadow-sm z-50 transition-transform"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <FaChevronDown
            className={`text-xs transition-transform duration-300 ${collapsed ? "-rotate-90" : "rotate-90"}`}
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
            <div className={`whitespace-nowrap transition-opacity duration-300 ${collapsed ? "opacity-0 w-0 hidden" : "opacity-100"}`}>
              <p className="text-lg font-bold text-gray-800 leading-tight">LUXURYSTAY</p>
              <p className="text-xs text-gray-500">Hotel Management</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1 scrollbar-hide overflow-x-hidden">
          {menu.map((item) => {
            const parentActive = item.subItems ? isSubActive(item.subItems) : isActive(item.path);

            // Single Menu Item
            if (item.type === "single") {
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={closeOnMobile}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] transition-all group"
                  style={{
                    backgroundColor: parentActive ? `${THEME}66` : "transparent",
                    borderLeft: parentActive ? `4px solid ${THEME}` : "4px solid transparent",
                    color: parentActive ? "#111827" : "#374151",
                  }}
                  title={collapsed ? item.title : ""}
                >
                  <span className={`text-[18px] ${collapsed ? "mx-auto" : ""}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="font-medium whitespace-nowrap">{item.title}</span>}
                </Link>
              );
            }

            // Dropdown Menu Item
            const expanded = openMenus[item.title] || parentActive;

            return (
              <div key={item.title}>
                {/* Parent Button */}
                <button
                  type="button"
                  onClick={() => handleDropdownClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] transition-all group"
                  style={{
                    backgroundColor: parentActive ? `${THEME}55` : "transparent",
                    color: parentActive ? "#111827" : "#374151",
                  }}
                  title={collapsed ? item.title : ""}
                >
                  <span className={`text-[18px] flex-shrink-0 ${collapsed ? "mx-auto" : ""}`}>
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {item.title}
                      </span>
                      <FaChevronDown
                        className={`text-[11px] flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      />
                    </>
                  )}
                </button>

                {/* Sub-Items when Expanded */}
                {expanded && !collapsed && (
                  <div className="ml-6 mt-1 mb-2 pl-3 border-l-2 space-y-1" style={{ borderColor: `${THEME}66` }}>
                    {item.subItems.map((sub) => {
                      const subActive = isActive(sub.path);
                      return (
                        <Link
                          key={sub.title}
                          to={sub.path}
                          onClick={closeOnMobile}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] transition-all"
                          style={{
                            backgroundColor: subActive ? `${THEME}44` : "transparent",
                            color: subActive ? "#111827" : "#4b5563",
                            fontWeight: subActive ? 600 : 400,
                          }}
                        >
                          <span className="text-[13px] opacity-80">{sub.icon}</span>
                          <span>{sub.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Sub-Items Icons when Collapsed */}
                {expanded && collapsed && (
                  <div className="ml-2 mt-1 space-y-1">
                    {item.subItems.map((sub) => {
                      const subActive = isActive(sub.path);
                      return (
                        <Link
                          key={sub.title}
                          to={sub.path}
                          onClick={closeOnMobile}
                          className="flex items-center justify-center px-3 py-2.5 rounded-lg text-[14px] transition-all"
                          style={{
                            backgroundColor: subActive ? `${THEME}55` : "transparent",
                            color: subActive ? "#111827" : "#4b5563",
                          }}
                          title={sub.title}
                        >
                          <span className="text-[16px]">{sub.icon}</span>
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
