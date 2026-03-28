import React, { Suspense } from "react";
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
const DashboardHome = React.lazy(() => import("./Pages/AdminDasboard/DashboardHome"));
const AddStaff = React.lazy(() => import("./Components/Dashboard/UserManagemet/AddStaff"));
const StaffList = React.lazy(() => import("./Components/Dashboard/UserManagemet/StaffList"));
const RoomList = React.lazy(() => import("./Components/Dashboard/RoomManangement/RoomList"));
const AddRoom = React.lazy(() => import("./Components/Dashboard/RoomManangement/AddRoom"));
const EditRoom = React.lazy(() => import("./Components/Dashboard/RoomManangement/EditRoom"));
const PricingControl = React.lazy(() => import("./Components/Dashboard/RoomManangement/PricingControl"));
const RoomStatusOverview = React.lazy(() => import("./Components/Dashboard/RoomManangement/RoomStatus"));
const ReservationsList = React.lazy(() => import("./Components/Dashboard/Reservations/ReservationsList"));
const CreateReservation = React.lazy(() => import("./Components/Dashboard/Reservations/CreateReservation"));
const ModifyReservation = React.lazy(() => import("./Components/Dashboard/Reservations/ModifyReservation"));
const CheckIn = React.lazy(() => import("./Components/Dashboard/Reservations/CheckIn"));
const CheckOut = React.lazy(() => import("./Components/Dashboard/Reservations/CheckOut"));
const BillingOverview = React.lazy(() => import("./Components/Dashboard/Billing/BillingOverview"));
const InvoicesList = React.lazy(() => import("./Components/Dashboard/Billing/InvoicesList"));
const Payments = React.lazy(() => import("./Components/Dashboard/Billing/Payments"));
const GuestMyReservationsPage = React.lazy(() => import("./Pages/PublicWebsite/GuestMyReservationsPage"));
const GuestCreateReservationPage = React.lazy(() => import("./Pages/PublicWebsite/GuestCreateReservationPage"));
const GuestRequestServicesPage = React.lazy(() => import("./Pages/PublicWebsite/GuestRequestServicesPage"));
const GuestFeedbackPage = React.lazy(() => import("./Pages/PublicWebsite/GuestFeedbackPage"));
const Cleaning = React.lazy(() => import("./Components/Dashboard/HouseKeeping/Cleaning"));
const Assign = React.lazy(() => import("./Components/Dashboard/HouseKeeping/Assign"));
const CleaningReport = React.lazy(() => import("./Components/Dashboard/HouseKeeping/CleaningReport"));
const HousekeepingChecklist = React.lazy(() => import("./Components/Dashboard/HouseKeeping/HousekeepingChecklist"));
const MaintenanceRequests = React.lazy(() => import("./Components/Dashboard/Maintenance/MaintenanceRequests"));
const UpdateStatus = React.lazy(() => import("./Components/Dashboard/Maintenance/UpdateStatus"));
const History = React.lazy(() => import("./Components/Dashboard/Maintenance/History"));
const ReportsAnalytics = React.lazy(() => import("./Components/Dashboard/System/ReportsAnalytics"));
const Notifications = React.lazy(() => import("./Components/Dashboard/System/Notifications"));
const Settings = React.lazy(() => import("./Components/Dashboard/System/Settings"));

// Public Website
import Navbar from "./Components/PublicWebsite/Navbar";
import Footer from "./Components/PublicWebsite/Footer";
const HomePage = React.lazy(() => import("./Pages/PublicWebsite/HomePage"));
const RoomsPage = React.lazy(() => import("./Pages/PublicWebsite/RoomsPage"));
const RoomDetailPage = React.lazy(() => import("./Pages/PublicWebsite/RoomDetailPage"));
const ServicesPage = React.lazy(() => import("./Pages/PublicWebsite/ServicesPage"));
const AboutPage = React.lazy(() => import("./Pages/PublicWebsite/AboutPage"));
const ContactPage = React.lazy(() => import("./Pages/PublicWebsite/ContactPage"));

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

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#111111]">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
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
      <Suspense fallback={<Loader />}>
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
      </Suspense>
    </>
  );
}

export default App;