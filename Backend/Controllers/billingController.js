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
        totalAmount: amount,
        paidAmount: 0,
        method,
        status,
        receipt,
      });
    } else {
      invoice.method = method;
      invoice.totalAmount = amount;
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

    invoice.paidAmount = invoice.totalAmount;
    invoice.confirmedBy = req.user._id;
    invoice.confirmedAt = new Date();
    await invoice.save(); // pre-validate hook sets status = "Paid"

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

export const generateInvoicePdf = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const invoice = await Invoice.findById(req.params.id)
      .populate("reservation", "reservationNumber checkInDate checkOutDate roomType roomSnapshot nights guestsCount payment")
      .populate("guest", "name email phone");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const role = String(req.user.role || "").toLowerCase();
    if (role === "guest" && String(invoice.guest?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const r = invoice.reservation || {};
    const g = invoice.guest || {};

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "-";
    const formatPKR = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${invoice.invoiceNumber}</title>
<style>
  body { font-family: Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 0; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #1e266d; padding-bottom: 20px; }
  .hotel-name { font-size: 26px; font-weight: 800; color: #1e266d; }
  .hotel-sub { font-size: 13px; color: #555; margin-top: 4px; }
  .inv-title { text-align: right; }
  .inv-title h2 { font-size: 20px; font-weight: 700; color: #1e266d; margin: 0 0 6px; }
  .inv-title p { font-size: 12px; color: #777; margin: 2px 0; }
  .section { margin-bottom: 24px; }
  .section h3 { font-size: 13px; font-weight: 700; color: #1e266d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .label { font-size: 12px; color: #777; }
  .value { font-size: 13px; font-weight: 600; color: #111; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #1e266d; color: white; padding: 10px 12px; font-size: 11px; text-align: left; }
  td { padding: 10px 12px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
  .total-row td { font-weight: 700; font-size: 14px; background: #f0f4ff; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .badge-paid { background:#d1fae5; color:#065f46; }
  .badge-pending { background:#fef3c7; color:#92400e; }
  .badge-partial { background:#ede9fe; color:#4c1d95; }
  .badge-rejected { background:#fee2e2; color:#991b1b; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #aaa; text-align: center; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="hotel-name">GrandStay Hotel</div>
      <div class="hotel-sub">Premium Hotel Management</div>
    </div>
    <div class="inv-title">
      <h2>INVOICE</h2>
      <p>${invoice.invoiceNumber}</p>
      <p>Date: ${formatDate(invoice.createdAt)}</p>
      <span class="badge badge-${invoice.status.toLowerCase().replace('pendingverification','pending').replace('partiallypaid','partial')}">${invoice.status}</span>
    </div>
  </div>

  <div class="section">
    <h3>Guest Information</h3>
    <div class="grid">
      <div><div class="label">Name</div><div class="value">${g.name || '-'}</div></div>
      <div><div class="label">Email</div><div class="value">${g.email || '-'}</div></div>
      <div><div class="label">Phone</div><div class="value">${g.phone || '-'}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Booking Summary</h3>
    <div class="grid">
      <div><div class="label">Booking #</div><div class="value">${r.reservationNumber || '-'}</div></div>
      <div><div class="label">Room Type</div><div class="value">${r.roomType || '-'}</div></div>
      <div><div class="label">Room #</div><div class="value">${r.roomSnapshot?.roomNumber || '-'}</div></div>
      <div><div class="label">Check-in</div><div class="value">${formatDate(r.checkInDate)}</div></div>
      <div><div class="label">Check-out</div><div class="value">${formatDate(r.checkOutDate)}</div></div>
      <div><div class="label">Nights</div><div class="value">${r.nights || '-'}</div></div>
    </div>
  </div>

  <div class="section">
    <h3>Payment Details</h3>
    <table>
      <thead><tr><th>Description</th><th>Amount</th></tr></thead>
      <tbody>
        <tr><td>Room Charges</td><td>${formatPKR(invoice.totalAmount)}</td></tr>
        ${invoice.paymentHistory?.map(ph => `<tr><td>${ph.stage} via ${ph.method} on ${formatDate(ph.paidAt)}</td><td>-${formatPKR(ph.amount)}</td></tr>`).join('') || ''}
        <tr class="total-row"><td>Total Amount</td><td>${formatPKR(invoice.totalAmount)}</td></tr>
        <tr class="total-row"><td>Paid Amount</td><td>${formatPKR(invoice.paidAmount)}</td></tr>
        <tr class="total-row"><td>Balance Due</td><td>${formatPKR(invoice.remainingAmount)}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">Thank you for staying with GrandStay Hotel. This is a computer-generated invoice and requires no signature.</div>
</div>
</body></html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.html"`);
    return res.send(html);
  } catch (error) {
    return res.status(500).json({ message: "PDF generation failed", error: error.message });
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