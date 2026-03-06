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

const recalculateInvoice = (invoice) => {
  invoice.totalAmount = Number(invoice.totalAmount || 0);
  invoice.paidAmount = Number(invoice.paidAmount || 0);
  invoice.remainingAmount = Math.max(invoice.totalAmount - invoice.paidAmount, 0);

  if (invoice.paidAmount <= 0) {
    invoice.status = "Pending";
  } else if (invoice.paidAmount < invoice.totalAmount) {
    invoice.status = "PartiallyPaid";
  } else {
    invoice.status = "Paid";
  }
};

const syncReservationPayment = async (reservation, invoice, extra = {}) => {
  if (!reservation.payment) reservation.payment = {};

  reservation.payment.amount = Number(invoice.totalAmount || 0);
  reservation.payment.paidAmount = Number(invoice.paidAmount || 0);
  reservation.payment.remainingAmount = Number(invoice.remainingAmount || 0);
  reservation.payment.status = extra.paymentStatus || invoice.status;

  if (extra.method) reservation.payment.method = extra.method;
  if (extra.receipt) reservation.payment.receipt = extra.receipt;
  if (extra.confirmedBy) reservation.payment.confirmedBy = extra.confirmedBy;
  if (extra.confirmedAt) reservation.payment.confirmedAt = extra.confirmedAt;

  await reservation.save();
};

const getLatestReceiptUrl = (invoice) => {
  if (!invoice?.paymentHistory?.length) return "";
  const item = [...invoice.paymentHistory].reverse().find((p) => p?.receipt?.url);
  return item?.receipt?.url || "";
};

const getLatestMethod = (invoice) => {
  if (!invoice?.paymentHistory?.length) return "Cash";
  return invoice.paymentHistory[invoice.paymentHistory.length - 1]?.method || "Cash";
};

// PDF helper
const streamInvoicePdf = async ({ invoice, reservation, guest, res }) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${invoice.invoiceNumber || "invoice"}.pdf"`
  );

  doc.pipe(res);

  doc.fontSize(20).text("LuxuryStay Hotel", { align: "left" });
  doc.fontSize(12).fillColor("gray").text("Invoice", { align: "left" });
  doc.moveDown(1);
  doc.fillColor("black");

  doc.fontSize(11);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`);
  doc.text(`Status: ${invoice.status}`);
  doc.text(`Latest Method: ${getLatestMethod(invoice)}`);
  doc.text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString()}`);
  doc.moveDown(0.8);

  doc.fontSize(12).text("Billed To", { underline: true });
  doc.fontSize(11);
  doc.text(`${guest?.name || reservation?.guestSnapshot?.name || "Guest"}`);
  doc.text(`${guest?.email || reservation?.guestSnapshot?.email || ""}`);
  doc.text(`${guest?.phone || reservation?.guestSnapshot?.phone || ""}`);
  doc.moveDown(0.8);

  doc.fontSize(12).text("Reservation Details", { underline: true });
  doc.fontSize(11);
  doc.text(`Reservation #: ${reservation?.reservationNumber || "-"}`);
  doc.text(`Room Type: ${reservation?.roomType || "-"}`);
  doc.text(
    `Room: ${reservation?.roomSnapshot?.roomNumber || ""} ${
      reservation?.roomSnapshot?.roomName
        ? `(${reservation.roomSnapshot.roomName})`
        : ""
    }`
  );
  doc.text(
    `Check-in: ${
      reservation?.checkInDate
        ? new Date(reservation.checkInDate).toLocaleDateString()
        : "-"
    }`
  );
  doc.text(
    `Check-out: ${
      reservation?.checkOutDate
        ? new Date(reservation.checkOutDate).toLocaleDateString()
        : "-"
    }`
  );
  doc.text(`Nights: ${reservation?.nights || 0}`);
  doc.text(
    `Guests: Adults ${reservation?.guestsCount?.adults || 1}, Children ${
      reservation?.guestsCount?.children || 0
    }`
  );
  doc.moveDown(1);

  doc.fontSize(12).text("Payment Summary", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(11);
  doc.text(`Total Amount: Rs ${Number(invoice.totalAmount || 0).toLocaleString()}`);
  doc.text(`Paid Amount: Rs ${Number(invoice.paidAmount || 0).toLocaleString()}`);
  doc.text(
    `Remaining Amount: Rs ${Number(invoice.remainingAmount || 0).toLocaleString()}`
  );
  doc.text(`Payment Status: ${invoice.status}`);
  if (invoice.note) doc.text(`Note: ${invoice.note}`);

  if (invoice.paymentHistory?.length) {
    doc.moveDown(0.8);
    doc.fontSize(12).text("Payment History", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10);

    invoice.paymentHistory.forEach((item, index) => {
      doc.text(
        `${index + 1}. ${item.method} | ${item.stage} | Rs ${Number(
          item.amount || 0
        ).toLocaleString()} | ${item.status} | ${
          item.paidAt ? new Date(item.paidAt).toLocaleDateString() : "-"
        }`
      );
    });
  }

  doc.moveDown(1);
  doc.fontSize(10).fillColor("gray").text(
    "Thank you for choosing LuxuryStay Hotel.",
    { align: "center" }
  );
  doc.fillColor("black");

  doc.end();
};

export const billingOverview = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const role = String(req.user.role || "").toLowerCase();
    if (!isStaff(role)) return res.status(403).json({ message: "Access denied" });

    const paidAgg = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$paidAmount" },
          totalRemaining: { $sum: "$remainingAmount" },
        },
      },
    ]);

    const totalRevenue = Number(paidAgg?.[0]?.totalPaid || 0);
    const overdueAmount = Number(paidAgg?.[0]?.totalRemaining || 0);

    const pendingInvoices = await Invoice.countDocuments({
      status: { $in: ["Pending", "PendingVerification", "PartiallyPaid"] },
    });

    const recentDocs = await Invoice.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("guest", "name")
      .lean();

    const recentInvoices = recentDocs.map((inv) => ({
      _id: inv._id,
      invoiceId: inv.invoiceNumber,
      guestName: inv.guest?.name || "Guest",
      amount: Number(inv.totalAmount || 0),
      paidAmount: Number(inv.paidAmount || 0),
      remainingAmount: Number(inv.remainingAmount || 0),
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
    return res.status(500).json({
      message: "Billing overview failed",
      error: error.message,
    });
  }
};

export const createOrUpdatePayment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const { reservationId, method, amount, stage, note } = req.body;

    if (!reservationId || !method || !amount) {
      return res.status(400).json({
        message: "reservationId, method and amount are required",
      });
    }

    if (!["Cash", "Online"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ message: "Valid payment amount is required" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (!reservation.payment) {
      reservation.payment = {};
    }

    const role = String(req.user.role || "").toLowerCase();
    const guestMode = role === "guest";
    const staffMode = isStaff(role);

    const resGuestId = reservation.guest?._id ? reservation.guest._id : reservation.guest;

    if (guestMode && String(resGuestId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!guestMode && !staffMode) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (guestMode && method === "Cash") {
      return res.status(403).json({ message: "Guest cannot submit cash payment" });
    }

    const totalAmount = Number(reservation?.payment?.amount || 0);
    if (totalAmount <= 0) {
      return res.status(400).json({ message: "Invalid reservation amount" });
    }

    const receipt = { url: "", public_id: "" };
    if (req.file) {
      receipt.url = req.file.path || "";
      receipt.public_id = req.file.filename || "";
    }

    if (method === "Online" && !receipt.url) {
      return res.status(400).json({
        message: "Receipt is required for Online payment",
      });
    }

    let invoice = await Invoice.findOne({ reservation: reservation._id });

    if (!invoice) {
      invoice = new Invoice({
        reservation: reservation._id,
        guest: resGuestId,
        totalAmount,
        paidAmount: 0,
        remainingAmount: totalAmount,
        status: "Pending",
        paymentHistory: [],
        note: "",
      });
    }

    const actualRemaining = Math.max(
      Number(invoice.totalAmount || totalAmount) - Number(invoice.paidAmount || 0),
      0
    );

    invoice.remainingAmount = actualRemaining;

    if (payAmount > actualRemaining) {
      return res.status(400).json({
        message: `Payment exceeds remaining amount. Remaining: ${actualRemaining}`,
      });
    }

    const paymentStage =
      stage ||
      (payAmount === totalAmount ? "Full" : invoice.paidAmount > 0 ? "Final" : "Advance");

    if (method === "Cash") {
      invoice.paymentHistory.push({
        amount: payAmount,
        method: "Cash",
        stage: paymentStage,
        status: "Approved",
        note: note || "",
        receivedBy: staffMode ? req.user._id : null,
        paidAt: new Date(),
      });

      const approvedPaid = invoice.paymentHistory
        .filter((item) => item.status === "Approved")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      invoice.paidAmount = approvedPaid;
      if (note) invoice.note = note;

      recalculateInvoice(invoice);

      if (invoice.status === "Paid") {
        invoice.confirmedBy = req.user._id;
        invoice.confirmedAt = new Date();
      }

      await invoice.save();

      if (invoice.status === "Paid") {
        reservation.bookingStatus = "Confirmed";
      }

      await syncReservationPayment(reservation, invoice, {
        method: "Cash",
        paymentStatus: invoice.status,
        confirmedBy: invoice.confirmedBy,
        confirmedAt: invoice.confirmedAt,
      });

      return res.status(201).json({
        message:
          invoice.status === "Paid"
            ? "Payment completed successfully"
            : "Partial payment added successfully",
        invoice,
        reservation,
      });
    }

    invoice.paymentHistory.push({
      amount: payAmount,
      method: "Online",
      stage: paymentStage,
      status: "PendingVerification",
      receipt,
      note: note || "",
      receivedBy: null,
      paidAt: new Date(),
    });

    invoice.status = "PendingVerification";
    if (note) invoice.note = note;

    await invoice.save();

    reservation.bookingStatus = "Pending";

    await syncReservationPayment(reservation, invoice, {
      method: "Online",
      paymentStatus: "PendingVerification",
      receipt,
    });

    return res.status(201).json({
      message: "Online payment submitted and waiting for verification",
      invoice,
      reservation,
    });
  } catch (err) {
    console.error("createOrUpdatePayment error:", err);
    return res.status(500).json({
      message: "Payment failed",
      error: err.message,
    });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const role = String(req.user.role || "").toLowerCase();
    if (!isStaff(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const reservation = await Reservation.findById(invoice.reservation);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (!reservation.payment) {
      reservation.payment = {};
    }

    const pendingIndexes = (invoice.paymentHistory || [])
      .map((item, index) => ({ item, index }))
      .filter(
        ({ item }) =>
          item?.method === "Online" && item?.status === "PendingVerification"
      );

    if (!pendingIndexes.length) {
      return res.status(400).json({ message: "No pending online payment found" });
    }

    const latestPending = pendingIndexes[pendingIndexes.length - 1];
    const payment = invoice.paymentHistory[latestPending.index];

    payment.status = "Approved";
    payment.receivedBy = req.user._id;

    const approvedPaid = invoice.paymentHistory
      .filter((item) => item.status === "Approved")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    invoice.paidAmount = approvedPaid;
    invoice.confirmedBy = req.user._id;
    invoice.confirmedAt = new Date();

    recalculateInvoice(invoice);
    await invoice.save();

    if (invoice.status === "Paid") {
      reservation.bookingStatus = "Confirmed";
    }

    await syncReservationPayment(reservation, invoice, {
      method: payment.method,
      paymentStatus: invoice.status,
      confirmedBy: req.user._id,
      confirmedAt: new Date(),
      receipt: payment.receipt,
    });

    return res.json({
      message:
        invoice.status === "Paid"
          ? "Payment confirmed successfully"
          : "Online partial payment confirmed successfully",
      invoice,
      reservation,
    });
  } catch (err) {
    console.error("confirmPayment error:", err);
    return res.status(500).json({
      message: "Confirm failed",
      error: err.message,
    });
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

    if (!reservation.payment) {
      reservation.payment = {};
    }

    const pendingIndexes = (invoice.paymentHistory || [])
      .map((item, index) => ({ item, index }))
      .filter(
        ({ item }) =>
          item?.method === "Online" && item?.status === "PendingVerification"
      );

    if (!pendingIndexes.length) {
      return res.status(400).json({ message: "No pending online payment found" });
    }

    const latestPending = pendingIndexes[pendingIndexes.length - 1];

    invoice.paymentHistory[latestPending.index].status = "Rejected";
    invoice.paymentHistory[latestPending.index].note = note || "Payment rejected";
    invoice.note = note || "Payment rejected";
    invoice.confirmedBy = req.user._id;
    invoice.confirmedAt = new Date();

    const approvedPaid = invoice.paymentHistory
      .filter((item) => item.status === "Approved")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    invoice.paidAmount = approvedPaid;
    recalculateInvoice(invoice);

    if (invoice.paidAmount <= 0) {
      invoice.status = "Rejected";
    }

    await invoice.save();

    await syncReservationPayment(reservation, invoice, {
      paymentStatus: invoice.status,
      confirmedBy: req.user._id,
      confirmedAt: new Date(),
    });

    return res.json({
      message: "Payment rejected successfully",
      invoice,
      reservation,
    });
  } catch (error) {
    console.error("rejectPayment error:", error);
    return res.status(500).json({
      message: "Reject payment failed",
      error: error.message,
    });
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
    if (guestMode) filter.guest = req.user._id;

    const invoices = await Invoice.find(filter)
      .populate(
        "reservation",
        "reservationNumber bookingStatus checkInDate checkOutDate roomType roomSnapshot guestsCount payment guest guestSnapshot"
      )
      .populate("guest", "name email phone role")
      .sort({ createdAt: -1 });

    let finalInvoices = invoices;

    if (method && method !== "All") {
      finalInvoices = finalInvoices.filter((inv) =>
        inv.paymentHistory?.some((item) => item.method === method)
      );
    }

    if (q) {
      const query = String(q).trim().toLowerCase();
      finalInvoices = finalInvoices.filter(
        (inv) =>
          String(inv.invoiceNumber || "").toLowerCase().includes(query) ||
          String(inv.guest?.name || "").toLowerCase().includes(query) ||
          String(inv.guest?.email || "").toLowerCase().includes(query) ||
          String(inv.reservation?.reservationNumber || "")
            .toLowerCase()
            .includes(query)
      );
    }

    return res.json({
      count: finalInvoices.length,
      invoices: finalInvoices,
    });
  } catch (error) {
    console.error("listInvoices error:", error);
    return res.status(500).json({
      message: "Fetch invoices failed",
      error: error.message,
    });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const invoice = await Invoice.findById(req.params.id)
      .populate(
        "reservation",
        "reservationNumber bookingStatus checkInDate checkOutDate roomType roomSnapshot guestsCount payment guest guestSnapshot"
      )
      .populate("guest", "name email phone role");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (!canAccessInvoice(req.user, invoice)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ invoice });
  } catch (error) {
    console.error("getInvoiceById error:", error);
    return res.status(500).json({
      message: "Fetch invoice failed",
      error: error.message,
    });
  }
};

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
    console.error("downloadInvoicePdf error:", error);
    return res.status(500).json({
      message: "PDF download failed",
      error: error.message,
    });
  }
};

export const sendInvoiceEmail = async (req, res) => {
  return res.status(501).json({ message: "Email sending not implemented yet" });
};

export const getPendingReservationsForBilling = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const role = String(req.user.role || "").toLowerCase();
    if (!isStaff(role)) return res.status(403).json({ message: "Access denied" });

    const reservations = await Reservation.find({ bookingStatus: "Pending" })
      .populate("guest", "name email phone")
      .populate("room", "roomNumber roomName roomType")
      .sort({ createdAt: -1 });

    const reservationIds = reservations.map((r) => r._id);
    const invoices = await Invoice.find({ reservation: { $in: reservationIds } }).lean();

    const invoiceMap = new Map(invoices.map((i) => [String(i.reservation), i]));

    const data = reservations.map((reservation) => ({
      reservation,
      invoice: invoiceMap.get(String(reservation._id)) || null,
    }));

    return res.json({ count: data.length, data });
  } catch (err) {
    console.error("getPendingReservationsForBilling error:", err);
    return res.status(500).json({
      message: "Failed to fetch pending reservations",
      error: err.message,
    });
  }
};

export const listPendingPayments = async (req, res) => {
  try {
    if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" });

    const role = String(req.user.role || "").toLowerCase();
    const staff = isStaff(role);
    const guest = role === "guest";

    const filter = {
      status: { $in: ["Pending", "PendingVerification", "PartiallyPaid"] },
    };

    if (guest) filter.guest = req.user._id;
    if (!guest && !staff) return res.status(403).json({ message: "Access denied" });

    const invoices = await Invoice.find(filter)
      .populate("guest", "name email phone")
      .populate(
        "reservation",
        "reservationNumber bookingStatus roomType roomSnapshot checkInDate checkOutDate guestsCount payment guest guestSnapshot"
      )
      .sort({ createdAt: -1 });

    return res.json({
      count: invoices.length,
      invoices,
    });
  } catch (err) {
    console.error("listPendingPayments error:", err);
    return res.status(500).json({
      message: "Failed to fetch pending payments",
      error: err.message,
    });
  }
};