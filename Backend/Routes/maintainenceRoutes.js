import express from "express";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";

import {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getActiveMaintenanceRequests,
  getMaintenanceHistory,
  getMyAssignedTasks,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  assignMaintenanceStaff,
  updateMaintenanceStatus,
  deleteMaintenanceRequest,
} from "../Controllers/maintainenceController.js";

const maintainenceRoutes = express.Router();

maintainenceRoutes.post(
  "/create",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  createMaintenanceRequest
);

maintainenceRoutes.get("/my-requests", protect, getMyMaintenanceRequests);

maintainenceRoutes.get(
  "/active",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "maintenance"),
  getActiveMaintenanceRequests
);

maintainenceRoutes.get(
  "/history",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist", "maintenance"),
  getMaintenanceHistory
);

maintainenceRoutes.get(
  "/my-tasks",
  protect,
  authorizeRoles("maintenance"),
  getMyAssignedTasks
);

maintainenceRoutes.get("/:id", protect, getMaintenanceRequestById);

maintainenceRoutes.put("/:id", protect, updateMaintenanceRequest);

maintainenceRoutes.patch(
  "/:id/assign",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  assignMaintenanceStaff
);

maintainenceRoutes.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "maintenance"),
  updateMaintenanceStatus
);

maintainenceRoutes.delete("/:id", protect, deleteMaintenanceRequest);

export default maintainenceRoutes;