import React, { useEffect, useState } from "react";
import {
  FaChartBar,
  FaUsers,
  FaBed,
  FaCalendarCheck,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ReportsAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("This Month");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalGuests: 0,
    occupiedRooms: 0,
    totalReservations: 0,
    totalRevenue: 0,
  });

  const [occupancyData, setOccupancyData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [roomTypeStats, setRoomTypeStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
    fetchOccupancyData();
    fetchRevenueData();
    fetchRoomTypeStats();
    fetchRecentActivities();
  }, [selectedPeriod]);

  const fetchDashboardStats = () => {
    setLoading(true);
    setTimeout(() => {
      setStats({
        totalGuests: 1250,
        occupiedRooms: 85,
        totalReservations: 320,
        totalRevenue: 45000,
      });
      setLoading(false);
    }, 500);
  };

  const fetchOccupancyData = () => {
    setTimeout(() => {
      setOccupancyData([
        { month: "Jan", occupancy: 65 },
        { month: "Feb", occupancy: 70 },
        { month: "Mar", occupancy: 80 },
        { month: "Apr", occupancy: 85 },
        { month: "May", occupancy: 90 },
        { month: "Jun", occupancy: 95 },
      ]);
    }, 500);
  };

  const fetchRevenueData = () => {
    setTimeout(() => {
      setRevenueData([
        { month: "Jan", revenue: 30000 },
        { month: "Feb", revenue: 35000 },
        { month: "Mar", revenue: 40000 },
        { month: "Apr", revenue: 45000 },
        { month: "May", revenue: 50000 },
        { month: "Jun", revenue: 60000 },
      ]);
    }, 500);
  };

  const fetchRoomTypeStats = () => {
    setTimeout(() => {
      setRoomTypeStats([
        { type: "Single", booked: 20, total: 30, available: 10 },
        { type: "Double", booked: 40, total: 50, available: 10 },
        { type: "Suite", booked: 15, total: 20, available: 5 },
        { type: "Deluxe", booked: 10, total: 10, available: 0 },
      ]);
    }, 500);
  };

  const fetchRecentActivities = () => {
    setTimeout(() => {
      setRecentActivities([
        { id: "1", action: "New reservation created", user: "John Doe", time: "10 mins ago", type: "reservation" },
        { id: "2", action: "Payment of $500 received", user: "Jane Smith", time: "1 hour ago", type: "payment" },
        { id: "3", action: "Room 205 cleaned", user: "Maria Housekeeping", time: "2 hours ago", type: "room" },
        { id: "4", action: "Maintenance requested for AC", user: "Mike Technician", time: "3 hours ago", type: "maintenance" },
      ]);
    }, 500);
  };

  const handleExport = () => {
    toast.info("Export feature will be available soon");
  };

  const overviewStats = [
    { label: "Total Guests", value: stats.totalGuests, change: "+12%", positive: true, icon: FaUsers, color: "#1e266d" },
    { label: "Occupied Rooms", value: stats.occupiedRooms, change: "+5%", positive: true, icon: FaBed, color: "#10b981" },
    { label: "Total Reservations", value: stats.totalReservations, change: "+8%", positive: true, icon: FaCalendarCheck, color: "#3b82f6" },
    { label: "Total Revenue", value: `$${stats.totalRevenue?.toLocaleString() || "0"}`, change: "+15%", positive: true, icon: FaDollarSign, color: "#f59e0b" },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "reservation":
        return <FaCalendarCheck className="w-4 h-4" />;
      case "checkin":
        return <FaUsers className="w-4 h-4" />;
      case "payment":
        return <FaDollarSign className="w-4 h-4" />;
      case "room":
        return <FaBed className="w-4 h-4" />;
      default:
        return <FaChartBar className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "reservation":
        return "bg-blue-100 text-blue-600";
      case "checkin":
        return "bg-green-100 text-green-600";
      case "payment":
        return "bg-yellow-100 text-yellow-600";
      case "room":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">View hotel performance and statistics</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white text-sm font-medium"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition text-sm"
          >
            <FaDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-lg p-5 border border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.positive ? (
                    <FaArrowUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <FaArrowDown className="w-3 h-3 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-semibold ${stat.positive ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">vs last period</span>
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}22` }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Rate Chart */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Occupancy Rate</h3>
          </div>

          {occupancyData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No occupancy data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {occupancyData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-8">{item.month}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.occupancy}%`,
                        backgroundColor: "#1e266d",
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                    {item.occupancy}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">Revenue Trend</h3>
            <span className="text-sm text-gray-500">Last 6 Months</span>
          </div>

          {revenueData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No revenue data available</p>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between gap-2 h-48">
                {revenueData.map((item, idx) => {
                  const maxHeight = Math.max(...revenueData.map((d) => d.revenue));
                  const height = maxHeight > 0 ? (item.revenue / maxHeight) * 100 : 0;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative">
                        <div
                          className="w-full rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${height}%`,
                            minHeight: "20px",
                            background: "linear-gradient(to top, #1e266d, #3b82f6)",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">{item.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-lg font-bold text-[#1e266d]">
                    ${revenueData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Average</p>
                  <p className="text-lg font-bold text-green-600">
                    ${Math.round(revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.length).toLocaleString()}/mo
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Room Type Stats & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Type Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">Room Type Statistics</h3>

          {roomTypeStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No room type data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {roomTypeStats.map((room, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{room.type}</span>
                    <span className="text-xs text-gray-500">
                      {room.booked}/{room.total} booked
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${room.total > 0 ? (room.booked / room.total) * 100 : 0}%`,
                        backgroundColor: "#1e266d",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">{room.available} available</span>
                    <span className="text-gray-400">
                      {room.total > 0 ? Math.round((room.booked / room.total) * 100) : 0}% occupancy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>

          {recentActivities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button className="w-full mt-4 py-2.5 text-sm font-semibold text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg transition">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
