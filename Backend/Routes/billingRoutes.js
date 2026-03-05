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

// ✅ NOTE: keep filename EXACT same as your config file
import { uploadReceipt } from "../config/BillingCloudinary.js";

const billingRoutes = express.Router();

/**
 * ✅ Staff Dashboard Overview
 */
billingRoutes.get(
  "/overview",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  billingOverview
);

/**
 * ✅ NEW: Pending Reservations (for billing screen)
 * Staff will fetch all Pending reservations + attached invoice (if exists)
 */
billingRoutes.get(
  "/pending-reservations",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  getPendingReservationsForBilling
);

/**
 * ✅ Payment Submit (Guest/Staff)
 * Online => receipt required (multipart)
 * Cash   => receipt optional
 */
billingRoutes.post(
  "/payment",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  uploadReceipt,
  createOrUpdatePayment
);

/**
 * ✅ Invoices list (Guest sees own, Staff sees all)
 */
billingRoutes.get(
  "/invoices",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  listInvoices
);

/**
 * ✅ Invoice detail
 */
billingRoutes.get(
  "/invoices/:id",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  getInvoiceById
);

/**
 * ✅ PDF download
 */
billingRoutes.get(
  "/invoices/:id/pdf",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  downloadInvoicePdf
);

/**
 * ✅ Staff confirms payment => invoice Paid + reservation Confirmed
 */
billingRoutes.post(
  "/invoices/:id/confirm",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  confirmPayment
);

/**
 * ✅ Staff rejects payment => invoice Rejected + reservation payment Rejected
 */
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


billingRoutes.get(
  "/pending-payments",
  protect,
  authorizeRoles("guest", "admin", "manager", "receptionist"),
  listPendingPayments
);

export default billingRoutes;