import multer from "multer";
import cloudinaryPkg from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
const { v2: cloudinary } = cloudinaryPkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "hotel-management/receipts",
    allowed_formats: ["jpg", "jpeg", "png", "JPG", "JPEG", "PNG"],
  },
});

export const uploadReceipt = multer({ storage }).single("receipt");
export default cloudinary;