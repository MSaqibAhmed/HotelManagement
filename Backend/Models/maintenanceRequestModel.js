import mongoose from "mongoose";

const maintenanceTimelineSchema = new mongoose.Schema(
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

const maintenanceRequestSchema = new mongoose.Schema(
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

    location: {
      type: String,
      required: true,
      trim: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    category: {
      type: String,
      enum: ["Electrical", "Plumbing", "HVAC", "Carpentry", "Appliances", "Other"],
      default: "Other",
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "Assigned", "In-Progress", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestedByRole: {
      type: String,
      enum: ["guest", "admin", "manager", "receptionist", "housekeeping", "maintenance"],
      required: true,
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

    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    roomStatusBefore: {
      type: String,
      default: "",
    },

    roomStatusAfter: {
      type: String,
      default: "",
    },

    timeline: {
      type: [maintenanceTimelineSchema],
      default: [],
    },
  },
  { timestamps: true }
);

maintenanceRequestSchema.pre("save", async function (next) {
  if (!this.isNew || this.requestNumber) return next();

  const count = await this.constructor.countDocuments();
  this.requestNumber = `MNT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
});

const MaintenanceRequest = mongoose.model("MaintenanceRequest", maintenanceRequestSchema);

export default MaintenanceRequest;