import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const DashboardSidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState("User Management");

  const menuItems = useMemo(
    () => [
      { title: "Dashboard", path: "/dashboard" },
      {
        title: "User Management",
        subItems: [
          { title: "Staff List", path: "/dashboard/user-management/staff" },
          { title: "Add Staff", path: "/dashboard/user-management/add-staff" },
        ],
      },
    ],
    []
  );

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* 🔥 Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300
        ${open ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0 lg:w-20"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1e266d] rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
            </div>
            {open && (
              <span className="text-lg font-bold text-[#1e266d]">
                LuxuryStay
              </span>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            if (!item.subItems) {
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                  ${
                    isActive(item.path)
                      ? "bg-[#1e266d]/10 text-[#1e266d]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                  {open && <span className="font-semibold">{item.title}</span>}
                </Link>
              );
            }

            const isOpen = expandedMenu === item.title;

            return (
              <div key={item.title}>
                <button
                  onClick={() =>
                    setExpandedMenu(isOpen ? null : item.title)
                  }
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  ${
                    isOpen
                      ? "bg-[#1e266d]/10 text-[#1e266d]"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span>

                  {open && (
                    <>
                      <span className="flex-1 text-left font-semibold">
                        {item.title}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </button>

                {open && isOpen && (
                  <div className="ml-5 mt-2 space-y-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={() => setOpen(false)}
                        className={`block px-3 py-2 rounded-lg text-sm
                        ${
                          isActive(sub.path)
                            ? "bg-[#1e266d]/10 text-[#1e266d] font-semibold"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {sub.title}
                      </Link>
                    ))}
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