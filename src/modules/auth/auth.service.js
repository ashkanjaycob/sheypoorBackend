const autoBind = require("auto-bind");
const createHttpError = require("http-errors");
const { randomInt } = require("crypto");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../../models");
const { AuthMessage } = require("./auth.messages");
const { sendOtpSms } = require("../auth/sms.service");

/**
 * آیا کد تایید در پاسخ API برگردانده شود؟
 * - اگر OTP_DEBUG_RETURN صراحتا ست شده باشد، همان تعیین‌کننده است.
 * - در غیر این صورت: وقتی سرویس پیامک تنظیم نشده، بدون برگرداندن کد
 *   اصلا ورود به سیستم ممکن نیست، پس برگردانده می‌شود.
 */
const shouldExposeOtp = () => {
  const flag = process.env.OTP_DEBUG_RETURN;
  if (flag !== undefined && flag !== "") {
    return String(flag).toLowerCase() === "true";
  }
  return !process.env.MELI_TOKEN;
};

class AuthService {
  #model;
  constructor() {
    autoBind(this);
    this.#model = UserModel;
  }

  // 1. ارسال کد تایید
  async sendOTP(mobile) {
    if (!mobile) {
      throw new createHttpError.BadRequest("شماره موبایل الزامی است.");
    }

    const now = new Date().getTime();
    const code = randomInt(10000, 99999);

    let user = await this.#model.findOne({ where: { mobile } });

    if (user && Number(user.otpExpiresIn) > now) {
      throw new createHttpError.BadRequest(AuthMessage.OtpCodeNotExpired);
    }

    let smsResult;
    try {
      smsResult = await sendOtpSms(mobile, code);
    } catch (err) {
      console.error("خطا در ارسال پیامک:", err);
      throw new createHttpError.InternalServerError(
        "ارسال پیامک با خطا مواجه شد."
      );
    }

    const finalCode = String(smsResult?.code || code);

    console.log("✅ code:", finalCode);
    console.log("📱 user mobile :", mobile);
    console.log("📤 is Code By Us ? ", !smsResult?.code);

    const otpCode = finalCode;
    const otpExpiresIn = now + 1000 * 60 * 2;

    if (!user) {
      user = await this.#model.create({ mobile, otpCode, otpExpiresIn });
    } else {
      user.otpCode = otpCode;
      user.otpExpiresIn = otpExpiresIn;
      await user.save();
    }

    return {
      message: "کد تایید ارسال شد.",
      // در حالت MVP بدون پنل پیامک، کد مستقیما به فرانت برگردانده می‌شود
      code: shouldExposeOtp() ? String(finalCode) : undefined,
      expiresIn: otpExpiresIn,
    };
  }

  // 2. بررسی و تایید کد
  async checkOTP(mobile, code) {
    const user = await this.checkExistByMobile(mobile);
    const now = new Date().getTime();

    if (!user.otpCode || Number(user.otpExpiresIn) < now) {
      throw new createHttpError.Unauthorized(AuthMessage.OtpCodeExpired);
    }

    if (String(user.otpCode) !== String(code)) {
      throw new createHttpError.Unauthorized(AuthMessage.OtpCodeIsIncorrect);
    }

    user.verifiedMobile = true;

    const payload = { id: user.id, mobile, role: user.role };
    const accessToken = this.signToken(payload, "1d");
    const refreshToken = this.signToken(payload, "1y");

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    // کد مصرف‌شده باید باطل شود تا دوباره قابل استفاده نباشد
    user.otpCode = null;
    user.otpExpiresIn = 0;

    await user.save();

    return { accessToken, refreshToken };
  }

  // 3. بررسی وجود کاربر با موبایل
  async checkExistByMobile(mobile) {
    const user = await this.#model.findOne({ where: { mobile } });
    if (!user) throw new createHttpError.NotFound(AuthMessage.NotFound);
    return user;
  }

  // 4. بررسی RefreshToken و ساخت AccessToken جدید
  async checkRefreshToken(refreshToken) {
    if (!refreshToken)
      throw new createHttpError.Unauthorized("لطفا وارد حساب شوید.");

    let data;
    try {
      data = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
    } catch (error) {
      throw new createHttpError.Unauthorized("توکن نامعتبر است.");
    }

    const user = await this.#model.findByPk(data.id);
    if (!user) throw new createHttpError.Unauthorized("کاربر یافت نشد.");

    const payload = { id: user.id, mobile: user.mobile, role: user.role };
    const accessToken = this.signToken(payload, "1d");
    const newRefreshToken = this.signToken(payload, "1y");

    user.accessToken = accessToken;
    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  // 5. تولید توکن
  signToken(payload, expiresIn = "1y") {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });
  }

  // 6. پاک کردن توکن‌ها
  async clearToken(userId) {
    const user = await this.#model.findByPk(userId);
    if (!user) throw new createHttpError.NotFound(AuthMessage.NotFound);

    user.accessToken = null;
    user.refreshToken = null;
    await user.save();

    return true;
  }
  // 7. ارتقا موقت به ادمین
  async makeAdmin(mobile) {
    const user = await this.#model.findOne({ where: { mobile } });
    if (!user) {
      // اگر کاربر وجود ندارد، آن را می‌سازیم
      await this.#model.create({
        mobile,
        role: "ADMIN",
        verifiedMobile: true,
      });
      return true;
    }
    user.role = "ADMIN";
    await user.save();
    return true;
  }
}

module.exports = new AuthService();
