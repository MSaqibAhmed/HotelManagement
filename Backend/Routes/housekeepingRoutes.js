import express from "express";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
import {
  createHousekeepingTask,
  getHousekeepingTasks,
  getHousekeepingTaskById,
  assignHousekeepingTask,
  updateHousekeepingTaskStatus,
  updateTaskChecklist,
  submitCleaningReport,
  verifyHousekeepingTask,
  getHousekeepingRoomStatus,
  generateTasksForCleaningRooms,
  getGuestHousekeepingRequests,
} from "../Controllers/housekeepingController.js";
import { updateHousekeepingRequestStatus } from "../Controllers/guestController.js";

const housekeepingRouter = express.Router();

// room-status board
housekeepingRouter.get(
  "/room-status",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "housekeeping"),
  getHousekeepingRoomStatus
);

// list tasks
housekeepingRouter.get(
  "/tasks",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "housekeeping"),
  getHousekeepingTasks
);

// get my tasks shortcut
housekeepingRouter.get(
  "/tasks/my",
  protect,
  authorizeRoles("housekeeping"),
  (req, res, next) => {
    req.query.mine = "true";
    next();
  },
  getHousekeepingTasks
);

// create task
housekeepingRouter.post(
  "/tasks",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  createHousekeepingTask
);

// generate tasks for all cleaning rooms
housekeepingRouter.post(
  "/tasks/generate-cleaning",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  generateTasksForCleaningRooms
);

// get single task
housekeepingRouter.get(
  "/tasks/:id",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "housekeeping"),
  getHousekeepingTaskById
);

// assign/reassign
housekeepingRouter.patch(
  "/tasks/:id/assign",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  assignHousekeepingTask
);

// update status
housekeepingRouter.patch(
  "/tasks/:id/status",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "housekeeping"),
  updateHousekeepingTaskStatus
);

// update checklist
housekeepingRouter.patch(
  "/tasks/:id/checklist",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "housekeeping"),
  updateTaskChecklist
);

// submit cleaning report
housekeepingRouter.patch(
  "/tasks/:id/report",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "housekeeping"),
  submitCleaningReport
);

// verify completed task
housekeepingRouter.patch(
  "/tasks/:id/verify",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  verifyHousekeepingTask
);

// get all guest housekeeping requests (for staff assignment)
housekeepingRouter.get(
  "/guest-requests",
  protect,
  authorizeRoles("admin", "manager", "receptionist", "housekeeping"),
  getGuestHousekeepingRequests
);

// update guest housekeeping request status (called from Assign dashboard)
housekeepingRouter.patch(
  "/guest-requests/:id/status",
  protect,
  authorizeRoles("admin", "manager", "receptionist"),
  updateHousekeepingRequestStatus
);

export default housekeepingRouter;