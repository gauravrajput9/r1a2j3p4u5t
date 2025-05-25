import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, updateUserProfile, getCurrentUser, updateUserAvatar, updateCoverImage } from "../controllers/user.controller.js";
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

router.post("/changePassword",verifyJWT, changeCurrentPassword)

router.post("/updateProfile",verifyJWT, updateUserProfile)

router.get("/getUser", verifyJWT ,getCurrentUser)

router.route("/updateAvatar").post(
  upload.fields(
    [
      {
      name : "avatar",
      maxCount : 1
      }
    ]
  ), updateUserAvatar
)

router
  .route("/update-coverImage")
  .post(upload.single("coverImage"), updateCoverImage);




// router.get("/test", (req, res) => {
//   res.send("Test route working");
// });

export default router;

