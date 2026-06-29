const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
} = require("../controllers/auth");

const { authenticate } = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", authenticate, logoutUser);
router.get("/me", authenticate, getMe);

module.exports = router;
