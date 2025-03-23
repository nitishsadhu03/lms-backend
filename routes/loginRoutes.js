const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");

// Login route
router.post("/login", loginController.login);

// Forgot password route
router.post("/forgot-password", loginController.forgotPassword);

// Reset password route
router.post("/reset-password/:token", loginController.resetPassword);


module.exports = router;
