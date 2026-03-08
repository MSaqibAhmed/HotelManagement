import express from 'express';
import "dotenv/config";
import connectDb from "./config/connectDb.js"
import cors from 'cors';
import authRoutes from './Routes/authRoutes.js';
import RoomRoute from './Routes/roomRoutes.js';
import reservationRoutes from './Routes/reservationRoutes.js';
import billingRoutes from './Routes/billingRoutes.js';
import housekeepingRouter from './Routes/housekeepingRoutes.js';
import maintainenceRoutes from './Routes/maintainenceRoutes.js';
import guestRoutes from './Routes/guestRoutes.js';

const app = express();
app.use(cors())

app.use(express.json());

connectDb();

app.use('/api/auth', authRoutes)
app.use('/api/room', RoomRoute)
app.use('/api/reservation',reservationRoutes)
app.use("/api/billing", billingRoutes);
app.use("/api/housekeeping", housekeepingRouter);
app.use("/api/maintenance", maintainenceRoutes);
app.use("/api/guest", guestRoutes);
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})





