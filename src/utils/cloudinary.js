import dotenv from "dotenv";
dotenv.config(); 
import { v2 as cloudinary } from "cloudinary";

import fs from "fs";


// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

console.log( process.env.CLOUDINARY_API_KEY);

// Upload file to cloudinary
const uploadFile = async (localFilePath) => {
  try {
    if (!fs.existsSync(localFilePath)) {
      throw new Error("File not found at path: " + localFilePath);
    }

    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    console.log("File uploaded successfully:", res.url);

    // Clean up local file
    fs.unlinkSync(localFilePath);

    return res;

  } catch (error) {
    console.error("Cloudinary upload error:", error);
  }
};
 const deleteOldImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error.message);
    return { result: "error", error: error.message };
  }
};
export { uploadFile,deleteOldImage };
