import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    method: {
      type: String,
      enum: ["Cash", "Online"],
      required: true,
    },

    stage: {
      type: String,
      enum: ["Advance", "Partial", "Final", "Full"],
      default: "Partial",
    },

    status: {
      type: String,
      enum: ["PendingVerification", "Approved", "Rejected"],
      default: "Approved",
    },

    receipt: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
    },

    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
      index: true,
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "PendingVerification",
        "PartiallyPaid",
        "Paid",
        "Rejected",
      ],
      default: "Pending",
      index: true,
    },

    paymentHistory: {
      type: [paymentHistorySchema],
      default: [],
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

invoiceSchema.pre("validate", function () {
  if (!this.invoiceNumber) {
    const stamp = Date.now().toString().slice(-6);
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${stamp}`;
  }

  this.paidAmount = Number(this.paidAmount || 0);
  this.totalAmount = Number(this.totalAmount || 0);
  this.remainingAmount = Math.max(this.totalAmount - this.paidAmount, 0);

  if (this.status !== "PendingVerification" && this.status !== "Rejected") {
    if (this.paidAmount <= 0) {
      this.status = "Pending";
    } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
      this.status = "PartiallyPaid";
    } else if (this.paidAmount >= this.totalAmount) {
      this.status = "Paid";
    }
  }
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;