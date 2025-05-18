import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/index.js";
import app from "./app.js";

console.log(process.env.CLOUDINARY_API_KEY)
connectDB()
  .then(() => {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`🚀 Server is running at: http://localhost:${port}`);
    });
  });
