import express from 'express';
import connectDb from "./config/connectDb.js"
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './Routes/authRoutes.js';
import RoomRoute from './Routes/roomRoutes.js';
dotenv.config();

const app = express();
app.use(cors())

app.use(express.json());

connectDb();

app.use('/api/auth',authRoutes)
app.use('/api/room',RoomRoute)
const PORT = process.env.PORT;

app.listen(PORT,()=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
})





