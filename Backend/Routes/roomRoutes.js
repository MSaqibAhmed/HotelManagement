import express from "express";
import {createRoom,getRooms,getRoomById,updateRoom,deleteRoom,updateRoomStatus,updateRoomActiveStatus,getAvailableRooms,getPublicRooms,} from "../Controllers/roomController.js";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
import { uploadRoomImages } from "../config/cloudinary.js";

const RoomRoute = express.Router();

RoomRoute.post("/createroom",protect,authorizeRoles("admin"),uploadRoomImages,createRoom);
RoomRoute.get("/getroom",protect,authorizeRoles("admin", "manager", "receptionist"),getRooms);
RoomRoute.get("/available",protect,authorizeRoles("admin", "manager", "receptionist", "guest"),getAvailableRooms);
RoomRoute.get("/public/getrooms", getPublicRooms); // Unauthenticated - all active rooms
RoomRoute.get("/public/available", getAvailableRooms); // Unauthenticated route
RoomRoute.get("/public/getsingleroom/:id", getRoomById); // Unauthenticated route
RoomRoute.get("/getsingleroom/:id",protect,authorizeRoles("admin", "manager", "receptionist"),getRoomById);
RoomRoute.put("/updateroom/:id",protect,authorizeRoles("admin"),uploadRoomImages,updateRoom);
RoomRoute.patch("/updatestatus/:id/status",protect,authorizeRoles("admin", "manager", "housekeeping", "maintenance"),updateRoomStatus);
RoomRoute.patch("/updateactivestatus/:id/active-status",protect,authorizeRoles("admin"),updateRoomActiveStatus);
RoomRoute.delete("/deleteroom/:id",protect,authorizeRoles("admin"),deleteRoom);

export default RoomRoute;