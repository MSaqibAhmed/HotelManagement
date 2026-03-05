import Reservation from "../Models/reservationModel.js";
import Room from "../Models/roomModel.js";
import User from "../Models/userModel.js";

const EXTRA_PERSON_CHARGE_PER_NIGHT = 500;

const overlapQuery = (checkInDate, checkOutDate) => ({
  checkInDate: { $lt: new Date(checkOutDate) },
  checkOutDate: { $gt: new Date(checkInDate) },
});

// normalize dates to local midnight to avoid timezone shifting
const toStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const parseDates = (checkInDate, checkOutDate) => {
  const inRaw = new Date(checkInDate);
  const outRaw = new Date(checkOutDate);

  if (Number.isNaN(inRaw.getTime()) || Number.isNaN(outRaw.getTime())) {
    return { ok: false, message: "Invalid check-in/check-out date" };
  }

  const inDate = toStartOfDay(inRaw);
  const outDate = toStartOfDay(outRaw);

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
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  return true;
};

const isStaff = (role) =>
  ["admin", "manager", "receptionist"].includes(String(role || "").toLowerCase());

// ✅ FIXED: future availability should be based on reservations overlap,
// not current room.status (except Maintenance)
const pickAvailableRoom = async ({
  roomType,
  inDate,
  outDate,
  excludeReservationId = null,
}) => {
  const rt = String(roomType || "").trim();

  const match = {
    roomType: rt,
    bookingStatus: { $in: ["Pending", "Confirmed", "Checked-In"] },
    ...overlapQuery(inDate, outDate),
  };

  if (excludeReservationId) match._id = { $ne: excludeReservationId };

  const booked = await Reservation.find(match).select("room");
  const bookedRoomIds = booked.map((r) => r.room);

  return Room.findOne({
    roomType: rt,
    isActive: true,
    status: { $ne: "Maintenance" }, // ✅ was: status: "Available"
    _id: { $nin: bookedRoomIds },
  }).sort({ createdAt: 1 });
};

const sanitizeCounts = (adults, children) => {
  const a = Math.max(1, Number(adults || 1));
  const c = Math.max(0, Number(children || 0));
  return { adults: a, children: c };
};

const computeAmount = ({ room, nights, adults, children }) => {
  const basePrice = Number(room?.pricing?.basePrice || 0);
  const baseAmount = basePrice * nights;

  const capacity = Number(room?.capacity || 1);
  const totalPersons = Number(adults || 1) + Number(children || 0);
  const extraPersons = Math.max(0, totalPersons - capacity);
  const extraCharge = extraPersons * EXTRA_PERSON_CHARGE_PER_NIGHT * nights;

  return {
    basePrice,
    capacity,
    totalPersons,
    extraPersons,
    extraCharge,
    amount: Number(baseAmount + extraCharge),
  };
};

export const previewReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const {
      roomType,
      checkInDate,
      checkOutDate,
      adults = 1,
      children = 0,
    } = req.query;

    if (!roomType || !checkInDate || !checkOutDate) {
      return res
        .status(400)
        .json({ message: "roomType, checkInDate, checkOutDate are required" });
    }

    const d = parseDates(checkInDate, checkOutDate);
    if (!d.ok) return res.status(400).json({ message: d.message });

    const room = await pickAvailableRoom({
      roomType,
      inDate: d.inDate,
      outDate: d.outDate,
    });

    if (!room) return res.status(400).json({ message: "No available room found" });

    const nights = calcNights(d.inDate, d.outDate);
    const counts = sanitizeCounts(adults, children);
    const pricing = computeAmount({
      room,
      nights,
      adults: counts.adults,
      children: counts.children,
    });

    return res.json({
      selectedRoom: {
        _id: room._id,
        roomNumber: room.roomNumber,
        roomName: room.roomName,
        roomType: room.roomType,
        capacity: pricing.capacity,
        basePrice: pricing.basePrice,
      },
      nights,
      totalPersons: pricing.totalPersons,
      extraPersons: pricing.extraPersons,
      extraCharge: pricing.extraCharge,
      amount: pricing.amount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Preview failed", error: error.message });
  }
};

export const createReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const {
      guestId,
      guestEmail,
      roomType,
      checkInDate,
      checkOutDate,
      paymentMethod,
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
      return res.status(400).json({ message: "Invalid paymentMethod" });
    }

    const d = parseDates(checkInDate, checkOutDate);
    if (!d.ok) return res.status(400).json({ message: d.message });

    let finalGuestId = req.user._id;

    // staff booking for a guest
    if (String(req.user.role).toLowerCase() !== "guest") {
      if (guestId) {
        finalGuestId = guestId;
      } else if (guestEmail) {
        const g = await User.findOne({
          email: String(guestEmail).toLowerCase().trim(),
        }).select("-password");

        if (!g) {
          return res
            .status(404)
            .json({ message: "Guest not found. Guest must register first." });
        }
        finalGuestId = g._id;
      } else {
        return res.status(400).json({
          message: "guestId or guestEmail is required for staff booking",
        });
      }
    }

    const guest = await User.findById(finalGuestId).select("-password");
    if (!guest) return res.status(404).json({ message: "Guest not found" });
    if (!guest.isActive)
      return res.status(403).json({ message: "Guest account deactivated" });

    const room = await pickAvailableRoom({
      roomType,
      inDate: d.inDate,
      outDate: d.outDate,
    });

    if (!room) {
      return res
        .status(400)
        .json({ message: "No available room found for selected dates/type" });
    }

    const nights = calcNights(d.inDate, d.outDate);
    const counts = sanitizeCounts(adults, children);
    const pricing = computeAmount({
      room,
      nights,
      adults: counts.adults,
      children: counts.children,
    });

    const reservation = await Reservation.create({
      guest: guest._id,
      guestSnapshot: {
        name: guest.name || "",
        email: guest.email || "",
        phone: guest.phone || "",
      },
      roomType: String(roomType).trim(),
      room: room._id,
      roomSnapshot: {
        roomNumber: room.roomNumber || "",
        roomName: room.roomName || "",
        basePrice: pricing.basePrice,
      },
      checkInDate: d.inDate,
      checkOutDate: d.outDate,
      nights,
      bookingStatus: "Pending",
      payment: {
        method: paymentMethod,
        status: "Pending",
        amount: pricing.amount,
        receipt: { url: "", public_id: "" },
        note: "",
        confirmedBy: null,
        confirmedAt: null,
      },
      guestsCount: { adults: counts.adults, children: counts.children },
      specialRequests: String(specialRequests || ""),
      createdBy: req.user._id,
    });

    return res.status(201).json({
      message: "Reservation created",
      reservation,
      selectedRoom: {
        _id: room._id,
        roomNumber: room.roomNumber,
        roomName: room.roomName,
        roomType: room.roomType,
        capacity: pricing.capacity,
        basePrice: pricing.basePrice,
      },
      nights,
      totalPersons: pricing.totalPersons,
      extraPersons: pricing.extraPersons,
      extraCharge: pricing.extraCharge,
      amount: pricing.amount,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Reservation creation failed", error: error.message });
  }
};

export const getMyReservations = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const reservations = await Reservation.find({ guest: req.user._id })
      .populate("room", "roomNumber roomName roomType pricing status capacity")
      .sort({ createdAt: -1 });

    return res.json({ count: reservations.length, reservations });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch my reservations", error: error.message });
  }
};

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
      .populate("room", "roomNumber roomName roomType pricing status capacity")
      .sort({ createdAt: -1 });

    return res.json({ count: reservations.length, reservations });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch reservations", error: error.message });
  }
};

export const getReservationById = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const reservation = await Reservation.findById(req.params.id)
      .populate("guest", "name email phone role")
      .populate("room", "roomNumber roomName roomType pricing status capacity");

    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    if (
      String(req.user.role).toLowerCase() === "guest" &&
      String(reservation.guest?._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json({ reservation });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch reservation", error: error.message });
  }
};

export const updateReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const { id } = req.params;
    const { roomType, checkInDate, checkOutDate, adults, children, specialRequests, bookingStatus } =
      req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    if (
      String(req.user.role).toLowerCase() === "guest" &&
      String(reservation.guest) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (["Checked-In", "Checked-Out", "Cancelled"].includes(reservation.bookingStatus)) {
      return res.status(400).json({
        message: `Cannot update. Current status: ${reservation.bookingStatus}`,
      });
    }

    const newRoomType = String(roomType || reservation.roomType).trim();
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
      if (!roomDoc)
        return res.status(400).json({
          message: "No available room found for updated dates/type",
        });
      finalRoomId = roomDoc._id;
    } else {
      roomDoc = await Room.findById(finalRoomId);
      if (!roomDoc) return res.status(404).json({ message: "Room not found" });
    }

    const prevAdults = Number(reservation.guestsCount?.adults || 1);
    const prevChildren = Number(reservation.guestsCount?.children || 0);

    const counts = sanitizeCounts(
      adults !== undefined ? adults : prevAdults,
      children !== undefined ? children : prevChildren
    );

    const nights = calcNights(d.inDate, d.outDate);
    const pricing = computeAmount({
      room: roomDoc,
      nights,
      adults: counts.adults,
      children: counts.children,
    });

    reservation.roomType = newRoomType;
    reservation.room = finalRoomId;
    reservation.checkInDate = d.inDate;
    reservation.checkOutDate = d.outDate;
    reservation.nights = nights;

    reservation.roomSnapshot = {
      roomNumber: roomDoc.roomNumber || "",
      roomName: roomDoc.roomName || "",
      basePrice: pricing.basePrice,
    };

    reservation.payment.amount = pricing.amount;
    reservation.guestsCount.adults = counts.adults;
    reservation.guestsCount.children = counts.children;

    if (specialRequests !== undefined) reservation.specialRequests = String(specialRequests || "");

    if (isStaff(req.user.role) && bookingStatus) {
      if (["Pending", "Confirmed", "Cancelled"].includes(bookingStatus)) {
        reservation.bookingStatus = bookingStatus;
      }
    }

    await reservation.save();

    return res.json({
      message: "Reservation updated successfully",
      reservation,
      totalPersons: pricing.totalPersons,
      extraPersons: pricing.extraPersons,
      extraCharge: pricing.extraCharge,
      amount: pricing.amount,
    });
  } catch (error) {
    return res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const { reason = "" } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    if (
      String(req.user.role).toLowerCase() === "guest" &&
      String(reservation.guest) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (["Checked-In", "Checked-Out", "Cancelled"].includes(reservation.bookingStatus)) {
      return res.status(400).json({
        message: `Cannot cancel. Current status: ${reservation.bookingStatus}`,
      });
    }

    reservation.bookingStatus = "Cancelled";
    reservation.cancelReason = String(reason || "");
    reservation.cancelledAt = new Date();

    await reservation.save();

    return res.json({ message: "Reservation cancelled", reservation });
  } catch (error) {
    return res.status(500).json({ message: "Cancel failed", error: error.message });
  }
};

export const checkInReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    if (reservation.bookingStatus !== "Confirmed") {
      return res.status(400).json({
        message: `Cannot check-in. Current status: ${reservation.bookingStatus}`,
      });
    }

    const room = await Room.findById(reservation.room);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (!room.isActive) return res.status(400).json({ message: "Room inactive" });
    if (room.status !== "Available")
      return res.status(400).json({ message: `Room not available: ${room.status}` });

    reservation.bookingStatus = "Checked-In";
    room.status = "Occupied";

    await reservation.save();
    await room.save();

    return res.json({ message: "Checked-in successfully", reservation, room });
  } catch (error) {
    return res.status(500).json({ message: "Check-in failed", error: error.message });
  }
};

export const checkOutReservation = async (req, res) => {
  try {
    if (!ensureAuth(req, res)) return;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ message: "Reservation not found" });

    if (reservation.bookingStatus !== "Checked-In") {
      return res.status(400).json({
        message: `Cannot check-out. Current status: ${reservation.bookingStatus}`,
      });
    }

    const room = await Room.findById(reservation.room);
    if (!room) return res.status(404).json({ message: "Room not found" });

    reservation.bookingStatus = "Checked-Out";
    room.status = "Cleaning";

    await reservation.save();
    await room.save();

    return res.json({ message: "Checked-out successfully", reservation, room });
  } catch (error) {
    return res.status(500).json({ message: "Check-out failed", error: error.message });
  }
};