import express from 'express';
import connectDb from "./config/connectDb.js"
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './Routes/authRoutes.js';
dotenv.config();

const app = express();
app.use(cors())

app.use(express.json());

connectDb();

app.use('/api/auth',authRoutes)
const PORT = process.env.PORT;

app.listen(PORT,()=>{
    console.log(`Server is running on port http://localhost:${PORT}`);
})





