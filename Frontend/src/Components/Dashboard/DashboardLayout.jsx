import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSideBar";
import DashboardNavbar from "./DashboardNavbar";


const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <DashboardSidebar open={sidebarOpen} />

        <div className="flex-1 flex flex-col min-w-0">
          <DashboardNavbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />

          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;