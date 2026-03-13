import express from "express";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
import {createHousekeepingTask,getHousekeepingTasks,getHousekeepingTaskById,assignHousekeepingTask,updateHousekeepingTaskStatus,updateTaskChecklist,submitCleaningReport,verifyHousekeepingTask,getHousekeepingRoomStatus,generateTasksForCleaningRooms,getGuestHousekeepingRequests,} from "../Controllers/housekeepingController.js";
import { updateHousekeepingRequestStatus } from "../Controllers/guestController.js";

const housekeepingRouter = express.Router();
housekeepingRouter.get("/room-status",protect,authorizeRoles("admin", "manager", "receptionist", "housekeeping"),getHousekeepingRoomStatus);

housekeepingRouter.get("/tasks",protect,authorizeRoles("admin", "manager", "receptionist", "housekeeping"),getHousekeepingTasks);

housekeepingRouter.get("/tasks/my",protect,authorizeRoles("housekeeping"),(req, res, next) => {req.query.mine = "true";next();},getHousekeepingTasks);

housekeepingRouter.post("/tasks",protect,authorizeRoles("admin", "manager", "receptionist"),createHousekeepingTask);

housekeepingRouter.post("/tasks/generate-cleaning",protect,authorizeRoles("admin", "manager", "receptionist"),generateTasksForCleaningRooms);

housekeepingRouter.get("/tasks/:id",protect,authorizeRoles("admin", "manager", "receptionist", "housekeeping"),getHousekeepingTaskById);
housekeepingRouter.patch("/tasks/:id/assign",protect,authorizeRoles("admin", "manager", "receptionist"),assignHousekeepingTask);
housekeepingRouter.patch("/tasks/:id/status",protect,authorizeRoles("admin", "manager", "receptionist", "housekeeping"),updateHousekeepingTaskStatus);
housekeepingRouter.patch("/tasks/:id/checklist",protect,authorizeRoles("admin", "manager", "receptionist", "housekeeping"),updateTaskChecklist);
housekeepingRouter.patch("/tasks/:id/report",protect,authorizeRoles("admin", "manager", "receptionist", "housekeeping"),submitCleaningReport);
housekeepingRouter.patch("/tasks/:id/verify",protect,authorizeRoles("admin", "manager", "receptionist"),verifyHousekeepingTask);
housekeepingRouter.get("/guest-requests",protect,authorizeRoles("admin", "manager", "receptionist", "housekeeping"),getGuestHousekeepingRequests);
housekeepingRouter.patch("/guest-requests/:id/status",protect,authorizeRoles("admin", "manager", "receptionist"),updateHousekeepingRequestStatus);

export default housekeepingRouter;