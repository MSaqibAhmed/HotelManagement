import PDFDocument from "pdfkit";
import Invoice from "../Models/billingModel.js";
import Reservation from "../Models/reservationModel.js";
import User from "../Models/userModel.js";

const ensureAuth = (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return true;
};

const isStaff = (role) =>
  ["admin", "manager", "receptionist"].includes(String(role || "").toLowerCase());

const canAccessInvoice = (reqUser, invoice) => {
  const role = String(reqUser?.role || "").toLowerCase();
  if (isStaff(role)) return true;
  if (role === "guest" && String(invoice.guest) === String(reqUser._id)) return true;
  return false;
};

//PDF generator helper
const streamInvoicePdf = async ({ invoice, reservation, guest, res }) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${invoice.invoiceNumber || "invoice"}.pdf"`
  );

  doc.pipe(res);

  // Header
  doc.fontSize(20).text("LuxuryStay Hotel", { align: "left" });
  doc.fontSize(12).fillColor("gray").text("Invoice", { align: "left" });
  doc.moveDown(1);
  doc.fillColor("black");

  // Invoice meta
  doc.fontSize(11);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`);
  doc.text(`Status: ${invoice.status}`);
  doc.text(`Payment Method: ${invoice.method}`);
  doc.text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString()}`);
  doc.moveDown(0.8);

  // Guest info
  doc.fontSize(12).text("Billed To", { underline: true });
  doc.fontSize(11);
  doc.text(`${guest?.name || reservation?.guestSnapshot?.name || "Guest"}`);
  doc.text(`${guest?.email || reservation?.guestSnapshot?.email || ""}`);
  doc.text(`${guest?.phone || reservation?.guestSnapshot?.phone || ""}`);
  doc.moveDown(0.8);

  // Reservation summary
  doc.fontSize(12).text("Reservation Details", { underline: true });
  doc.fontSize(11);
  doc.text(`Reservation #: ${reservation?.reservationNumber || "-"}`);
  doc.text(`Room Type: ${reservation?.roomType || "-"}`);
  doc.text(`Room: ${reservation?.roomSnapshot?.roomNumber || ""} ${reservation?.roomSnapshot?.roomName ? `(${reservation.roomSnapshot.roomName})` : ""}`);
  doc.text(`Check-in: ${reservation?.checkInDate ? new Date(reservation.checkInDate).toLocaleDateString() : "-"}`);
  doc.text(`Check-out: ${reservation?.checkOutDate ? new Date(reservation.checkOutDate).toLocaleDateString() : "-"}`);
  doc.text(`Nights: ${reservation?.nights || 0}`);
  doc.text(`Guests: Adults ${reservation?.guestsCount?.adults || 1}, Children ${reservation?.guestsCount?.children || 0}`);
  doc.moveDown(1);

  // Amount box
  doc.fontSize(12).text("Payment Summary", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(11);
  doc.text(`Amount: Rs ${Number(invoice.amount || 0).toLocaleString()}`);
  doc.text(`Payment Status: ${invoice.status}`);
  if (invoice.note) doc.text(`Note: ${invoice.note}`);
  doc.moveDown(1);

  // Footer
  doc.fontSize(10).fillColor("gray").text("Thank you for choosing LuxuryStay Hotel.", { align: "center" });
  doc.fillColor("black");

  doc.end();
};

export const billingOverview = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const role = String(req.user.role || "").toLowerCase();
    if (!isStaff(role)) return res.status(403).json({ message: "Access denied" });

    const totalPaidAgg = await Invoice.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = Number(totalPaidAgg?.[0]?.total || 0);

    const pendingInvoices = await Invoice.countDocuments({
      status: { $in: ["Pending", "PendingVerification"] },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueAgg = await Invoice.aggregate([
      {
        $match: {
          status: { $in: ["Pending", "PendingVerification"] },
          createdAt: { $lt: sevenDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const overdueAmount = Number(overdueAgg?.[0]?.total || 0);

    const recentDocs = await Invoice.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("guest", "name")
      .lean();

    const recentInvoices = recentDocs.map((inv) => ({
      _id: inv._id,
      invoiceId: inv.invoiceNumber,
      guestName: inv.guest?.name || "Guest",
      amount: Number(inv.amount || 0),
      dueDate: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "",
      status: inv.status,
    }));

    return res.json({
      overview: {
        totalRevenue,
        pendingInvoices,
        paidAmount: totalRevenue,
        overdueAmount,
      },
      recentInvoices,
    });
  } catch (error) {
    return res.status(500).json({ message: "Billing overview failed", error: error.message });
  }
};

export const createOrUpdatePayment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const { reservationId, method } = req.body;

    if (!reservationId || !method) {
      return res.status(400).json({ message: "reservationId and method are required" });
    }
    if (!["Cash", "Online"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const role = String(req.user.role || "").toLowerCase();
    const guestMode = role === "guest";
    const staffMode = ["admin", "manager", "receptionist"].includes(role);

    const resGuestId = reservation.guest?._id ? reservation.guest._id : reservation.guest;

    if (guestMode && String(resGuestId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (!guestMode && !staffMode) {
      return res.status(403).json({ message: "Access denied" });
    }

    const amount = Number(reservation?.payment?.amount || 0);
    if (amount <= 0) return res.status(400).json({ message: "Invalid reservation amount" });

    // receipt from multer
    const receipt = { url: "", public_id: "" };
    if (req.file) {
      receipt.url = req.file.path || "";
      receipt.public_id = req.file.filename || "";
    }

    if (method === "Online" && !receipt.url) {
      return res.status(400).json({ message: "Receipt is required for Online payment" });
    }

    let status = method === "Online" ? "PendingVerification" : "Pending";

    let invoice = await Invoice.findOne({ reservation: reservation._id });
    if (!invoice) {
      invoice = await Invoice.create({
        reservation: reservation._id,
        guest: resGuestId,
        amount,
        method,
        status,
        receipt: receipt.url ? receipt : { url: "", public_id: "" },
      });
    } else {
      invoice.method = method;
      invoice.amount = amount;
      invoice.status = status;
      if (receipt.url) invoice.receipt = receipt;
      await invoice.save();
    }

    // keep reservation pending until staff confirms
    reservation.bookingStatus = "Pending";
    reservation.payment.method = method;
    reservation.payment.status = "Pending";
    if (receipt.url) reservation.payment.receipt = receipt;
    await reservation.save();

    return res.status(201).json({ message: "Payment submitted", invoice, reservation });
  } catch (err) {
    return res.status(500).json({ message: "Payment failed", error: err.message });
  }
};
export const confirmPayment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const role = String(req.user.role || "").toLowerCase();
    if (!["admin", "manager", "receptionist"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const reservation = await Reservation.findById(invoice.reservation);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    invoice.status = "Paid";
    invoice.confirmedBy = req.user._id;
    invoice.confirmedAt = new Date();
    await invoice.save();

    reservation.bookingStatus = "Confirmed";
    reservation.payment.status = "Paid";
    reservation.payment.confirmedBy = req.user._id;
    reservation.payment.confirmedAt = new Date();
    await reservation.save();

    return res.json({ message: "Payment confirmed", invoice, reservation });
  } catch (err) {
    return res.status(500).json({ message: "Confirm failed", error: err.message });
  }
};
export const rejectPayment = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const role = String(req.user.role || "").toLowerCase();
    if (!isStaff(role)) return res.status(403).json({ message: "Access denied" });

    const { id } = req.params;
    const { note = "" } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const reservation = await Reservation.findById(invoice.reservation);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    invoice.status = "Rejected";
    invoice.note = String(note || "");
    invoice.confirmedBy = req.user._id;
    invoice.confirmedAt = new Date();
    await invoice.save();

    reservation.payment.status = "Rejected";
    reservation.bookingStatus = "Pending";
    await reservation.save();

    return res.json({ message: "Payment rejected", invoice, reservation });
  } catch (error) {
    return res.status(500).json({ message: "Reject payment failed", error: error.message });
  }
};

export const listInvoices = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const role = String(req.user.role || "").toLowerCase();
    const guestMode = role === "guest";

    const { status, method, q } = req.query;

    const filter = {};
    if (status && status !== "All") filter.status = status;
    if (method && method !== "All") filter.method = method;

    if (guestMode) filter.guest = req.user._id;

    if (q) {
      const query = String(q).trim();
      filter.$or = [{ invoiceNumber: { $regex: query, $options: "i" } }];
    }

    const invoices = await Invoice.find(filter)
      .populate("reservation", "reservationNumber bookingStatus checkInDate checkOutDate roomType roomSnapshot guestsCount payment")
      .populate("guest", "name email phone role")
      .sort({ createdAt: -1 });

    return res.json({ count: invoices.length, invoices });
  } catch (error) {
    return res.status(500).json({ message: "Fetch invoices failed", error: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const invoice = await Invoice.findById(req.params.id)
      .populate("reservation", "reservationNumber bookingStatus checkInDate checkOutDate roomType roomSnapshot guestsCount payment")
      .populate("guest", "name email phone role");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (!canAccessInvoice(req.user, invoice)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ invoice });
  } catch (error) {
    return res.status(500).json({ message: "Fetch invoice failed", error: error.message });
  }
};

// ✅ PDF DOWNLOAD
export const downloadInvoicePdf = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (!canAccessInvoice(req.user, invoice)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const reservation = await Reservation.findById(invoice.reservation);
    const guest = await User.findById(invoice.guest).select("name email phone");

    return streamInvoicePdf({ invoice, reservation, guest, res });
  } catch (error) {
    return res.status(500).json({ message: "PDF download failed", error: error.message });
  }
};

// (optional) keep if you want later
export const sendInvoiceEmail = async (req, res) => {
  return res.status(501).json({ message: "Email sending not implemented yet" });
};




// Controllers/billingController.js
export const getPendingReservationsForBilling = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const role = String(req.user.role || "").toLowerCase();
    const isStaff = ["admin", "manager", "receptionist"].includes(role);
    if (!isStaff) return res.status(403).json({ message: "Access denied" });

    // ✅ pending reservations
    const reservations = await Reservation.find({ bookingStatus: "Pending" })
      .populate("guest", "name email phone")
      .populate("room", "roomNumber roomName roomType")
      .sort({ createdAt: -1 });

    // ✅ attach invoice if exists
    const resIds = reservations.map((r) => r._id);
    const invoices = await Invoice.find({ reservation: { $in: resIds } }).lean();

    const invoiceMap = new Map(invoices.map((i) => [String(i.reservation), i]));

    const data = reservations.map((r) => {
      const inv = invoiceMap.get(String(r._id)) || null;
      return {
        reservation: r,
        invoice: inv,
      };
    });

    return res.json({ count: data.length, data });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch pending reservations", error: err.message });
  }
};

export const listPendingPayments = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const role = String(req.user.role || "").toLowerCase();
    const staff = ["admin", "manager", "receptionist"].includes(role);
    const guest = role === "guest";

    const filter = { status: { $in: ["Pending", "PendingVerification"] } };

    if (guest) filter.guest = req.user._id;
    if (!guest && !staff) return res.status(403).json({ message: "Access denied" });

    const invoices = await Invoice.find(filter)
      .populate("guest", "name email phone")
      .populate("reservation", "reservationNumber bookingStatus roomType roomSnapshot checkInDate checkOutDate")
      .sort({ createdAt: -1 });

    return res.json({ count: invoices.length, invoices });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch pending payments", error: err.message });
  }
};