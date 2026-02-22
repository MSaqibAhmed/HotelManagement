import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone:{
        type:String,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    department:{
        type: String
    },
    role: {
        type: String,
        enum: [
            "guest",
            "admin",
            "manager",
            "receptionist",
            "housekeeping",
            "maintenance",
        ],
        default: "guest",
    },
    isActive:{
            type: Boolean,
            default: true
        }
},{ timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;