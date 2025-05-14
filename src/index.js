// import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config();
const app = express();



//? second method to connect db and env variables
dotenv.config({
    path : "./env",
})
connectDB()
.then(() =>{
    const port = process.env.PORT || 3001;
    app.listen(port, () =>{
        console.log(`🚀 Server is running at: http://localhost:${port}`);
    })
})

// const app = express();

































//? first approch to connect database;;;;;;;;
// (async () => {
//   try {
//     const mongoUri = process.env.MONGO_DB;
//     const port = process.env.PORT || 3000;

//     if (!mongoUri) throw new Error("MONGO_DB URI not defined in environment variables.");

//     await mongoose.connect(mongoUri);
//     console.log("✅ Connected to MongoDB");

//     app.on("error", (error) => {
//       console.error("❌ App error:", error);
//     });

//     app.listen(port, () => {
//       console.log(`🚀 Server is running at: http://localhost:${port}`);
//     });

//   } catch (error) {
//     console.error("❌ Failed to start server:", error);
//   }
// })();
