import express from "express";
import {
  billingOverview,
  createOrUpdatePayment,
  confirmPayment,
  rejectPayment,
  listInvoices,
  getInvoiceById,
  sendInvoiceEmail,
} from "../Controllers/billingController.js";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";

const billingRoutes = express.Router();

billingRoutes.get(
  "/overview",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  billingOverview
);

billingRoutes.post(
  "/payment",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  createOrUpdatePayment
);

billingRoutes.get(
  "/invoices",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  listInvoices
);

billingRoutes.get(
  "/invoices/:id",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  getInvoiceById
);

billingRoutes.post(
  "/invoices/:id/confirm",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  confirmPayment
);

billingRoutes.post(
  "/invoices/:id/reject",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  rejectPayment
);

billingRoutes.post(
  "/invoices/:id/send-email",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  sendInvoiceEmail
);

export default billingRoutes;