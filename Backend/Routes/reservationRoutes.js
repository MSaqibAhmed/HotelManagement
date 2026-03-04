import express from "express";
import {
  previewReservation,
  createReservation,
  getMyReservations,
  getAllReservations,
  getReservationById,
  updateReservation,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
} from "../Controllers/reservationController.js";

import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";

const reservationRoutes = express.Router();

reservationRoutes.get(
  "/preview",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  previewReservation
);

reservationRoutes.post(
  "/create",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  createReservation
);

reservationRoutes.get(
  "/my",
  protect,
  authorizeRoles("guest"),
  getMyReservations
);

reservationRoutes.get(
  "/",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  getAllReservations
);

reservationRoutes.get(
  "/:id",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  getReservationById
);

reservationRoutes.put(
  "/:id",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  updateReservation
);

reservationRoutes.patch(
  "/:id/cancel",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  cancelReservation
);

reservationRoutes.patch(
  "/:id/checkin",
  protect,
  authorizeRoles("admin", "receptionist"),
  checkInReservation
);

reservationRoutes.patch(
  "/:id/checkout",
  protect,
  authorizeRoles("admin", "receptionist"),
  checkOutReservation
);

export default reservationRoutes;