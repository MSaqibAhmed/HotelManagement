import Reservation from "../Models/reservationModel.js";
import HousekeepingRequest from "../Models/housekeepingRequestModel.js";
import Feedback from "../Models/feedbackModel.js";
import MaintenanceRequest from "../Models/maintenanceRequestModel.js";

const getCheckedInReservation = async (guestId) => {
  return await Reservation.findOne({
    guest: guestId,
    bookingStatus: "Checked-In",
  })
    .populate("room")
    .sort({ createdAt: -1 });
};

const normalizeServiceType = (value = "") => {
  const v = String(value).trim().toLowerCase();
  if (v === "housekeeping") return "Housekeeping";
  if (v === "maintenance") return "Maintenance";
  return "";
};

const normalizePriority = (value = "") => {
  const v = String(value).trim().toLowerCase();
  if (v === "low") return "Low";
  if (v === "high") return "High";
  return "Normal";
};

const normalizeMaintenancePriority = (value = "") => {
  const v = String(value).trim().toLowerCase();
  if (v === "low") return "Low";
  if (v === "high") return "High";
  return "Medium";
};

export const getCurrentStayDetails = async (req, res) => {
  try {
    const reservation = await getCheckedInReservation(req.user._id);

    if (!reservation) {
      return res.status(404).json({
        message: "No checked-in reservation found for this guest",
      });
    }

    res.json({
      stay: {
        reservationId: reservation._id,
        reservationNumber: reservation.reservationNumber,
        guest: reservation.guestSnapshot,
        room: {
          id: reservation.room?._id || reservation.room,
          roomNumber:
            reservation.room?.roomNumber || reservation.roomSnapshot?.roomNumber || "",
          roomType:
            reservation.room?.roomType || reservation.roomSnapshot?.roomType || "",
          floor: reservation.room?.floor || reservation.roomSnapshot?.floor || "",
        },
        bookingStatus: reservation.bookingStatus,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch current stay details",
    });
  }
};

export const createGuestServiceRequest = async (req, res) => {
  try {
    const { serviceType, title, description, priority, category } = req.body;

    const finalServiceType = normalizeServiceType(serviceType);

    if (!finalServiceType) {
      return res.status(400).json({
        message: "Valid service type is required",
      });
    }

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    const reservation = await getCheckedInReservation(req.user._id);

    if (!reservation) {
      return res.status(400).json({
        message: "Only checked-in guests can request service",
      });
    }

    const roomId = reservation.room?._id || reservation.room;
    const roomNumber = reservation.room?.roomNumber || reservation.roomSnapshot?.roomNumber || "";
    const roomType = reservation.room?.roomType || reservation.roomSnapshot?.roomType || "";
    const floor = reservation.room?.floor || reservation.roomSnapshot?.floor || 0;
    const roomStatusBefore = reservation.room?.status || "Occupied";

    if (!roomId) {
      return res.status(400).json({
        message: "Room information not found for checked-in reservation",
      });
    }

    const guestSnapshot = {
      name: req.user.name || "",
      email: req.user.email || "",
      phone: req.user.phone || "",
    };

    if (finalServiceType === "Housekeeping") {
      const housekeepingRequest = await HousekeepingRequest.create({
        title: title.trim(),
        description: description.trim(),
        guest: req.user._id,
        guestSnapshot,
        reservation: reservation._id,
        room: roomId,
        roomSnapshot: {
          roomNumber,
          roomType,
          floor,
        },
        location: `Room ${roomNumber}`,
        category: category || "Cleaning",
        priority: normalizePriority(priority),
        status: "Pending",
        roomStatusBefore: roomStatusBefore,
        checklist: Array.isArray(req.body.checklist) ? req.body.checklist.map(item => ({
          label: String(item.label || "").trim(),
          isDone: Boolean(item.isDone)
        })) : [],
        timeline: [
          {
            status: "Pending",
            note: "Housekeeping request created by guest",
            updatedBy: req.user._id,
            updatedAt: new Date(),
          },
        ],
      });

      const populated = await HousekeepingRequest.findById(housekeepingRequest._id)
        .populate("guest", "name email phone role")
        .populate("room", "roomNumber roomType floor status");

      return res.status(201).json({
        message: "Housekeeping request created successfully",
        request: populated,
      });
    }

    const maintenanceRequest = await MaintenanceRequest.create({
      title: title.trim(),
      description: description.trim(),
      location: `Room ${roomNumber}`,
      room: roomId,
      category: category || "Other",
      priority: normalizeMaintenancePriority(priority),
      status: "Pending",
      roomStatusBefore: roomStatusBefore,
      requestedBy: req.user._id,
      requestedByRole: "guest",
      timeline: [
        {
          status: "Pending",
          note: "Maintenance request created by guest",
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      ],
    });

    const populated = await MaintenanceRequest.findById(maintenanceRequest._id)
      .populate("requestedBy", "name email phone role")
      .populate("room", "roomNumber roomType floor status");

    return res.status(201).json({
      message: "Maintenance request created successfully",
      request: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to create service request",
    });
  }
};

export const getMyServiceRequests = async (req, res) => {
  try {
    const housekeepingRequests = await HousekeepingRequest.find({
      guest: req.user._id,
    })
      .populate("assignedTo", "name email role")
      .populate("room", "roomNumber roomType floor status")
      .sort({ createdAt: -1 });

    const maintenanceRequests = await MaintenanceRequest.find({
      requestedBy: req.user._id,
      requestedByRole: "guest",
    })
      .populate("assignedTo", "name email role")
      .populate("room", "roomNumber roomType floor status")
      .sort({ createdAt: -1 });

    const merged = [
      ...housekeepingRequests.map((item) => ({
        _id: item._id,
        requestNumber: item.requestNumber,
        serviceType: "Housekeeping",
        title: item.title,
        description: item.description,
        location: item.location,
        category: item.category,
        priority: item.priority,
        status: item.status,
        assignedTo: item.assignedTo,
        room: item.room,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      ...maintenanceRequests.map((item) => ({
        _id: item._id,
        requestNumber: item.requestNumber,
        serviceType: "Maintenance",
        title: item.title,
        description: item.description,
        location: item.location,
        category: item.category,
        priority: item.priority,
        status: item.status,
        assignedTo: item.assignedTo,
        room: item.room,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ requests: merged });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch service requests",
    });
  }
};

export const cancelMyServiceRequest = async (req, res) => {
  try {
    const { serviceType, id } = req.params;
    const finalType = normalizeServiceType(serviceType);

    if (!finalType) {
      return res.status(400).json({ message: "Invalid service type" });
    }

    if (finalType === "Housekeeping") {
      const request = await HousekeepingRequest.findOne({
        _id: id,
        guest: req.user._id,
      });

      if (!request) {
        return res.status(404).json({ message: "Housekeeping request not found" });
      }

      if (!["Pending", "Assigned"].includes(request.status)) {
        return res.status(400).json({
          message: "Only pending or assigned request can be cancelled",
        });
      }

      request.status = "Cancelled";
      request.cancelledAt = new Date();
      request.timeline.push({
        status: "Cancelled",
        note: "Cancelled by guest",
        updatedBy: req.user._id,
        updatedAt: new Date(),
      });

      await request.save();

      return res.json({
        message: "Housekeeping request cancelled successfully",
      });
    }

    const request = await MaintenanceRequest.findOne({
      _id: id,
      requestedBy: req.user._id,
      requestedByRole: "guest",
    });

    if (!request) {
      return res.status(404).json({ message: "Maintenance request not found" });
    }

    if (!["Pending", "Assigned"].includes(request.status)) {
      return res.status(400).json({
        message: "Only pending or assigned request can be cancelled",
      });
    }

    request.status = "Cancelled";
    request.cancelledAt = new Date();
    request.cancelledBy = req.user._id;
    request.timeline.push({
      status: "Cancelled",
      note: "Cancelled by guest",
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    await request.save();

    res.json({
      message: "Maintenance request cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to cancel service request",
    });
  }
};

export const updateHousekeepingRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["Pending", "Assigned", "In-Progress", "Completed", "Cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await HousekeepingRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: "Housekeeping request not found" });
    }

    res.json({ message: "Status updated", request });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update status" });
  }
};

export const createFeedback = async (req, res) => {
  try {
    const { category, rating, title, message } = req.body;

    if (!rating || !message) {
      return res.status(400).json({
        message: "Rating and message are required",
      });
    }

    const currentReservation = await getCheckedInReservation(req.user._id);

    const feedback = await Feedback.create({
      guest: req.user._id,
      guestSnapshot: {
        name: req.user.name || "",
        email: req.user.email || "",
        phone: req.user.phone || "",
      },
      reservation: currentReservation?._id || null,
      room: currentReservation?.room?._id || currentReservation?.room || null,
      roomSnapshot: {
        roomNumber:
          currentReservation?.room?.roomNumber ||
          currentReservation?.roomSnapshot?.roomNumber ||
          "",
        roomType:
          currentReservation?.room?.roomType ||
          currentReservation?.roomSnapshot?.roomType ||
          "",
      },
      category: category || "Stay",
      rating: Number(rating),
      title: title?.trim() || "",
      message: message.trim(),
      status: "Submitted",
    });

    const populated = await Feedback.findById(feedback._id)
      .populate("reservation", "reservationNumber bookingStatus")
      .populate("room", "roomNumber roomType");

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to submit feedback",
    });
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      guest: req.user._id,
    })
      .populate("reservation", "reservationNumber bookingStatus")
      .populate("room", "roomNumber roomType")
      .sort({ createdAt: -1 });

    res.json({ feedback });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch feedback",
    });
  }
};

export const getMyFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      _id: req.params.id,
      guest: req.user._id,
    })
      .populate("reservation", "reservationNumber bookingStatus")
      .populate("room", "roomNumber roomType");

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    res.json({ feedback });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch feedback details",
    });
  }
};

export const updateMyFeedback = async (req, res) => {
  try {
    const { category, rating, title, message } = req.body;

    const feedback = await Feedback.findOne({
      _id: req.params.id,
      guest: req.user._id,
    });

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    if (feedback.status === "Reviewed") {
      return res.status(400).json({
        message: "Reviewed feedback cannot be updated",
      });
    }

    if (rating) feedback.rating = Number(rating);
    if (category) feedback.category = category;
    if (typeof title === "string") feedback.title = title.trim();
    if (typeof message === "string" && message.trim()) feedback.message = message.trim();

    await feedback.save();

    res.json({
      message: "Feedback updated successfully",
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to update feedback",
    });
  }
};

export const deleteMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      _id: req.params.id,
      guest: req.user._id,
    });

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    if (feedback.status === "Reviewed") {
      return res.status(400).json({
        message: "Reviewed feedback cannot be deleted",
      });
    }

    await feedback.deleteOne();

    res.json({
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to delete feedback",
    });
  }
};

export const getPublicFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({})
      .sort({ rating: -1, createdAt: -1 })
      .limit(6);

    res.json({ feedback });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Failed to fetch public feedback",
    });
  }
};