import Invoice from "../Models/billingModel.js";
import Reservation from "../Models/reservationModel.js";

const ensureAuth = (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return true;
};

const isStaff = (role) =>
  ["admin", "manager", "receptionist"].includes(String(role || "").toLowerCase());

export const billingOverview = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const role = String(req.user.role || "").toLowerCase();
    if (!isStaff(role)) return res.status(403).json({ message: "Access denied" });

    const totalPaidAgg = await Invoice.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]);
    const totalRevenue = Number(totalPaidAgg?.[0]?.total || 0);

    const pendingInvoices = await Invoice.countDocuments({
      status: { $in: ["Pending", "PendingVerification"] },
    });

    const paidAmount = totalRevenue;

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
      { $group: { _id: null, total: { $sum: "$remainingAmount" } } },
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
        paidAmount,
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
    if (!ensureAuth(req, res)) return;

    const { reservationId, method } = req.body;

    if (!reservationId || !method) {
      return res.status(400).json({ message: "reservationId and method are required" });
    }

    if (!["Cash", "Online"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const reservation = await Reservation.findById(reservationId).populate("guest", "role");
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    const role = String(req.user.role || "").toLowerCase();
    const isGuest = role === "guest";

    if (isGuest && String(reservation.guest) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!isGuest && !isStaff(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (reservation.bookingStatus === "Cancelled") {
      return res.status(400).json({ message: "Cancelled reservation cannot be paid" });
    }

    const amount = Number(reservation?.payment?.amount || 0);
    if (amount <= 0) return res.status(400).json({ message: "Invalid reservation amount" });

    let invoice = await Invoice.findOne({ reservation: reservation._id });

    const receipt = { url: "", public_id: "" };
    if (req.file) {
      receipt.url = req.file.path || "";
      receipt.public_id = req.file.filename || "";
    }

    const status =
      method === "Online"
        ? receipt.url
          ? "PendingVerification"
          : "PendingVerification"
        : "Pending";

    if (!invoice) {
      invoice = await Invoice.create({
        reservation: reservation._id,
        guest: reservation.guest,
        amount,
        method,
        status,
        receipt,
      });
    } else {
      invoice.method = method;
      invoice.amount = amount;
      invoice.status = status;
      if (receipt.url) invoice.receipt = receipt;
      await invoice.save();
    }

    reservation.payment.method = method;
    reservation.payment.status = method === "Online" ? "Pending" : "Pending";
    if (receipt.url) reservation.payment.receipt = receipt;

    reservation.bookingStatus = "Pending";
    await reservation.save();

    return res.status(201).json({
      message: "Payment initiated",
      invoice,
      reservation,
    });
  } catch (error) {
    return res.status(500).json({ message: "Payment failed", error: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const role = String(req.user.role || "").toLowerCase();
    if (!isStaff(role)) return res.status(403).json({ message: "Access denied" });

    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const reservation = await Reservation.findById(invoice.reservation);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    invoice.status = "Paid";
    invoice.confirmedBy = req.user._id;
    invoice.confirmedAt = new Date();
    await invoice.save();

    reservation.payment.status = "Paid";
    reservation.bookingStatus = "Confirmed";
    reservation.payment.confirmedBy = req.user._id;
    reservation.payment.confirmedAt = new Date();
    await reservation.save();

    return res.json({ message: "Payment confirmed", invoice, reservation });
  } catch (error) {
    return res.status(500).json({ message: "Confirm payment failed", error: error.message });
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
    const isGuest = role === "guest";

    const { status, method, q } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;

    if (isGuest) filter.guest = req.user._id;

    if (q) {
      const query = String(q).trim();
      filter.$or = [
        { invoiceNumber: { $regex: query, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(filter)
      .populate("reservation", "reservationNumber bookingStatus checkInDate checkOutDate roomType roomSnapshot payment")
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
      .populate("reservation", "reservationNumber bookingStatus checkInDate checkOutDate roomType roomSnapshot payment")
      .populate("guest", "name email phone role");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const role = String(req.user.role || "").toLowerCase();
    if (role === "guest" && String(invoice.guest?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ invoice });
  } catch (error) {
    return res.status(500).json({ message: "Fetch invoice failed", error: error.message });
  }
};

export const sendInvoiceEmail = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const role = String(req.user.role || "").toLowerCase();
    if (!isStaff(role)) return res.status(403).json({ message: "Access denied" });

    const { id } = req.params;
    const { toEmail, note = "" } = req.body || {};

    if (!toEmail) {
      return res.status(400).json({ message: "toEmail is required" });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Stub: yahan actual email sending integrate kar sakte ho (SMTP / service)
    return res.json({
      message: "Invoice email queued (stub)",
      toEmail,
      note,
      invoiceId: invoice.invoiceNumber,
    });
  } catch (error) {
    return res.status(500).json({ message: "Send invoice email failed", error: error.message });
  }
};