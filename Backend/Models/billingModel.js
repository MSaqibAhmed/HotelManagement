import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, index: true },

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

    amount: { type: Number, required: true, min: 0 },

    method: { type: String, enum: ["Cash", "Online"], required: true },

    status: {
      type: String,
      enum: ["Pending", "PendingVerification", "Paid", "Rejected"],
      default: "Pending",
      index: true,
    },

    receipt: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },

    note: { type: String, default: "" },

    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

invoiceSchema.pre("save", function (next) {
  if (!this.invoiceNumber) {
    const stamp = Date.now().toString().slice(-6);
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${stamp}`;
  }
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;