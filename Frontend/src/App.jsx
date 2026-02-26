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
import RoomTypes from "./Components/Dashboard/RoomManangement/RoomTypes";
import PricingControl from "./Components/Dashboard/RoomManangement/PricingControl";
import RoomStatusOverview from "./Components/Dashboard/RoomManangement/RoomStatus";

function App() {
  return (
    <>
      <ToastContainer position="top-right" />
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
          <Route path="room-management/room-types" element={<RoomTypes />} />
          <Route path="room-management/pricing-control" element={<PricingControl />} />
          <Route path="room-management/status-overview" element={<RoomStatusOverview />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;