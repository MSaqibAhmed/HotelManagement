import express from "express";
import {
  billingOverview,
  getPendingReservationsForBilling,
  createOrUpdatePayment,
  confirmPayment,
  rejectPayment,
  listInvoices,
  getInvoiceById,
  downloadInvoicePdf,
  sendInvoiceEmail,
  listPendingPayments,
} from "../Controllers/billingController.js";

import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
import { uploadReceipt } from "../config/billingCloudinary.js";

const billingRoutes = express.Router();

/**
 * Staff billing dashboard overview
 */
billingRoutes.get(
  "/overview",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  billingOverview
);

/**
 * Staff: pending reservations for billing screen
 * reservation + attached invoice if exists
 */
billingRoutes.get(
  "/pending-reservations",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  getPendingReservationsForBilling
);

/**
 * Guest/Staff payment submit
 * Supports:
 * - full payment
 * - partial payment
 * - remaining payment at checkout
 * Online => receipt required
 * Cash => no receipt required
 */
billingRoutes.post(
  "/payment",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  uploadReceipt,
  createOrUpdatePayment
);

/**
 * List invoices
 * Guest => own invoices
 * Staff => all invoices
 */
billingRoutes.get(
  "/invoices",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  listInvoices
);

/**
 * Single invoice detail
 */
billingRoutes.get(
  "/invoices/:id",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  getInvoiceById
);

/**
 * Invoice PDF download
 */
billingRoutes.get(
  "/invoices/:id/pdf",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  downloadInvoicePdf
);

/**
 * Staff confirm pending online payment
 * If full amount completed => Paid
 * Otherwise => PartiallyPaid
 */
billingRoutes.post(
  "/invoices/:id/confirm",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  confirmPayment
);

/**
 * Staff reject pending online payment
 */
billingRoutes.post(
  "/invoices/:id/reject",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  rejectPayment
);

/**
 * Optional email endpoint
 */
billingRoutes.post(
  "/invoices/:id/send-email",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  sendInvoiceEmail
);

/**
 * Pending / unpaid / partial invoices
 * Guest => own pending invoices
 * Staff => all pending invoices
 */
billingRoutes.get(
  "/pending-payments",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  listPendingPayments
);

export default billingRoutes;