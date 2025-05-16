import { registerUser } from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount : 1
    },
    {
      name: "coverImage",
      maxCount : 1
    }
  ]),
  registerUser);





// router.get("/test", (req, res) => {
//   res.send("Test route working");
// });

export default router;
