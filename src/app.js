import router from "./routes/user.routes.js";
import express from "express"

const app = express();
app.use(express.json());


app.use("/api/v2/user", router);

export default app;