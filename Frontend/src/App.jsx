import React from "react";
import Login from "./Components/Login";
import Register from "./Components/Register";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import InvoiceDetail from "./Components/Dashboard/Billing/InvoiceDetail";
import InvoicesList from "./Components/Dashboard/Billing/InvoicesList";
import Payments from "./Components/Dashboard/Billing/Payments";

import MyReservations from "./Components/Dashboard/Guest/MyReservations";
import RequestServices from "./Components/Dashboard/Guest/RequestServices";
import Feedback from "./Components/Dashboard/Guest/Feedback";

import Cleaning from "./Components/Dashboard/HouseKeeping/Cleaning";
import Assign from "./Components/Dashboard/HouseKeeping/Assign";
import CleaningReport from "./Components/Dashboard/HouseKeeping/CleaningReport";
import HousekeepingChecklist from "./Components/Dashboard/HouseKeeping/HousekeepingChecklist";
import RoomQRList from "./Components/Dashboard/HouseKeeping/RoomQRList";

import MaintenanceRequests from "./Components/Dashboard/Maintenance/MaintenanceRequests";
import UpdateStatus from "./Components/Dashboard/Maintenance/UpdateStatus";
import History from "./Components/Dashboard/Maintenance/History";

import ReportsAnalytics from "./Components/Dashboard/System/ReportsAnalytics";
import Notifications from "./Components/Dashboard/System/Notifications";
import Settings from "./Components/Dashboard/System/Settings";

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
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="user-management/add-staff" element={<AddStaff />} />
          <Route path="user-management/staff" element={<StaffList />} />
          <Route path="room-management/rooms" element={<RoomList />} />
          <Route path="room-management/add-room" element={<AddRoom />} />
          <Route path="room-management/edit-room/:id" element={<EditRoom />} />
          <Route path="room-management/pricing-control" element={<PricingControl />} />
          <Route path="room-management/status-overview" element={<RoomStatusOverview />} />

          <Route path="reservations" element={<ReservationsList />} />
          <Route path="reservations/create" element={<CreateReservation />} />
          <Route path="reservations/modify" element={<ModifyReservation />} />
          <Route path="reservations/check-in" element={<CheckIn />} />
          <Route path="reservations/check-out" element={<CheckOut />} />

          <Route path="billing" element={<BillingOverview />} />
          <Route path="billing/invoices" element={<InvoicesList />} />
          <Route path="/dashboard/billing/invoices/:id" element={<InvoiceDetail />} />
          <Route path="billing/payments" element={<Payments />} />

          <Route path="guest/my-reservations" element={<MyReservations />} />
          <Route path="guest/request-services" element={<RequestServices />} />
          <Route path="guest/feedback" element={<Feedback />} />

          {/* Housekeeping Routes */}
          <Route path="housekeeping/room-status" element={<Cleaning />} />
          <Route path="housekeeping/assigned-tasks" element={<Assign />} />
          <Route path="housekeeping/cleaning-report" element={<CleaningReport />} />
          <Route path="housekeeping/checklist" element={<HousekeepingChecklist />} />
          <Route path="housekeeping/room-qr-list" element={<RoomQRList />} />

          {/* Maintenance Routes */}
          <Route path="maintenance/requests" element={<MaintenanceRequests />} />
          <Route path="maintenance/update-status" element={<UpdateStatus />} />
          <Route path="maintenance/history" element={<History />} />

          {/* System Routes */}
          <Route path="system/reports-analytics" element={<ReportsAnalytics />} />
          <Route path="system/notifications" element={<Notifications />} />
          <Route path="system/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;