import cloudinary from "./cloudinary.js";

export const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;

  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
  });

  return result;
};