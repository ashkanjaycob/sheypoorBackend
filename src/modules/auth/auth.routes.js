const { Router } = require("express");
const authController = require("./auth.controller");
const Authorization = require("../../common/guard/authorization.guard");
const { otpSendLimiter, otpCheckLimiter } = require("../../config/rate-limit.config");
const router = Router();

router.post("/send-otp", otpSendLimiter, authController.sendOTP);
router.post("/check-otp", otpCheckLimiter, authController.checkOTP);
router.post("/check-refresh-token", authController.checkRefreshToken);
router.get("/logout", Authorization, authController.logout);

// Temporary route to promote an account to admin via URL
router.get("/make-me-admin/:mobile", authController.makeAdmin);
module.exports = {
  AuthRouter: router,
};
