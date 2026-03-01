import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaLock,
  FaBell,
  FaGlobe,
  FaSave,
  FaCamera,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    reservationAlerts: true,
    paymentAlerts: true,
    maintenanceAlerts: true,
    dailyReports: true,
  });

  const [hotelSettings, setHotelSettings] = useState({
    hotelName: "",
    checkInTime: "",
    checkOutTime: "",
    currency: "USD",
    timezone: "UTC-5",
    language: "English",
  });

  useEffect(() => {
    fetchUserProfile();
    fetchNotificationSettings();
    fetchHotelSettings();
  }, []);

  const fetchUserProfile = () => {
    setTimeout(() => {
      const user = { name: "Admin User", email: "admin@luxurystay.com", phone: "+1 234 567 8900", address: "123 Hotel Way", department: "Management" };
      setUserData(user);
      setProfileData({ ...user });
    }, 500);
  };

  const fetchNotificationSettings = () => {
    // Relying on defaults
  };

  const fetchHotelSettings = () => {
    setTimeout(() => {
      setHotelSettings({
        hotelName: "LuxuryStay Hotel",
        checkInTime: "14:00",
        checkOutTime: "11:00",
        currency: "USD",
        timezone: "UTC-5",
        language: "English",
      });
    }, 500);
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Profile updated successfully");
      setLoading(false);
    }, 500);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setLoading(false);
    }, 500);
  };

  const handleNotificationChange = (key) => {
    const newValue = !notificationSettings[key];
    setNotificationSettings((prev) => ({ ...prev, [key]: newValue }));
  };

  const handleHotelSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Hotel settings updated successfully");
      setLoading(false);
    }, 500);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "password", label: "Password", icon: FaLock },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "hotel", label: "Hotel Settings", icon: FaGlobe },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1e266d]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700">Settings Menu</h3>
            </div>
            <nav className="p-2 space-y-1">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${activeTab === tab.id
                        ? "bg-[#1e266d] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    <TabIcon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaUser className="w-6 h-6 text-[#1e266d]" />
                <h2 className="text-xl font-bold text-gray-800">Profile Settings</h2>
              </div>

              {/* Profile Picture */}
              <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-200">
                <div className="w-24 h-24 rounded-full bg-[#1e266d] flex items-center justify-center text-white text-3xl font-bold">
                  {profileData.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] text-white text-sm font-semibold rounded-lg hover:bg-black transition"
                  >
                    <FaCamera className="w-4 h-4" />
                    Change Photo
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, GIF or PNG. Max size 2MB.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={profileData.department}
                      onChange={(e) =>
                        setProfileData({ ...profileData, department: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address: e.target.value })
                      }
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none resize-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-60"
                  >
                    <FaSave className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaLock className="w-6 h-6 text-[#1e266d]" />
                <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-60"
                  >
                    <FaLock className="w-4 h-4" />
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaBell className="w-6 h-6 text-[#1e266d]" />
                <h2 className="text-xl font-bold text-gray-800">Notification Settings</h2>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 mb-3">Notification Channels</h3>

                {[
                  { key: "emailNotifications", label: "Email Notifications", desc: "Receive notifications via email" },
                  { key: "smsNotifications", label: "SMS Notifications", desc: "Receive notifications via text message" },
                  { key: "pushNotifications", label: "Push Notifications", desc: "Receive browser push notifications" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(item.key)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${notificationSettings[item.key] ? "bg-[#1e266d]" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${notificationSettings[item.key]
                            ? "left-8"
                            : "left-1"
                          }`}
                      />
                    </button>
                  </div>
                ))}

                <h3 className="font-semibold text-gray-700 mb-3 mt-6">Alert Types</h3>

                {[
                  { key: "reservationAlerts", label: "Reservation Alerts", desc: "New bookings and cancellations" },
                  { key: "paymentAlerts", label: "Payment Alerts", desc: "Payment confirmations and failures" },
                  { key: "maintenanceAlerts", label: "Maintenance Alerts", desc: "Maintenance requests and updates" },
                  { key: "dailyReports", label: "Daily Reports", desc: "Daily summary reports" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(item.key)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${notificationSettings[item.key] ? "bg-[#1e266d]" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${notificationSettings[item.key]
                            ? "left-8"
                            : "left-1"
                          }`}
                      />
                    </button>
                  </div>
                ))}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        toast.success("Notification settings saved");
                      }, 500);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition"
                  >
                    <FaSave className="w-4 h-4" />
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hotel Settings Tab */}
          {activeTab === "hotel" && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaGlobe className="w-6 h-6 text-[#1e266d]" />
                <h2 className="text-xl font-bold text-gray-800">Hotel Settings</h2>
              </div>

              <form onSubmit={handleHotelSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hotel Name
                    </label>
                    <input
                      type="text"
                      value={hotelSettings.hotelName}
                      onChange={(e) =>
                        setHotelSettings({ ...hotelSettings, hotelName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Check-in Time
                    </label>
                    <input
                      type="time"
                      value={hotelSettings.checkInTime}
                      onChange={(e) =>
                        setHotelSettings({ ...hotelSettings, checkInTime: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Check-out Time
                    </label>
                    <input
                      type="time"
                      value={hotelSettings.checkOutTime}
                      onChange={(e) =>
                        setHotelSettings({ ...hotelSettings, checkOutTime: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={hotelSettings.currency}
                      onChange={(e) =>
                        setHotelSettings({ ...hotelSettings, currency: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={hotelSettings.timezone}
                      onChange={(e) =>
                        setHotelSettings({ ...hotelSettings, timezone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                    >
                      <option value="UTC-5">UTC-5 (Eastern Time)</option>
                      <option value="UTC-6">UTC-6 (Central Time)</option>
                      <option value="UTC-7">UTC-7 (Mountain Time)</option>
                      <option value="UTC-8">UTC-8 (Pacific Time)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={hotelSettings.language}
                      onChange={(e) =>
                        setHotelSettings({ ...hotelSettings, language: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1e266d] outline-none bg-white"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e1e1e] text-white font-bold rounded-xl hover:bg-black transition disabled:opacity-60"
                  >
                    <FaSave className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
