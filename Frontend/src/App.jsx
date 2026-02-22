import React from "react";
import Login from "./Components/Login";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Register from "./Components/Register";
import Dashboard from "./Components/Dasboard";


function App() {
  return (
    <>
    <ToastContainer position="top-right" />
   <Routes>
        {/* default */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* dashboard */}
        <Route path="/dashboard" element={<Dashboard/>} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;