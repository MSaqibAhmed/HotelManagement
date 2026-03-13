import express from "express";
import { getDashboardStats } from "../Controllers/dashboardController.js";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";

const dashboardRoutes = express.Router();

dashboardRoutes.get("/stats",protect,authorizeRoles("admin", "manager", "receptionist", "housekeeping", "maintenance"),getDashboardStats);

export default dashboardRoutes;
