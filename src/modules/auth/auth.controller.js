const { AuthMessage } = require("./auth.messages");
const authService = require("./auth.service");
const autoBind = require("auto-bind");

class AuthController {
  #service;
  constructor() {
    autoBind(this);
    this.#service = authService;
  }

  // 1. ارسال کد تایید
  async sendOTP(req, res, next) {
    try {
      const { mobile } = req.body;
      const result = await this.#service.sendOTP(mobile);
      return res.json({
        message: AuthMessage.SendOtpSuccessfully,
        expiresIn: result.expiresIn,
        // فقط وقتی پنل پیامک تنظیم نشده / حالت تست فعال است
        ...(result.code ? { code: result.code } : {}),
      });
    } catch (error) {
      next(error);
    }
  }

  // 2. بررسی و تایید کد
  async checkOTP(req, res, next) {
    try {
      const { mobile, code } = req.body;
      const { accessToken, refreshToken } = await this.#service.checkOTP(
        mobile,
        code
      );

      return res.status(200).json({
        message: AuthMessage.LoginSuccessfully,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // 3. بررسی توکن و دریافت accessToken جدید
  async checkRefreshToken(req, res, next) {
    try {
      const { refreshToken: token } = req.body;
      const { accessToken, refreshToken } =
        await this.#service.checkRefreshToken(token);
      return res.status(200).json({
        message: AuthMessage.LoginSuccessfully,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // 4. خروج از حساب کاربری
  async logout(req, res, next) {
    try {
      await this.#service.clearToken(req.user.id);
      return res.json({
        message: "logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
