import { v2 as cloudinary} from "cloudinary";
import fs from fs;//? perform read and write on files(delete, update etc.)

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD, 
    api_key:  process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadFile = async (localFilePath) =>{
    try {
        const res = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        console.log("file uploaded sccesssfull", res.url);
        return res;
    } catch (error) {
        fs.unlinkSync(localFilePath);//! removes the file from the localHost Server
    }
}

export {uploadFile}