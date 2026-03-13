import React, { useMemo, useState, useEffect } from "react";
import StatCard from "../../Components/Dashboard/StatCard";
import ReservationChart from "../../Components/Dashboard/ReservationChart";
import BookingTable from "../../Components/Dashboard/BookingTable";
import axios from "axios";
import { toast } from "react-toastify";

const DashboardHome = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setDashboardData(res.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role && token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const role = user?.role || "guest";
  const isHQ = role === "housekeeping";
  const isMaint = role === "maintenance";

  return (
    <div className="space-y-6">

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e266d]"></div>
        </div>
      ) : dashboardData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title={isHQ ? "Rooms to Clean" : isMaint ? "Pending Requests" : "Today Booking"} 
              value={dashboardData.stats?.todayBooking ?? "--"} 
              trend={isHQ || isMaint ? null : "+11%"} 
              trendLabel={isHQ || isMaint ? null : "From previous"} 
              trendColor="bg-[#312e81]" 
            />
            <StatCard 
              title={isHQ ? "Assigned Tasks" : isMaint ? "In Progress" : "Total Amount"} 
              value={dashboardData.stats?.totalAmount ?? "--"} 
              trend={isHQ || isMaint ? null : "+05%"} 
              trendLabel={isHQ || isMaint ? null : "New income"} 
              trendColor="bg-[#06b6d4]" 
            />
            <StatCard 
              title={isHQ ? "Completed Tasks" : isMaint ? "Resolved Requests" : "Total Customer"} 
              value={dashboardData.stats?.totalCustomer ?? "--"} 
              trend={isHQ || isMaint ? null : "+11%"} 
              trendLabel={isHQ || isMaint ? null : "From previous"} 
              trendColor="bg-[#f59e0b]" 
            />
            <StatCard 
              title={isHQ ? "Total Tasks" : isMaint ? "Total Requests" : "Total Revenue"} 
              value={dashboardData.stats?.totalRevenue ?? "--"} 
              trend={isHQ || isMaint ? null : "+21%"} 
              trendLabel={isHQ || isMaint ? null : "From previous"} 
              trendColor="bg-[#10b981]" 
            />
          </div>
          
          {(!isHQ && !isMaint) && (
            <ReservationChart chartData={dashboardData.chartData} labels={dashboardData.labels} />
          )}

          <BookingTable data={dashboardData.tableData || []} role={role} />
        </>
      ) : (
        <div className="text-center text-gray-500 py-10">No data available for this role.</div>
      )}
    </div>
  );
};

export default DashboardHome;