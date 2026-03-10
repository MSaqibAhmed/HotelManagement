import mongoose from "mongoose";

const checklistItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const cleaningReportSchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      trim: true,
      default: "",
    },
    linenChanged: {
      type: Boolean,
      default: false,
    },
    washroomCleaned: {
      type: Boolean,
      default: false,
    },
    floorCleaned: {
      type: Boolean,
      default: false,
    },
    amenitiesRestocked: {
      type: Boolean,
      default: false,
    },
    minibarChecked: {
      type: Boolean,
      default: false,
    },
    damageFound: {
      type: Boolean,
      default: false,
    },
    damageNote: {
      type: String,
      trim: true,
      default: "",
    },
    lostAndFound: {
      type: Boolean,
      default: false,
    },
    lostAndFoundNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const housekeepingTaskSchema = new mongoose.Schema(
  {
    taskNumber: {
      type: String,
      unique: true,
      index: true,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },

    roomSnapshot: {
      roomNumber: { type: String, trim: true, default: "" },
      roomName: { type: String, trim: true, default: "" },
      roomType: { type: String, trim: true, default: "" },
      floor: { type: Number, default: 0 },
    },

    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    taskType: {
      type: String,
      enum: ["CheckoutCleaning", "OccupiedCleaning", "DeepCleaning", "Inspection"],
      default: "CheckoutCleaning",
    },

    roomStatusBefore: {
      type: String,
      default: "",
    },

    roomStatusAfter: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Assigned", "InProgress", "Completed", "Verified", "IssueReported", "Cancelled"],
      default: "Pending",
      index: true,
    },

    priority: {
      type: String,
      enum: ["Normal", "Medium", "High", "Urgent"],
      default: "Normal",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    checklist: {
      type: [checklistItemSchema],
      default: [
        { label: "Bedsheet changed", isDone: false },
        { label: "Washroom cleaned", isDone: false },
        { label: "Floor cleaned", isDone: false },
        { label: "Dusting completed", isDone: false },
        { label: "Amenities restocked", isDone: false },
        { label: "Towels replaced", isDone: false },
      ],
    },

    report: {
      type: cleaningReportSchema,
      default: () => ({}),
    },

    issue: {
      hasIssue: {
        type: Boolean,
        default: false,
      },
      issueType: {
        type: String,
        trim: true,
        default: "",
      },
      description: {
        type: String,
        trim: true,
        default: "",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);



housekeepingTaskSchema.index({ room: 1, status: 1 });
housekeepingTaskSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });

const HousekeepingTask = mongoose.model("HousekeepingTask", housekeepingTaskSchema);
export default HousekeepingTask;