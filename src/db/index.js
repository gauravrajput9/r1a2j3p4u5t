import mongoose from "mongoose";

const connectDB = async () =>{
   try {
    const mongoUri = process.env.MONGO_DB
    const connect = await mongoose.connect(mongoUri);
    console.log(`connected!! , Db HOST: ${connect.connection.host}`)
   } catch (error) {
    console.log("database connection error: ",error);
   }
}

export default connectDB;