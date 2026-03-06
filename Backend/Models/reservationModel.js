// Models/reservationModel.js
import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      unique: true,
      index: true,
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    guestSnapshot: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    roomType: {
      type: String,
      required: true,
      trim: true,
      enum: ["Standard", "Deluxe", "Executive", "Family"],
      index: true,
    },

    // ✅ auto-picked room id
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    roomSnapshot: {
      roomNumber: { type: String, default: "" },
      roomName: { type: String, default: "" },
      basePrice: { type: Number, default: 0 },
    },

    checkInDate: { type: Date, required: true, index: true },
    checkOutDate: { type: Date, required: true, index: true },

    nights: { type: Number, default: 1, min: 1 },

    bookingStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "Checked-In", "Checked-Out", "Cancelled"],
      default: "Confirmed",
      index: true,
    },

    payment: {
  method: {
    type: String,
    enum: ["Cash", "Online"],
    default: "Cash",
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
  },
  amount: {
    type: Number,
    default: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  remainingAmount: {
    type: Number,
    default: 0,
  },
  receipt: {
    url: { type: String, default: "" },
    public_id: { type: String, default: "" },
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
    guestsCount: {
      adults: { type: Number, default: 1, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },

    specialRequests: { type: String, default: "", trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// ✅ Auto reservation number
reservationSchema.pre("save", function () {
  if (!this.reservationNumber) {
    const stamp = Date.now().toString().slice(-6);
    this.reservationNumber = `RSV-${new Date().getFullYear()}-${stamp}`;
  }
});

// ✅ Nights calc
reservationSchema.pre("save", function () {
  if (this.checkInDate && this.checkOutDate) {
    const ms =
      new Date(this.checkOutDate).getTime() - new Date(this.checkInDate).getTime();
    const nights = Math.ceil(ms / (1000 * 60 * 60 * 24));
    this.nights = Math.max(1, nights);
  }
});

reservationSchema.index({ roomType: 1, bookingStatus: 1, checkInDate: 1, checkOutDate: 1 });
reservationSchema.index({ room: 1, bookingStatus: 1 });
reservationSchema.index({ "payment.status": 1, "payment.method": 1 });

const Reservation = mongoose.model("Reservation", reservationSchema);
export default Reservation;