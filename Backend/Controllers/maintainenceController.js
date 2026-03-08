import MaintenanceRequest from "../Models/maintenanceRequestModel.js";
import Room from "../Models/roomModel.js";
import User from "../Models/userModel.js";
import Reservation from "../Models/reservationModel.js";

const ACTIVE_STATUSES = ["Pending", "Assigned", "In-Progress"];
const CLOSED_STATUSES = ["Completed", "Cancelled"];

const normalizeStatus = (value = "") => {
  const v = String(value).trim().toLowerCase();

  if (v === "pending") return "Pending";
  if (v === "assigned") return "Assigned";
  if (v === "in-progress" || v === "in progress") return "In-Progress";
  if (v === "completed" || v === "complete") return "Completed";
  if (v === "cancelled" || v === "canceled") return "Cancelled";

  return value;
};

const resolveRoomFromPayload = async (roomId, location) => {
  if (roomId) {
    return await Room.findById(roomId);
  }

  const locationText = String(location || "").trim();
  const roomMatch = locationText.match(/^room\s*#?\s*(.+)$/i);

  if (!roomMatch) return null;

  const roomNumber = roomMatch[1].trim();
  if (!roomNumber) return null;

  return await Room.findOne({ roomNumber });
};

const getResolvedRoomStatus = async (roomId) => {
  const activeStay = await Reservation.findOne({
    room: roomId,
    bookingStatus: "Checked-In",
  });

  return activeStay ? "Occupied" : "Available";
};

const canGuestEditOrDelete = (request, userId) => {
  return (
    request?.requestedBy?.toString() === userId?.toString() &&
    request?.status === "Pending" &&
    !request?.assignedTo
  );
};

// POST /api/maintenance/create
export const createMaintenanceRequest = async (req, res) => {
  try {
    const { title, description, location, category, priority, roomId } = req.body;

    if (!title || !description || (!location && !roomId)) {
      return res.status(400).json({ message: "Title, description and location/room are required" });
    }

    const linkedRoom = await resolveRoomFromPayload(roomId, location);
    const finalLocation = linkedRoom ? `Room ${linkedRoom.roomNumber}` : String(location || "").trim();

    const request = await MaintenanceRequest.create({
      title: title.trim(),
      description: description.trim(),
      location: finalLocation,
      room: linkedRoom?._id || null,
      category: category || "Other",
      priority: priority || "Medium",
      requestedBy: req.user._id,
      requestedByRole: req.user.role,
      timeline: [
        {
          status: "Pending",
          note: "Request created",
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      ],
    });

    const populated = await MaintenanceRequest.findById(request._id)
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("room", "roomNumber status");

    res.status(201).json({
      message: "Maintenance request created successfully",
      request: populated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create request" });
  }
};

// GET /api/maintenance/my-requests
export const getMyMaintenanceRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find({ requestedBy: req.user._id })
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("room", "roomNumber status")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch requests" });
  }
};

// GET /api/maintenance/active
export const getActiveMaintenanceRequests = async (req, res) => {
  try {
    const query = {
      status: { $in: ACTIVE_STATUSES },
    };

    if (req.user.role === "maintenance") {
      query.assignedTo = req.user._id;
    }

    const requests = await MaintenanceRequest.find(query)
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("room", "roomNumber status")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch active requests" });
  }
};

// GET /api/maintenance/history
export const getMaintenanceHistory = async (req, res) => {
  try {
    const query = {
      status: { $in: CLOSED_STATUSES },
    };

    if (req.user.role === "guest") {
      query.requestedBy = req.user._id;
    }

    if (req.user.role === "maintenance") {
      query.assignedTo = req.user._id;
    }

    const requests = await MaintenanceRequest.find(query)
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("completedBy", "name email role")
      .populate("cancelledBy", "name email role")
      .populate("room", "roomNumber status")
      .sort({ updatedAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch history" });
  }
};

// GET /api/maintenance/my-tasks
export const getMyAssignedTasks = async (req, res) => {
  try {
    const type = String(req.query.type || "active").toLowerCase();

    const query = {
      assignedTo: req.user._id,
    };

    if (type === "history") {
      query.status = { $in: CLOSED_STATUSES };
    } else {
      query.status = { $in: ACTIVE_STATUSES };
    }

    const requests = await MaintenanceRequest.find(query)
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("completedBy", "name email role")
      .populate("room", "roomNumber status")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch assigned tasks" });
  }
};

// GET /api/maintenance/:id
export const getMaintenanceRequestById = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("completedBy", "name email role")
      .populate("cancelledBy", "name email role")
      .populate("room", "roomNumber status");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (req.user.role === "guest" && request.requestedBy?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "maintenance" && request.assignedTo?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch request" });
  }
};

// PUT /api/maintenance/:id
export const updateMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isGuest = req.user.role === "guest";
    const isStaff = ["admin", "manager", "receptionist"].includes(req.user.role);

    if (isGuest && !canGuestEditOrDelete(request, req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own unassigned pending request" });
    }

    if (!isGuest && !isStaff) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (["Completed", "Cancelled"].includes(request.status)) {
      return res.status(400).json({ message: "Closed request cannot be edited" });
    }

    const { title, description, location, category, priority, roomId } = req.body;

    const linkedRoom = await resolveRoomFromPayload(roomId, location || request.location);
    const finalLocation = linkedRoom ? `Room ${linkedRoom.roomNumber}` : String(location || request.location).trim();

    request.title = title?.trim() || request.title;
    request.description = description?.trim() || request.description;
    request.location = finalLocation;
    request.room = linkedRoom?._id || request.room;
    request.category = category || request.category;
    request.priority = priority || request.priority;

    request.timeline.push({
      status: request.status,
      note: "Request details updated",
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    await request.save();

    const updated = await MaintenanceRequest.findById(request._id)
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("room", "roomNumber status");

    res.json({
      message: "Request updated successfully",
      request: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update request" });
  }
};

// PATCH /api/maintenance/:id/assign
export const assignMaintenanceStaff = async (req, res) => {
  try {
    const { assignedTo, note } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: "assignedTo is required" });
    }

    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (["Completed", "Cancelled"].includes(request.status)) {
      return res.status(400).json({ message: "Closed request cannot be assigned" });
    }

    const staff = await User.findById(assignedTo);
    if (!staff || staff.role !== "maintenance" || !staff.isActive) {
      return res.status(400).json({ message: "Valid maintenance staff is required" });
    }

    if (request.room) {
      const room = await Room.findById(request.room);
      if (room) {
        request.roomStatusBefore = room.status;
        room.status = "Maintenance";
        await room.save();
        request.roomStatusAfter = "Maintenance";
      }
    }

    request.assignedTo = staff._id;
    request.assignedBy = req.user._id;
    request.assignedAt = new Date();

    if (request.status === "Pending") {
      request.status = "Assigned";
    }

    request.timeline.push({
      status: request.status,
      note: note?.trim() || `Assigned to ${staff.name}`,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    await request.save();

    const updated = await MaintenanceRequest.findById(request._id)
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("room", "roomNumber status");

    res.json({
      message: "Maintenance staff assigned successfully",
      request: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to assign staff" });
  }
};

// PATCH /api/maintenance/:id/status
export const updateMaintenanceStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const normalizedStatus = normalizeStatus(status);

    const allowedStatuses = ["Pending", "Assigned", "In-Progress", "Completed", "Cancelled"];
    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (req.user.role === "maintenance") {
      if (!request.assignedTo || request.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Only assigned maintenance staff can update this task" });
      }

      if (!["In-Progress", "Completed"].includes(normalizedStatus)) {
        return res.status(403).json({ message: "Maintenance staff can only mark In-Progress or Completed" });
      }
    }

    request.status = normalizedStatus;

    if (request.room) {
      const room = await Room.findById(request.room);

      if (room) {
        if (["Assigned", "In-Progress"].includes(normalizedStatus)) {
          if (!request.roomStatusBefore) request.roomStatusBefore = room.status;
          room.status = "Maintenance";
          request.roomStatusAfter = "Maintenance";
          await room.save();
        }

        if (["Completed", "Cancelled"].includes(normalizedStatus)) {
          const resolvedStatus = await getResolvedRoomStatus(room._id);
          room.status = resolvedStatus;
          request.roomStatusAfter = resolvedStatus;
          await room.save();
        }
      }
    }

    if (normalizedStatus === "Completed") {
      request.completedAt = new Date();
      request.completedBy = req.user._id;
    }

    if (normalizedStatus === "Cancelled") {
      request.cancelledAt = new Date();
      request.cancelledBy = req.user._id;
    }

    request.timeline.push({
      status: normalizedStatus,
      note: note?.trim() || `Status changed to ${normalizedStatus}`,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    await request.save();

    const updated = await MaintenanceRequest.findById(request._id)
      .populate("requestedBy", "name email role")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("completedBy", "name email role")
      .populate("cancelledBy", "name email role")
      .populate("room", "roomNumber status");

    res.json({
      message: "Maintenance status updated successfully",
      request: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update status" });
  }
};

// DELETE /api/maintenance/:id
export const deleteMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isGuest = req.user.role === "guest";
    const isStaff = ["admin", "manager", "receptionist"].includes(req.user.role);

    if (isGuest && !canGuestEditOrDelete(request, req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own unassigned pending request" });
    }

    if (!isGuest && !isStaff) {
      return res.status(403).json({ message: "Access denied" });
    }

    await request.deleteOne();

    res.json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete request" });
  }
};