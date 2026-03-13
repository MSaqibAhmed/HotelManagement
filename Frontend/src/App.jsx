import React from "react";
import Login from "./Components/Login";
import Register from "./Components/Register";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./context/ThemeContext";
import PrivateRoute from "./Components/PrivateRoute";
import RoleRoute from "./Components/RoleRoute";
import { ROLES, routePermissions } from "./context/roleConfig";
// Admin Dashboard
import DashboardLayout from "./Components/Dashboard/DashboardLayout";
import DashboardHome from "./Pages/AdminDasboard/DashboardHome";
import AddStaff from "./Components/Dashboard/UserManagemet/AddStaff";
import StaffList from "./Components/Dashboard/UserManagemet/StaffList";
import RoomList from "./Components/Dashboard/RoomManangement/RoomList";
import AddRoom from "./Components/Dashboard/RoomManangement/AddRoom";
import EditRoom from "./Components/Dashboard/RoomManangement/EditRoom";
import PricingControl from "./Components/Dashboard/RoomManangement/PricingControl";
import RoomStatusOverview from "./Components/Dashboard/RoomManangement/RoomStatus";
import ReservationsList from "./Components/Dashboard/Reservations/ReservationsList";
import CreateReservation from "./Components/Dashboard/Reservations/CreateReservation";
import ModifyReservation from "./Components/Dashboard/Reservations/ModifyReservation";
import CheckIn from "./Components/Dashboard/Reservations/CheckIn";
import CheckOut from "./Components/Dashboard/Reservations/CheckOut";
import BillingOverview from "./Components/Dashboard/Billing/BillingOverview";
import InvoicesList from "./Components/Dashboard/Billing/InvoicesList";
import Payments from "./Components/Dashboard/Billing/Payments";
import GuestMyReservationsPage from "./Pages/PublicWebsite/GuestMyReservationsPage";
import GuestCreateReservationPage from "./Pages/PublicWebsite/GuestCreateReservationPage";
import GuestRequestServicesPage from "./Pages/PublicWebsite/GuestRequestServicesPage";
import GuestFeedbackPage from "./Pages/PublicWebsite/GuestFeedbackPage";
import Cleaning from "./Components/Dashboard/HouseKeeping/Cleaning";
import Assign from "./Components/Dashboard/HouseKeeping/Assign";
import CleaningReport from "./Components/Dashboard/HouseKeeping/CleaningReport";
import HousekeepingChecklist from "./Components/Dashboard/HouseKeeping/HousekeepingChecklist";
import MaintenanceRequests from "./Components/Dashboard/Maintenance/MaintenanceRequests";
import UpdateStatus from "./Components/Dashboard/Maintenance/UpdateStatus";
import History from "./Components/Dashboard/Maintenance/History";
import ReportsAnalytics from "./Components/Dashboard/System/ReportsAnalytics";
import Notifications from "./Components/Dashboard/System/Notifications";
import Settings from "./Components/Dashboard/System/Settings";

// Public Website
import Navbar from "./Components/PublicWebsite/Navbar";
import Footer from "./Components/PublicWebsite/Footer";
import HomePage from "./Pages/PublicWebsite/HomePage";
import RoomsPage from "./Pages/PublicWebsite/RoomsPage";
import RoomDetailPage from "./Pages/PublicWebsite/RoomDetailPage";
import ServicesPage from "./Pages/PublicWebsite/ServicesPage";
import AboutPage from "./Pages/PublicWebsite/AboutPage";
import ContactPage from "./Pages/PublicWebsite/ContactPage";

// Layout wrapper for public pages (with Navbar + Footer)
const PublicLayout = ({ children }) => (
  <ThemeProvider>
    <div className="dark:bg-[#111111] min-h-screen">
      <Navbar />
      {children}
      <Footer />
    </div>
  </ThemeProvider>
);

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        limit={1}
        newestOnTop={true}
        pauseOnHover={false}
        autoClose={3000}
      />
      <Routes>
        {/* ─── Auth Routes (no navbar/footer) ─── */}
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ─── Public Website Routes ─── */}
        <Route path="/home" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/rooms" element={<PublicLayout><RoomsPage /></PublicLayout>} />
        <Route path="/rooms/:id" element={<PublicLayout><RoomDetailPage /></PublicLayout>} />
        <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

        {/* ─── Guest Routes (in PublicLayout) ─── */}
        <Route path="/guest/my-reservations" element={<PrivateRoute><RoleRoute allowedRoles={[ROLES.GUEST]}><PublicLayout><GuestMyReservationsPage /></PublicLayout></RoleRoute></PrivateRoute>} />
        <Route path="/guest/create-reservation" element={<PrivateRoute><RoleRoute allowedRoles={[ROLES.GUEST]}><PublicLayout><GuestCreateReservationPage /></PublicLayout></RoleRoute></PrivateRoute>} />
        <Route path="/guest/request-services" element={<PrivateRoute><RoleRoute allowedRoles={[ROLES.GUEST]}><PublicLayout><GuestRequestServicesPage /></PublicLayout></RoleRoute></PrivateRoute>} />
        <Route path="/guest/feedback" element={<PrivateRoute><RoleRoute allowedRoles={[ROLES.GUEST]}><PublicLayout><GuestFeedbackPage /></PublicLayout></RoleRoute></PrivateRoute>} />

        {/* ─── Admin Dashboard Routes ─── */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING, ROLES.MAINTENANCE]}><DashboardHome /></RoleRoute>} />
          
          {/* User Management */}
          <Route path="user-management/add-staff" element={<RoleRoute allowedRoles={routePermissions["/dashboard/user-management/add-staff"]}><AddStaff /></RoleRoute>} />
          <Route path="user-management/staff" element={<RoleRoute allowedRoles={routePermissions["/dashboard/user-management/staff"]}><StaffList /></RoleRoute>} />
          
          {/* Room Management */}
          <Route path="room-management/rooms" element={<RoleRoute allowedRoles={routePermissions["/dashboard/room-management/rooms"]}><RoomList /></RoleRoute>} />
          <Route path="room-management/add-room" element={<RoleRoute allowedRoles={routePermissions["/dashboard/room-management/add-room"]}><AddRoom /></RoleRoute>} />
          <Route path="room-management/edit-room/:id" element={<RoleRoute allowedRoles={routePermissions["/dashboard/room-management/edit-room"]}><EditRoom /></RoleRoute>} />
          <Route path="room-management/pricing-control" element={<RoleRoute allowedRoles={routePermissions["/dashboard/room-management/pricing-control"]}><PricingControl /></RoleRoute>} />
          <Route path="room-management/status-overview" element={<RoleRoute allowedRoles={routePermissions["/dashboard/room-management/status-overview"]}><RoomStatusOverview /></RoleRoute>} />
          
          {/* Reservations */}
          <Route path="reservations" element={<RoleRoute allowedRoles={routePermissions["/dashboard/reservations"]}><ReservationsList /></RoleRoute>} />
          <Route path="reservations/create" element={<RoleRoute allowedRoles={routePermissions["/dashboard/reservations/create"]}><CreateReservation /></RoleRoute>} />
          <Route path="reservations/modify" element={<RoleRoute allowedRoles={routePermissions["/dashboard/reservations/modify"]}><ModifyReservation /></RoleRoute>} />
          <Route path="reservations/check-in" element={<RoleRoute allowedRoles={routePermissions["/dashboard/reservations/check-in"]}><CheckIn /></RoleRoute>} />
          <Route path="reservations/check-out" element={<RoleRoute allowedRoles={routePermissions["/dashboard/reservations/check-out"]}><CheckOut /></RoleRoute>} />
          
          {/* Billing */}
          <Route path="billing" element={<RoleRoute allowedRoles={routePermissions["/dashboard/billing"]}><BillingOverview /></RoleRoute>} />
          <Route path="billing/invoices" element={<RoleRoute allowedRoles={routePermissions["/dashboard/billing/invoices"]}><InvoicesList /></RoleRoute>} />
          <Route path="billing/payments" element={<RoleRoute allowedRoles={routePermissions["/dashboard/billing/payments"]}><Payments /></RoleRoute>} />
          
          {/* Housekeeping */}
          <Route path="housekeeping/room-status" element={<RoleRoute allowedRoles={routePermissions["/dashboard/housekeeping/room-status"]}><Cleaning /></RoleRoute>} />
          <Route path="housekeeping/assign" element={<RoleRoute allowedRoles={routePermissions["/dashboard/housekeeping/assign"]}><Assign /></RoleRoute>} />
          <Route path="housekeeping/assigned-tasks" element={<RoleRoute allowedRoles={routePermissions["/dashboard/housekeeping/assigned-tasks"]}><Assign /></RoleRoute>} />
          <Route path="housekeeping/cleaning-report" element={<RoleRoute allowedRoles={routePermissions["/dashboard/housekeeping/cleaning-report"]}><CleaningReport /></RoleRoute>} />
          <Route path="housekeeping/checklist" element={<RoleRoute allowedRoles={routePermissions["/dashboard/housekeeping/checklist"]}><HousekeepingChecklist /></RoleRoute>} />
          
          {/* Maintenance */}
          <Route path="maintenance/requests" element={<RoleRoute allowedRoles={routePermissions["/dashboard/maintenance/requests"]}><MaintenanceRequests /></RoleRoute>} />
          <Route path="maintenance/update-status" element={<RoleRoute allowedRoles={routePermissions["/dashboard/maintenance/update-status"]}><UpdateStatus /></RoleRoute>} />
          <Route path="maintenance/history" element={<RoleRoute allowedRoles={routePermissions["/dashboard/maintenance/history"]}><History /></RoleRoute>} />
          
          {/* System */}
          <Route path="system/reports-analytics" element={<RoleRoute allowedRoles={routePermissions["/dashboard/system/reports-analytics"]}><ReportsAnalytics /></RoleRoute>} />
          <Route path="system/notifications" element={<RoleRoute allowedRoles={routePermissions["/dashboard/system/notifications"]}><Notifications /></RoleRoute>} />
          <Route path="system/settings" element={<RoleRoute allowedRoles={routePermissions["/dashboard/system/settings"]}><Settings /></RoleRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;