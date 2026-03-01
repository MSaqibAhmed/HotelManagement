import React, { useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaEnvelope,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaTrash,
  FaSearch,
} from "react-icons/fa";
import { toast } from "react-toastify";

let dummyNotifications = [
  { id: "n1", title: "New Reservation", message: "Room 101 booked for 2 nights", type: "reservation", read: false, starred: false, time: "2 hours ago" },
  { id: "n2", title: "Maintenance Alert", message: "Leaky faucet reported in Room 205", type: "maintenance", read: true, starred: true, time: "5 hours ago" },
  { id: "n3", title: "Payment Received", message: "Invoice #INV-2041 paid", type: "payment", read: false, starred: false, time: "1 day ago" }
];
const Notifications = () => {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = () => {
    setLoading(true);
    setTimeout(() => {
      setNotifications([...dummyNotifications]);
      setLoading(false);
    }, 500);
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case "reservation":
        return { icon: FaEnvelope, bg: "bg-blue-100", text: "text-blue-600" };
      case "reminder":
        return { icon: FaClock, bg: "bg-yellow-100", text: "text-yellow-600" };
      case "payment":
        return { icon: FaCheckCircle, bg: "bg-green-100", text: "text-green-600" };
      case "maintenance":
        return { icon: FaExclamationTriangle, bg: "bg-orange-100", text: "text-orange-600" };
      case "housekeeping":
        return { icon: FaBell, bg: "bg-purple-100", text: "text-purple-600" };
      case "alert":
        return { icon: FaExclamationTriangle, bg: "bg-red-100", text: "text-red-600" };
      case "staff":
        return { icon: FaInfoCircle, bg: "bg-indigo-100", text: "text-indigo-600" };
      case "feedback":
        return { icon: FaStar, bg: "bg-pink-100", text: "text-pink-600" };
      default:
        return { icon: FaBell, bg: "bg-gray-100", text: "text-gray-600" };
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "unread" && !notif.read) ||
        (selectedFilter === "starred" && notif.starred) ||
        notif.type === selectedFilter;

      const matchesSearch =
        !searchTerm ||
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [notifications, selectedFilter, searchTerm]);

  const stats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
    starred: notifications.filter((n) => n.starred).length,
  };

  const markAsRead = (id) => {
    setTimeout(() => {
      dummyNotifications = dummyNotifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      setNotifications([...dummyNotifications]);
    }, 200);
  };

  const markAllAsRead = () => {
    setTimeout(() => {
      dummyNotifications = dummyNotifications.map((n) => ({ ...n, read: true }));
      setNotifications([...dummyNotifications]);
      toast.success("All notifications marked as read");
    }, 200);
  };

  const toggleStar = (id) => {
    setTimeout(() => {
      dummyNotifications = dummyNotifications.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n));
      setNotifications([...dummyNotifications]);
    }, 200);
  };

  const deleteNotification = (id) => {
    if (!window.confirm("Delete this notification?")) return;
    setTimeout(() => {
      dummyNotifications = dummyNotifications.filter((n) => n.id !== id);
      setNotifications([...dummyNotifications]);
      toast.success("Notification deleted");
    }, 200);
  };

  const deleteAllRead = () => {
    if (!window.confirm("Delete all read notifications?")) return;
    setTimeout(() => {
      dummyNotifications = dummyNotifications.filter((n) => !n.read);
      setNotifications([...dummyNotifications]);
      toast.success("Read notifications deleted");
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e266d]">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your hotel notifications and alerts
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={markAllAsRead}
            className="px-4 py-2.5 text-sm font-semibold text-[#1e266d] bg-[#1e266d]/10 rounded-xl hover:bg-[#1e266d]/20 transition"
          >
            Mark All Read
          </button>
          <button
            onClick={deleteAllRead}
            className="px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition"
          >
            Delete Read
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1e266d]/10 flex items-center justify-center">
              <FaBell className="w-6 h-6 text-[#1e266d]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <FaClock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Unread</p>
              <p className="text-2xl font-bold text-gray-800">{stats.unread}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <FaStar className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Starred</p>
              <p className="text-2xl font-bold text-gray-800">{stats.starred}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-gray-50 text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { value: "all", label: "All" },
              { value: "unread", label: "Unread" },
              { value: "starred", label: "Starred" },
              { value: "reservation", label: "Reservations" },
              { value: "payment", label: "Payments" },
              { value: "alert", label: "Alerts" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedFilter(filter.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${selectedFilter === filter.value
                  ? "bg-[#1e1e1e] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e266d]" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-20 px-4">
            <FaBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No notifications found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm
                ? "Try a different search term"
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notif) => {
              const typeConfig = getTypeConfig(notif.type);
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition ${!notif.read ? "bg-blue-50/50" : ""
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeConfig.bg} ${typeConfig.text}`}
                    >
                      <TypeIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`font-semibold ${!notif.read
                                ? "text-gray-900"
                                : "text-gray-700"
                                }`}
                            >
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notif.time}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleStar(notif.id)}
                            className={`p-2 rounded-lg transition ${notif.starred
                              ? "text-yellow-500 bg-yellow-100"
                              : "text-gray-400 hover:bg-gray-200"
                              }`}
                            title={notif.starred ? "Unstar" : "Star"}
                          >
                            <FaStar className="w-4 h-4" />
                          </button>

                          {!notif.read && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="p-2 text-gray-400 hover:text-[#1e266d] hover:bg-[#1e266d]/10 rounded-lg transition"
                              title="Mark as read"
                            >
                              <FaCheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
