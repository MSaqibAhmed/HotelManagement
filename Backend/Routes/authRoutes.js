import express from 'express';
import { createStaff, loginUser, registerUser } from '../Controllers/authController.js';
import { protect } from '../Middlewares/authMiddleware.js';
import { authorizeRoles } from '../Middlewares/roleMiddleware.js';


const authRoutes = express.Router();

authRoutes.post('/register',registerUser);
authRoutes.post('/login',loginUser);
authRoutes.post("/createstaff", protect, authorizeRoles("admin"), createStaff);

export default authRoutes;