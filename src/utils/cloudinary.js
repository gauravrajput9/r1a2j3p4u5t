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

export { uploadFile };
