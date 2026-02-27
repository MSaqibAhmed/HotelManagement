import Room from "../Models/roomModel.js";
import { deleteFromCloudinary } from "../config/uploadCloudinary.js";

export const createRoom = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const {
      roomNumber,
      roomName,
      roomType,
      typeDescription,
      amenities,
      floor,
      capacity,
      extraCapability,
      bedNumber,
      bedType,
      roomSize,
      basePrice,
      weekendPrice,
      extraBedCharge,
      seasonalRate,
      discountPercent,
      status,
      isActive,
      roomDescription,
      reserveCondition,
    } = req.body;

    // Duplicate room number check
    const existingRoom = await Room.findOne({ roomNumber: roomNumber?.trim() });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: "Room number already exists",
      });
    }

    // amenities parse
    let parsedAmenities = [];
    if (amenities) {
      try {
        parsedAmenities = JSON.parse(amenities);
        if (!Array.isArray(parsedAmenities)) parsedAmenities = [];
      } catch (err) {
        parsedAmenities = String(amenities)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    // files safe handling
    let coverImageData = { url: "", public_id: "" };
    let galleryImagesData = [];

    // ✅ multer-storage-cloudinary gives: file.path, file.filename
    if (req.files?.coverImage?.[0]) {
      coverImageData = {
        url: req.files.coverImage[0].path || "",
        public_id: req.files.coverImage[0].filename || "",
      };
    }

    if (req.files?.galleryImages?.length > 0) {
      galleryImagesData = req.files.galleryImages.map((file) => ({
        url: file.path || "",
        public_id: file.filename || "",
      }));
    }

    const newRoom = await Room.create({
      roomNumber: roomNumber?.trim(),
      roomName: roomName?.trim() || "",
      roomType: roomType?.trim(),
      typeDescription: typeDescription?.trim() || "",
      amenities: parsedAmenities,
      floor: Number(floor),
      capacity: Number(capacity),
      extraCapability: extraCapability?.trim() || "",
      bedNumber: Number(bedNumber),
      bedType,
      roomSize,

      pricing: {
        basePrice: Number(basePrice),
        weekendPrice: Number(weekendPrice || 0),
        extraBedCharge: Number(extraBedCharge || 0),
        seasonalRate: seasonalRate || "Normal",
        discountPercent: Number(discountPercent || 0),
      },

      status: status || "Available",
      isActive: isActive === "true" || isActive === true,

      roomDescription: roomDescription?.trim(),
      reserveCondition: reserveCondition?.trim(),

      coverImage: coverImageData,
      galleryImages: galleryImagesData,
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: newRoom,
    });
  } catch (error) {
    console.log("CREATE ROOM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Room creation failed",
    });
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });

    return res.json({
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch rooms",
      error: error.message,
    });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    return res.json({ room });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch room",
      error: error.message,
    });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (req.body.roomNumber && req.body.roomNumber.trim() !== room.roomNumber) {
      const existingRoom = await Room.findOne({
        roomNumber: req.body.roomNumber.trim(),
        _id: { $ne: id },
      });

      if (existingRoom) {
        return res.status(400).json({
          message: "Another room already exists with this room number",
        });
      }
    }

    // ✅ COVER IMAGE (path + filename)
    if (req.files?.coverImage?.[0]) {
      if (room.coverImage?.public_id) {
        await deleteFromCloudinary(room.coverImage.public_id);
      }

      room.coverImage = {
        url: req.files.coverImage[0].path || "",
        public_id: req.files.coverImage[0].filename || "",
      };
    }

    // ✅ GALLERY (path + filename)
    if (req.files?.galleryImages?.length > 0) {
      const uploadedGalleryImages = req.files.galleryImages.map((file) => ({
        url: file.path || "",
        public_id: file.filename || "",
      }));

      if (req.body.replaceGallery === "true") {
        if (room.galleryImages.length > 0) {
          await Promise.all(
            room.galleryImages.map(async (img) => {
              if (img.public_id) await deleteFromCloudinary(img.public_id);
            })
          );
        }
        room.galleryImages = uploadedGalleryImages;
      } else {
        room.galleryImages = [...room.galleryImages, ...uploadedGalleryImages];
      }
    }

    room.roomNumber = req.body.roomNumber?.trim() || room.roomNumber;
    room.roomName = req.body.roomName?.trim() || room.roomName;
    room.roomType = req.body.roomType?.trim() || room.roomType;
    room.typeDescription =
      req.body.typeDescription?.trim() || room.typeDescription;

    if (req.body.amenities) {
      room.amenities = req.body.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    room.floor = req.body.floor ? Number(req.body.floor) : room.floor;
    room.capacity = req.body.capacity ? Number(req.body.capacity) : room.capacity;
    room.extraCapability =
      req.body.extraCapability?.trim() || room.extraCapability;
    room.bedNumber = req.body.bedNumber
      ? Number(req.body.bedNumber)
      : room.bedNumber;
    room.bedType = req.body.bedType || room.bedType;
    room.roomSize = req.body.roomSize || room.roomSize;

    room.pricing.basePrice = req.body.basePrice
      ? Number(req.body.basePrice)
      : room.pricing.basePrice;

    room.pricing.weekendPrice = req.body.weekendPrice
      ? Number(req.body.weekendPrice)
      : room.pricing.weekendPrice;

    room.pricing.extraBedCharge = req.body.extraBedCharge
      ? Number(req.body.extraBedCharge)
      : room.pricing.extraBedCharge;

    room.pricing.seasonalRate =
      req.body.seasonalRate || room.pricing.seasonalRate;

    room.pricing.discountPercent = req.body.discountPercent
      ? Number(req.body.discountPercent)
      : room.pricing.discountPercent;

    room.status = req.body.status || room.status;

    if (req.body.isActive !== undefined) {
      room.isActive = req.body.isActive === "true" || req.body.isActive === true;
    }

    room.roomDescription =
      req.body.roomDescription?.trim() || room.roomDescription;
    room.reserveCondition =
      req.body.reserveCondition?.trim() || room.reserveCondition;

    await room.save();

    return res.json({
      message: "Room updated successfully",
      room,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Room update failed",
      error: error.message,
    });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.coverImage?.public_id) {
      await deleteFromCloudinary(room.coverImage.public_id);
    }

    if (room.galleryImages.length > 0) {
      await Promise.all(
        room.galleryImages.map(async (img) => {
          if (img.public_id) await deleteFromCloudinary(img.public_id);
        })
      );
    }

    await room.deleteOne();

    return res.json({ message: "Room deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "Delete failed",
      error: error.message,
    });
  }
};

export const updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.status = status;
    await room.save();

    return res.json({
      message: "Room status updated",
      room,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update room status",
      error: error.message,
    });
  }
};

export const updateRoomActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    room.isActive = isActive;
    await room.save();

    return res.json({
      message: "Room active status updated",
      room,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update room active status",
      error: error.message,
    });
  }
};

export const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      status: "Available",
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.json({
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch available rooms",
      error: error.message,
    });
  }
};