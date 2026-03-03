// Controllers/reservationController.js  (COMPLETE + CLEAN + NO RECEIPT)
// ✅ Includes: preview, create, my/all, single, update, cancel, checkin, checkout
import Reservation from "../Models/reservationModel.js";
import Room from "../Models/roomModel.js";
import User from "../Models/userModel.js";

// ---------- helpers ----------
const overlapQuery = (checkInDate, checkOutDate) => ({
  checkInDate: { $lt: new Date(checkOutDate) },
  checkOutDate: { $gt: new Date(checkInDate) },
});

const parseDates = (checkInDate, checkOutDate) => {
  const inDate = new Date(checkInDate);
  const outDate = new Date(checkOutDate);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    return { ok: false, message: "Invalid check-in/check-out date" };
  }
  if (inDate >= outDate) {
    return { ok: false, message: "checkOutDate must be after checkInDate" };
  }
  return { ok: true, inDate, outDate };
};

const calcNights = (inDate, outDate) => {
  const ms = outDate.getTime() - inDate.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const ensureAuth = (req, res) => {
  if (!req.user || !req.user._id) {
    res.status(401).json({ message: "Unauthorized: token missing/invalid" });
    return false;
  }
  return true;
};

const isStaff = (role) =>
  ["admin", "manager", "receptionist"].includes(String(role || "").toLowerCase());

const pickAvailableRoom = async ({ roomType, inDate, outDate, excludeReservationId = null }) => {
  const match = {
    roomType: roomType.trim(),
    bookingStatus: { $in: ["Pending", "Confirmed", "Checked-In"] },
    ...overlapQuery(inDate, outDate),
  };

  if (excludeReservationId) {
    match._id = { $ne: excludeReservationId };
  }

  const booked = await Reservation.find(match).select("room");
  const bookedRoomIds = booked.map((r) => r.room);

  return Room.findOne({
    roomType: roomType.trim(),
    isActive: true,
    status: "Available",
    _id: { $nin: bookedRoomIds },
  }).sort({ createdAt: 1 });
};

// ---------- controllers ----------

// ✅ Preview
export const previewReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const { roomType, checkInDate, checkOutDate } = req.query;

    if (!roomType || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        message: "roomType, checkInDate, checkOutDate are required",
      });
    }

    const d = parseDates(checkInDate, checkOutDate);
    if (!d.ok) return res.status(400).json({ message: d.message });

    const room = await pickAvailableRoom({ roomType, inDate: d.inDate, outDate: d.outDate });
    if (!room) return res.status(400).json({ message: "No available room found" });

    const nights = calcNights(d.inDate, d.outDate);
    const basePrice = Number(room?.pricing?.basePrice || 0);
    const amount = basePrice * nights;

    return res.json({
      selectedRoom: {
        _id: room._id,
        roomNumber: room.roomNumber,
        roomName: room.roomName,
        roomType: room.roomType,
        basePrice,
      },
      nights,
      amount,
    });
  } catch (error) {
    console.log("PREVIEW RESERVATION ERROR:", error);
    return res.status(500).json({ message: "Preview failed", error: error.message });
  }
};

// ✅ Create (auto room + fixed amount)
export const createReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const {
      guestId, // staff only
      roomType,
      checkInDate,
      checkOutDate,
      paymentMethod, // Cash | Online
      adults = 1,
      children = 0,
      specialRequests = "",
    } = req.body;

    if (!roomType || !checkInDate || !checkOutDate || !paymentMethod) {
      return res.status(400).json({
        message: "roomType, checkInDate, checkOutDate, paymentMethod are required",
      });
    }

    if (!["Cash", "Online"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid paymentMethod (Cash/Online)" });
    }

    const d = parseDates(checkInDate, checkOutDate);
    if (!d.ok) return res.status(400).json({ message: d.message });

    // guest decide
    let finalGuestId = req.user._id;
    if (req.user.role !== "guest") {
      if (!guestId) return res.status(400).json({ message: "guestId is required for staff booking" });
      finalGuestId = guestId;
    }

    const guest = await User.findById(finalGuestId).select("-password");
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    if (!guest.isActive) return res.status(403).json({ message: "Guest account deactivated" });

    // room auto
    const room = await pickAvailableRoom({ roomType, inDate: d.inDate, outDate: d.outDate });
    if (!room) return res.status(400).json({ message: "No available room found for selected dates/type" });

    // amount
    const nights = calcNights(d.inDate, d.outDate);
    const basePrice = Number(room?.pricing?.basePrice || 0);
    const amount = basePrice * nights;

    const reservation = await Reservation.create({
      guest: guest._id,
      guestSnapshot: {
        name: guest.name || "",
        email: guest.email || "",
        phone: guest.phone || "",
      },

      roomType: roomType.trim(),
      room: room._id,
      roomSnapshot: {
        roomNumber: room.roomNumber || "",
        roomName: room.roomName || "",
        basePrice,
      },

      checkInDate: d.inDate,
      checkOutDate: d.outDate,
      nights,

      bookingStatus: "Confirmed",

      payment: {
        method: paymentMethod,
        status: "Pending",
        amount,
        receipt: { url: "", public_id: "" },
        note: "",
        confirmedBy: null,
        confirmedAt: null,
      },

      guestsCount: { adults: Number(adults || 1), children: Number(children || 0) },
      specialRequests: String(specialRequests || ""),
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Reservation created",
      reservation,
      amount,
      selectedRoom: {
        _id: room._id,
        roomNumber: room.roomNumber,
        roomName: room.roomName,
        roomType: room.roomType,
        basePrice,
      },
    });
  } catch (error) {
    console.log("CREATE RESERVATION ERROR:", error);

    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Reservation creation failed", error: error.message });
  }
};

// ✅ Guest: my
export const getMyReservations = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const reservations = await Reservation.find({ guest: req.user._id })
      .populate("room", "roomNumber roomName roomType pricing status")
      .sort({ createdAt: -1 });

    return res.json({ count: reservations.length, reservations });
  } catch (error) {
    console.log("GET MY RESERVATIONS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch my reservations", error: error.message });
  }
};

// ✅ Staff: all (filters)
export const getAllReservations = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const { bookingStatus, paymentStatus, q } = req.query;
    const filter = {};

    if (bookingStatus) filter.bookingStatus = bookingStatus;
    if (paymentStatus) filter["payment.status"] = paymentStatus;

    if (q) {
      const query = String(q).trim();
      filter.$or = [
        { reservationNumber: { $regex: query, $options: "i" } },
        { "guestSnapshot.name": { $regex: query, $options: "i" } },
        { "guestSnapshot.phone": { $regex: query, $options: "i" } },
      ];
    }

    const reservations = await Reservation.find(filter)
      .populate("guest", "name email phone role")
      .populate("room", "roomNumber roomName roomType pricing status")
      .sort({ createdAt: -1 });

    return res.json({ count: reservations.length, reservations });
  } catch (error) {
    console.log("GET ALL RESERVATIONS ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch reservations", error: error.message });
  }
};

// ✅ Single (guest only own)
export const getReservationById = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const reservation = await Reservation.findById(req.params.id)
      .populate("guest", "name email phone role")
      .populate("room", "roomNumber roomName roomType pricing status");

    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (req.user.role === "guest" && String(reservation.guest?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ reservation });
  } catch (error) {
    console.log("GET RESERVATION BY ID ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch reservation", error: error.message });
  }
};

// ✅ UPDATE (guest = own, staff = any) + auto reassign room if roomType/dates changed
export const updateReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const { id } = req.params;
    const {
      roomType,
      checkInDate,
      checkOutDate,
      adults,
      children,
      specialRequests,
      bookingStatus, // staff optional
    } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    // guest only own
    if (req.user.role === "guest" && String(reservation.guest) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // not editable
    if (["Checked-In", "Checked-Out", "Cancelled"].includes(reservation.bookingStatus)) {
      return res.status(400).json({ message: `Cannot update. Current status: ${reservation.bookingStatus}` });
    }

    const newRoomType = (roomType || reservation.roomType).trim();
    const newCheckIn = checkInDate || reservation.checkInDate;
    const newCheckOut = checkOutDate || reservation.checkOutDate;

    const d = parseDates(newCheckIn, newCheckOut);
    if (!d.ok) return res.status(400).json({ message: d.message });

    const roomTypeChanged = newRoomType !== reservation.roomType;
    const datesChanged =
      new Date(d.inDate).getTime() !== new Date(reservation.checkInDate).getTime() ||
      new Date(d.outDate).getTime() !== new Date(reservation.checkOutDate).getTime();

    let roomDoc = null;
    let finalRoomId = reservation.room;

    if (roomTypeChanged || datesChanged) {
      roomDoc = await pickAvailableRoom({
        roomType: newRoomType,
        inDate: d.inDate,
        outDate: d.outDate,
        excludeReservationId: reservation._id,
      });

      if (!roomDoc) {
        return res.status(400).json({ message: "No available room found for updated dates/type" });
      }

      finalRoomId = roomDoc._id;
    } else {
      roomDoc = await Room.findById(finalRoomId);
    }

    const nights = calcNights(d.inDate, d.outDate);
    const basePrice = Number(roomDoc?.pricing?.basePrice || reservation.roomSnapshot?.basePrice || 0);
    const amount = basePrice * nights;

    reservation.roomType = newRoomType;
    reservation.room = finalRoomId;
    reservation.checkInDate = d.inDate;
    reservation.checkOutDate = d.outDate;
    reservation.nights = nights;

    reservation.roomSnapshot = {
      roomNumber: roomDoc?.roomNumber || reservation.roomSnapshot?.roomNumber || "",
      roomName: roomDoc?.roomName || reservation.roomSnapshot?.roomName || "",
      basePrice,
    };

    // fixed amount
    reservation.payment.amount = amount;

    if (adults !== undefined) reservation.guestsCount.adults = Number(adults || 1);
    if (children !== undefined) reservation.guestsCount.children = Number(children || 0);
    if (specialRequests !== undefined) reservation.specialRequests = String(specialRequests || "");

    // staff can change bookingStatus (optional)
    if (isStaff(req.user.role) && bookingStatus) {
      const allowed = ["Pending", "Confirmed", "Cancelled"];
      if (allowed.includes(bookingStatus)) reservation.bookingStatus = bookingStatus;
    }

    await reservation.save();

    return res.json({ message: "Reservation updated successfully", reservation });
  } catch (error) {
    console.log("UPDATE RESERVATION ERROR:", error);
    return res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// ✅ Cancel
export const cancelReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const { reason = "" } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (req.user.role === "guest" && String(reservation.guest) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (["Checked-In", "Checked-Out", "Cancelled"].includes(reservation.bookingStatus)) {
      return res.status(400).json({ message: `Cannot cancel. Current status: ${reservation.bookingStatus}` });
    }

    reservation.bookingStatus = "Cancelled";
    reservation.cancelReason = String(reason || "");
    reservation.cancelledAt = new Date();

    await reservation.save();

    return res.json({ message: "Reservation cancelled", reservation });
  } catch (error) {
    console.log("CANCEL RESERVATION ERROR:", error);
    return res.status(500).json({ message: "Cancel failed", error: error.message });
  }
};

// ✅ Check-in
export const checkInReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (reservation.bookingStatus !== "Confirmed") {
      return res.status(400).json({ message: `Cannot check-in. Current status: ${reservation.bookingStatus}` });
    }

    const room = await Room.findById(reservation.room);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.isActive) return res.status(400).json({ message: "Room inactive" });
    if (room.status !== "Available") return res.status(400).json({ message: `Room not available: ${room.status}` });

    reservation.bookingStatus = "Checked-In";
    room.status = "Occupied";

    await reservation.save();
    await room.save();

    return res.json({ message: "Checked-in successfully", reservation, room });
  } catch (error) {
    console.log("CHECKIN ERROR:", error);
    return res.status(500).json({ message: "Check-in failed", error: error.message });
  }
};

// ✅ Check-out
export const checkOutReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: "Reservation not found" });

    if (reservation.bookingStatus !== "Checked-In") {
      return res.status(400).json({ message: `Cannot check-out. Current status: ${reservation.bookingStatus}` });
    }

    const room = await Room.findById(reservation.room);
    if (!room) return res.status(404).json({ message: "Room not found" });

    reservation.bookingStatus = "Checked-Out";
    room.status = "Cleaning";

    await reservation.save();
    await room.save();

    return res.json({ message: "Checked-out successfully", reservation, room });
  } catch (error) {
    console.log("CHECKOUT ERROR:", error);
    return res.status(500).json({ message: "Check-out failed", error: error.message });
  }
};