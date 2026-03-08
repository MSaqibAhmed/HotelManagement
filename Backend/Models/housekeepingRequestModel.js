import mongoose from "mongoose";

const housekeepingTimelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Assigned", "In-Progress", "Completed", "Cancelled"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const housekeepingRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    guestSnapshot: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },

    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    roomSnapshot: {
      roomNumber: { type: String, trim: true, default: "" },
      roomType: { type: String, trim: true, default: "" },
      floor: { type: Number, default: 0 },
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      enum: ["Cleaning", "Laundry", "Supplies", "Room Setup", "Other"],
      default: "Cleaning",
    },

    priority: {
      type: String,
      enum: ["Low", "Normal", "High"],
      default: "Normal",
    },

    status: {
      type: String,
      enum: ["Pending", "Assigned", "In-Progress", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    timeline: {
      type: [housekeepingTimelineSchema],
      default: [],
    },
  },
  { timestamps: true }
);

housekeepingRequestSchema.pre("save", async function (next) {
  if (!this.isNew || this.requestNumber) return next();

  const count = await this.constructor.countDocuments();
  this.requestNumber = `HK-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
});

const HousekeepingRequest = mongoose.model("HousekeepingRequest", housekeepingRequestSchema);

export default HousekeepingRequest;