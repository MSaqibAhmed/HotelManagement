import mongoose from "mongoose";

const connectDb =async()=>{
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("Database connected successfully")
    }catch(err){
        console.log("Error connecting to database",err)
    }
}

export default connectDb;