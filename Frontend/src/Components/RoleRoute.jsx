import React from "react";
import { Navigate } from "react-router-dom";
const RoleRoute = ({ allowedRoles, children }) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const userRole = user?.role?.toLowerCase() || "";

  // Admin fallback logic: Admins can bypass explicit role arrays
  if (userRole === "admin") {
    return children;
  }

  if (!allowedRoles.includes(userRole)) {
    if (userRole === "guest") {
      return <Navigate to="/guest/my-reservations" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
export default RoleRoute;
