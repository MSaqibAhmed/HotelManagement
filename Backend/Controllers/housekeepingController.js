import mongoose from "mongoose";
import HousekeepingTask from "../Models/housekeepingModel.js";
import Room from "../Models/roomModel.js";
import User from "../Models/userModel.js";
import Reservation from "../Models/reservationModel.js";
import HousekeepingRequest from "../Models/housekeepingRequestModel.js";

const isStaffRole = (role = "") =>
  ["admin", "manager", "receptionist", "housekeeping"].includes(String(role).toLowerCase());

const canManageTasks = (role = "") =>
  ["admin", "manager", "receptionist"].includes(String(role).toLowerCase());

const defaultChecklist = [
  { label: "Bedsheet changed", isDone: false },
  { label: "Washroom cleaned", isDone: false },
  { label: "Floor cleaned", isDone: false },
  { label: "Dusting completed", isDone: false },
  { label: "Amenities restocked", isDone: false },
  { label: "Towels replaced", isDone: false },
];
export const createHousekeepingTask = async (req, res) => {
  try {
    const {
      roomId,
      reservationId,
      assignedTo,
      taskType,
      priority,
      note,
      checklist,
    } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room is required" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    let assignedUser = null;
    if (assignedTo) {
      assignedUser = await User.findById(assignedTo);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned housekeeping staff not found" });
      }

      if (assignedUser.role !== "housekeeping") {
        return res.status(400).json({ message: "Only housekeeping staff can be assigned" });
      }

      if (!assignedUser.isActive) {
        return res.status(400).json({ message: "Assigned staff account is inactive" });
      }
    }

    let reservation = null;
    if (reservationId) {
      reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
    }

    const activeTask = await HousekeepingTask.findOne({
      room: room._id,
      status: { $in: ["Pending", "Assigned", "InProgress"] },
      isActive: true,
    });

    if (activeTask) {
      return res.status(400).json({
        message: "An active housekeeping task already exists for this room",
      });
    }

    const task = await HousekeepingTask.create({
      room: room._id,
      roomSnapshot: {
        roomNumber: room.roomNumber || "",
        roomName: room.roomName || "",
        roomType: room.roomType || "",
        floor: room.floor || 0,
      },
      reservation: reservation?._id || null,
      assignedTo: assignedUser?._id || null,
      assignedBy: req.user._id,
      taskType: taskType || "CheckoutCleaning",
      priority: priority,
      note: note || "",
      status: assignedUser ? "Assigned" : "Pending",
      roomStatusBefore: room.status,
      checklist:
        Array.isArray(checklist) && checklist.length
          ? checklist.map((item) => ({
            label: String(item.label || "").trim(),
            isDone: Boolean(item.isDone),
          }))
          : defaultChecklist,
    });

    if (room.status !== "Cleaning") {
      await Room.findByIdAndUpdate(room._id, { status: "Cleaning" }, { runValidators: false });
    }

    const populatedTask = await HousekeepingTask.findById(task._id)
      .populate("room", "roomNumber roomName roomType floor status")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role");

    return res.status(201).json({
      message: "Housekeeping task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create housekeeping task",
      error: error.stack || error.message,
    });
  }
};

// GET ALL / FILTERED TASKS
export const getHousekeepingTasks = async (req, res) => {
  try {
    const {
      status,
      taskType,
      priority,
      roomId,
      assignedTo,
      search,
      mine,
    } = req.query;


    const query = { isActive: true };

    if (status) query.status = status;
    if (taskType) query.taskType = taskType;
    if (priority) query.priority = priority;
    if (roomId && mongoose.Types.ObjectId.isValid(roomId)) query.room = roomId;
    if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) query.assignedTo = assignedTo;

    const role = String(req.user?.role || "").toLowerCase();

    if (role === "housekeeping" || mine === "true") {
      query.assignedTo = req.user._id;
    }

    let tasks = await HousekeepingTask.find(query)
      .populate("room", "roomNumber roomName roomType floor status isActive")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("verifiedBy", "name email role")
      .sort({ createdAt: -1 });

    if (search) {
      const searchText = String(search).toLowerCase().trim();
      tasks = tasks.filter((task) => {
        const roomNumber = String(task?.room?.roomNumber || task?.roomSnapshot?.roomNumber || "").toLowerCase();
        const roomTypeValue = String(task?.room?.roomType || task?.roomSnapshot?.roomType || "").toLowerCase();
        const taskNumber = String(task?.taskNumber || "").toLowerCase();
        return (
          roomNumber.includes(searchText) ||
          roomTypeValue.includes(searchText) ||
          taskNumber.includes(searchText)
        );
      });
    }

    return res.status(200).json({
      message: "Housekeeping tasks fetched successfully",
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch housekeeping tasks",
      error: error.message,
    });
  }
};

// GET SINGLE TASK
export const getHousekeepingTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await HousekeepingTask.findById(id)
      .populate("room", "roomNumber roomName roomType floor status isActive")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("verifiedBy", "name email role")
      .populate("reservation");

    if (!task) {
      return res.status(404).json({ message: "Housekeeping task not found" });
    }

    const role = String(req.user?.role || "").toLowerCase();
    if (role === "housekeeping" && String(task.assignedTo?._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      message: "Task fetched successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};

// ASSIGN / REASSIGN TASK
export const assignHousekeepingTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, priority, note } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: "assignedTo is required" });
    }

    const task = await HousekeepingTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Housekeeping task not found" });
    }

    const staff = await User.findById(assignedTo);
    if (!staff) {
      return res.status(404).json({ message: "Housekeeping staff not found" });
    }

    if (staff.role !== "housekeeping") {
      return res.status(400).json({ message: "Only housekeeping staff can be assigned" });
    }

    if (!staff.isActive) {
      return res.status(400).json({ message: "Assigned staff account is inactive" });
    }

    task.assignedTo = staff._id;
    task.priority = priority || task.priority;
    task.note = note ?? task.note;
    task.status = task.status === "Pending" ? "Assigned" : task.status;

    await task.save();

    const populatedTask = await HousekeepingTask.findById(task._id)
      .populate("room", "roomNumber roomName roomType floor status")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role");

    return res.status(200).json({
      message: "Task assigned successfully",
      task: populatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to assign task",
      error: error.message,
    });
  }
};

// UPDATE TASK STATUS
export const updateHousekeepingTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowedStatuses = [
      "Pending",
      "Assigned",
      "InProgress",
      "Completed",
      "Verified",
      "IssueReported",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await HousekeepingTask.findById(id).populate("room");
    if (!task) {
      return res.status(404).json({ message: "Housekeeping task not found" });
    }

    const role = String(req.user?.role || "").toLowerCase();

    if (role === "housekeeping" && String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only update your own task" });
    }

    task.status = status;
    if (note !== undefined) task.note = note;

    if (status === "InProgress" && !task.startedAt) {
      task.startedAt = new Date();
    }

    if (status === "Completed") {
      task.completedAt = new Date();
      // Restore room status on completion
      if (task.room && task.room._id) {
        const roomToRestore = await Room.findById(task.room._id || task.room);
        if (roomToRestore) {
          const activeReservation = await Reservation.findOne({
            room: roomToRestore._id,
            bookingStatus: "Checked-In",
          });
          const restoredStatus = activeReservation ? "Occupied" : "Available";
          task.roomStatusAfter = restoredStatus;
          await Room.findByIdAndUpdate(roomToRestore._id, { status: restoredStatus }, { runValidators: false });
        }
      }
    }

    if (status === "Cancelled") {
      task.isActive = false;
      // Also restore room on cancel
      if (task.room) {
        const roomToRestore = await Room.findById(task.room._id || task.room);
        if (roomToRestore && roomToRestore.status === "Cleaning") {
          const activeReservation = await Reservation.findOne({
            room: roomToRestore._id,
            bookingStatus: "Checked-In",
          });
          const resolvedStatus = activeReservation ? "Occupied" : "Available";
          await Room.findByIdAndUpdate(roomToRestore._id, { status: resolvedStatus }, { runValidators: false });
        }
      }
    }

    if (status === "IssueReported") {
      task.issue.hasIssue = true;
      if (task.room) {
        await Room.findByIdAndUpdate(task.room._id || task.room, { status: "Maintenance" }, { runValidators: false });
      }
    }

    await task.save();

    const updatedTask = await HousekeepingTask.findById(task._id)
      .populate("room", "roomNumber roomName roomType floor status")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("verifiedBy", "name email role");

    return res.status(200).json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

// UPDATE CHECKLIST
export const updateTaskChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;

    if (!Array.isArray(checklist)) {
      return res.status(400).json({ message: "Checklist must be an array" });
    }

    const task = await HousekeepingTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Housekeeping task not found" });
    }

    const role = String(req.user?.role || "").toLowerCase();
    if (role === "housekeeping" && String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only update your own task checklist" });
    }

    task.checklist = checklist.map((item) => ({
      label: String(item.label || "").trim(),
      isDone: Boolean(item.isDone),
    }));

    await task.save();

    return res.status(200).json({
      message: "Checklist updated successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update checklist",
      error: error.message,
    });
  }
};

// SUBMIT CLEANING REPORT
export const submitCleaningReport = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      summary,
      linenChanged,
      washroomCleaned,
      floorCleaned,
      amenitiesRestocked,
      minibarChecked,
      damageFound,
      damageNote,
      lostAndFound,
      lostAndFoundNote,
      issueType,
      issueDescription,
      markIssueReported,
      checklist,
    } = req.body;

    const task = await HousekeepingTask.findById(id).populate("room");
    if (!task) {
      return res.status(404).json({ message: "Housekeeping task not found" });
    }

    const role = String(req.user?.role || "").toLowerCase();
    if (role === "housekeeping" && String(task.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only submit your own task report" });
    }

    task.report = {
      summary: summary || "",
      linenChanged: Boolean(linenChanged),
      washroomCleaned: Boolean(washroomCleaned),
      floorCleaned: Boolean(floorCleaned),
      amenitiesRestocked: Boolean(amenitiesRestocked),
      minibarChecked: Boolean(minibarChecked),
      damageFound: Boolean(damageFound),
      damageNote: damageNote || "",
      lostAndFound: Boolean(lostAndFound),
      lostAndFoundNote: lostAndFoundNote || "",
    };

    if (Array.isArray(checklist)) {
      task.checklist = checklist.map((item) => ({
        label: String(item.label || "").trim(),
        isDone: Boolean(item.isDone),
      }));
    }

    if (markIssueReported) {
      task.status = "IssueReported";
      task.issue = {
        hasIssue: true,
        issueType: issueType || "",
        description: issueDescription || damageNote || "",
      };

      if (task.room) {
        task.room.status = "Maintenance";
        await task.room.save();
      }
    } else {
      task.status = "Completed";
      task.completedAt = new Date();

      if (task.room) {
        const activeReservation = await Reservation.findOne({
          room: task.room._id,
          bookingStatus: "Checked-In",
        });
        const restoredStatus = activeReservation ? "Occupied" : "Available";
        task.roomStatusAfter = restoredStatus;
        task.room.status = restoredStatus;
        await task.room.save();
      }
    }

    await task.save();

    return res.status(200).json({
      message: "Cleaning report submitted successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to submit cleaning report",
      error: error.message,
    });
  }
};

export const verifyHousekeepingTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const task = await HousekeepingTask.findById(id).populate("room");
    if (!task) {
      return res.status(404).json({ message: "Housekeeping task not found" });
    }

    if (!["Completed", "IssueReported"].includes(task.status)) {
      return res.status(400).json({
        message: "Only completed or issue-reported tasks can be verified",
      });
    }

    task.verifiedBy = req.user._id;
    task.verifiedAt = new Date();
    task.note = note ?? task.note;

    if (task.status === "Completed") {
      task.status = "Verified";
      task.isActive = false;

      if (task.room) {
        task.room.status = task.roomStatusBefore || "Available";
        task.roomStatusAfter = task.room.status;
        await task.room.save();
      }
    }

    await task.save();

    const updatedTask = await HousekeepingTask.findById(task._id)
      .populate("room", "roomNumber roomName roomType floor status")
      .populate("assignedTo", "name email role")
      .populate("assignedBy", "name email role")
      .populate("verifiedBy", "name email role");

    return res.status(200).json({
      message: "Task verified successfully",
      task: updatedTask,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to verify housekeeping task",
      error: error.message,
    });
  }
};

// ROOM STATUS BOARD
export const getHousekeepingRoomStatus = async (req, res) => {
  try {
    const rooms = await Room.find({
      status: { $in: ["Cleaning", "Maintenance", "Occupied", "Available"] },
      isActive: true,
    }).sort({ floor: 1, roomNumber: 1 });

    const activeTasks = await HousekeepingTask.find({
      isActive: true,
      status: { $in: ["Pending", "Assigned", "InProgress", "Completed", "IssueReported"] },
    })
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    const activeRequests = await HousekeepingRequest.find({
      status: "Pending",
      assignedTo: null
    }).sort({ createdAt: -1 });

    const mapped = rooms.map((room) => {
      const task = activeTasks.find(
        (item) => String(item.room) === String(room._id)
      );

      const request = activeRequests.find(
        (item) => String(item.room) === String(room._id)
      );

      return {
        room,
        housekeepingTask: task || null,
        guestRequest: request || null,
      };
    });

    return res.status(200).json({
      message: "Housekeeping room status fetched successfully",
      count: mapped.length,
      rooms: mapped,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch room status board",
      error: error.message,
    });
  }
};

// GET ALL GUEST HOUSEKEEPING REQUESTS (for staff/admin)
export const getGuestHousekeepingRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ["Pending", "Assigned", "In-Progress"] };
    }

    const requests = await HousekeepingRequest.find(query)
      .populate("guest", "name email phone")
      .populate("room", "roomNumber roomType floor status")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Guest housekeeping requests fetched successfully",
      count: requests.length,
      requests,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch guest housekeeping requests",
      error: error.message,
    });
  }
};

// AUTO CREATE TASK FROM CLEANING ROOMS
export const generateTasksForCleaningRooms = async (req, res) => {
  try {
    const cleaningRooms = await Room.find({
      status: "Cleaning",
      isActive: true,
    });

    let createdCount = 0;
    const createdTasks = [];

    for (const room of cleaningRooms) {
      const existing = await HousekeepingTask.findOne({
        room: room._id,
        status: { $in: ["Pending", "Assigned", "InProgress"] },
        isActive: true,
      });

      if (existing) continue;

      const task = await HousekeepingTask.create({
        room: room._id,
        roomSnapshot: {
          roomNumber: room.roomNumber || "",
          roomName: room.roomName || "",
          roomType: room.roomType || "",
          floor: room.floor || 0,
        },
        assignedBy: req.user._id,
        taskType: "CheckoutCleaning",
        priority: "Medium",
        status: "Pending",
        roomStatusBefore: room.status,
        checklist: defaultChecklist,
      });

      createdCount += 1;
      createdTasks.push(task);
    }

    return res.status(201).json({
      message: "Tasks generated successfully",
      createdCount,
      tasks: createdTasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate housekeeping tasks",
      error: error.message,
    });
  }
};