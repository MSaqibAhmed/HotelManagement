import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  updateRoomStatus,
  updateRoomActiveStatus,
  getAvailableRooms,
} from "../Controllers/roomController.js";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
import { uploadRoomImages } from "../Middlewares/uploadMiddleware.js";

const RoomRoute = express.Router();

RoomRoute.post("/createroom", protect, authorizeRoles("admin"), uploadRoomImages, createRoom);
RoomRoute.get("/getroom", protect, authorizeRoles("admin", "manager", "receptionist"),getRooms);
RoomRoute.get("/available", protect, authorizeRoles("admin", "manager", "receptionist", "guest"), getAvailableRooms);
RoomRoute.get("/getsingleroom/:id", protect, authorizeRoles("admin", "manager", "receptionist"), getRoomById);
RoomRoute.put("/updateroom/:id", protect, authorizeRoles("admin"), uploadRoomImages, updateRoom);
RoomRoute.delete("/deleteroom/:id", protect, authorizeRoles("admin"), deleteRoom);
RoomRoute.patch("/updatestatus/:id/status", protect, authorizeRoles("admin", "manager", "housekeeping", "maintenance"), updateRoomStatus);
RoomRoute.patch("/updateactivestatus/:id/active-status", protect, authorizeRoles("admin"), updateRoomActiveStatus);

export default RoomRoute;