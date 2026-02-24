import express from 'express';
import { createStaff, deleteStaff, getStaff, loginUser, registerUser, updateStaff, updateStaffStatus } from '../Controllers/authController.js';
import { protect } from '../Middlewares/authMiddleware.js';
import { authorizeRoles } from '../Middlewares/roleMiddleware.js';


const authRoutes = express.Router();

authRoutes.post('/register',registerUser);
authRoutes.post('/login',loginUser);
authRoutes.post("/createstaff", protect, authorizeRoles("admin"), createStaff);
authRoutes.get("/staff", protect, authorizeRoles("admin"), getStaff);
authRoutes.put("/staff/:id", protect, authorizeRoles("admin"), updateStaff);
authRoutes.delete("/staff/:id", protect, authorizeRoles("admin"), deleteStaff);
authRoutes.patch("/staff/:id/status",protect,authorizeRoles("admin"),updateStaffStatus);

export default authRoutes;