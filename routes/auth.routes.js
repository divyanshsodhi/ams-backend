const express = require("express");
const router = express.Router();

const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { registerSchema, loginSchema, refreshTokenSchema, logoutSchema, changePasswordSchema } = require("../validators/auth.validator");
const authController = require("../controllers/auth.controller");

router.post("/register", validate(registerSchema), authController.registerUser);
router.post("/login", validate(loginSchema), authController.loginUser);
router.post("/refresh", validate(refreshTokenSchema), authController.refreshToken);
router.post("/logout", authenticate, validate(logoutSchema), authController.logoutUser);
router.post("/change-password", authenticate, validate(changePasswordSchema), authController.changePassword);
router.get("/me", authenticate, authController.getMe);

module.exports = router;
