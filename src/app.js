import cookieParser from "cookie-parser";
import router from "./routes/user.routes.js";
import express from "express"

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());


app.use("/api/v2/user", router);

export default app;