import cloudinary from "./cloudinary.js";

export const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return;
  return cloudinary.uploader.destroy(public_id);
};