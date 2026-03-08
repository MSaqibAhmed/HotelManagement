import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    feedbackNumber: {
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
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },

    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },

    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },

    roomSnapshot: {
      roomNumber: { type: String, trim: true, default: "" },
      roomType: { type: String, trim: true, default: "" },
    },

    category: {
      type: String,
      enum: ["Stay", "Service", "Staff", "Cleanliness", "Food", "Other"],
      default: "Stay",
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Submitted", "Reviewed"],
      default: "Submitted",
    },

    adminResponse: {
      type: String,
      trim: true,
      default: "",
    },

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

feedbackSchema.pre("save", async function (next) {
  if (!this.isNew || this.feedbackNumber) return next();

  const count = await this.constructor.countDocuments();
  this.feedbackNumber = `FDB-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;