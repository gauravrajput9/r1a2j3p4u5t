import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

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
router.post("/login",loginUser);

router.post("/logout",verifyJWT, logoutUser);

router.post("/refresh-token",refreshAccessToken);




// router.get("/test", (req, res) => {
//   res.send("Test route working");
// });

export default router;

