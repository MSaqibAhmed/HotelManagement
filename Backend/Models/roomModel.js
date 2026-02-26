import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
   roomNumber: {
  type: String,
  required: true,
  trim: true,
  unique: true,
},
    roomName: {
      type: String,
      trim: true,
      default: "",
    },
    roomType: {
      type: String,
      required: true,
      trim: true,
    },
    typeDescription: {
      type: String,
      trim: true,
      default: "",
    },
    amenities: {
      type: [String],
      default: [],
    },
    floor: {
      type: Number,
      required: true,
      min: 0,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    extraCapability: {
      type: String,
      trim: true,
      default: "",
    },
    bedNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    bedType: {
      type: String,
      required: true,
      enum: ["Single", "Double", "Standard Queen", "Luxury King", "Standard Twin"],
    },
    roomSize: {
      type: String,
      required: true,
      enum: ["Small", "Queen", "King", "Twin"],
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 1,
      },
      weekendPrice: {
        type: Number,
        default: 0,
        min: 0,
      },
      extraBedCharge: {
        type: Number,
        default: 0,
        min: 0,
      },
      seasonalRate: {
        type: String,
        enum: ["Normal", "Holiday", "Premium", "Off-Season"],
        default: "Normal",
      },
      discountPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    status: {
      type: String,
      enum: ["Available", "Occupied", "Cleaning", "Maintenance"],
      default: "Available",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    roomDescription: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
    },
    reserveCondition: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
    },
    coverImage: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: "",
      },
    },
    galleryImages: [
      {
        url: {
          type: String,
          default: "",
        },
        public_id: {
          type: String,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);
roomSchema.index({ roomType: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ isActive: 1 });
roomSchema.index({ floor: 1 });

const Room = mongoose.model("Room", roomSchema);

export default Room;