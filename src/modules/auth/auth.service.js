const autoBind = require("auto-bind");
const UserModel = require("../user/user.model");
const createHttpError = require("http-errors");
const { AuthMessage } = require("./auth.messages");
const { randomInt } = require("crypto");
const jwt = require("jsonwebtoken");
const { sendOtpSms } = require("../auth/sms.service");

class AuthService {
  #model;
  constructor() {
    autoBind(this);
    this.#model = UserModel;
  }

  // 1. ارسال کد تایید
  async sendOTP(mobile) {
    const now = new Date().getTime();
    const code = randomInt(10000, 99999);

    let user = await this.#model.findOne({ mobile });

    if (user?.otp?.expiresIn > now) {
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

    const finalCode = smsResult.code || code;

    // 🔻 لاگ‌ها:
    console.log("✅ user:", finalCode);
    console.log("📱 user mobile :", mobile);
    console.log("📤 is Code By Us ? ", !smsResult.code);

    const otp = {
      code: finalCode,
      expiresIn: now + 1000 * 60 * 2,
    };

    if (!user) {
      user = await this.#model.create({ mobile, otp });
    } else {
      user.otp = otp;
      await user.save();
    }

    return { message: "کد تایید ارسال شد." };
  }

  // 2. بررسی و تایید کد
  async checkOTP(mobile, code) {
    const user = await this.checkExistByMobile(mobile);
    const now = new Date().getTime();

    if (!user.otp || user.otp.expiresIn < now) {
      throw new createHttpError.Unauthorized(AuthMessage.OtpCodeExpired);
    }

    if (user.otp.code != code) {
      throw new createHttpError.Unauthorized(AuthMessage.OtpCodeIsIncorrect);
    }

    user.verifiedMobile = true;

    // ساخت توکن‌ها
    const accessToken = this.signToken({ id: user._id, mobile }, "1d");
    const refreshToken = this.signToken({ id: user._id, mobile }, "1y");

    user.accessToken = accessToken;
    user.refreshToken = refreshToken;

    await user.save();

    return { accessToken, refreshToken };
  }

  // 3. بررسی وجود کاربر با موبایل
  async checkExistByMobile(mobile) {
    const user = await this.#model.findOne({ mobile });
    if (!user) throw new createHttpError.NotFound(AuthMessage.NotFound);
    return user;
  }

  // 4. بررسی RefreshToken و ساخت AccessToken جدید
  async checkRefreshToken(refreshToken) {
    if (!refreshToken)
      throw new createHttpError.Unauthorized("لطفا وارد حساب شوید.");

    const data = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

    const user = await this.#model.findById(data.id);
    if (!user) throw new createHttpError.Unauthorized("کاربر یافت نشد.");

    const accessToken = this.signToken(
      { id: user._id, mobile: user.mobile },
      "1d"
    );
    const newRefreshToken = this.signToken(
      { id: user._id, mobile: user.mobile },
      "1y"
    );

    user.accessToken = accessToken;
    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  // 5. تولید توکن
  signToken(payload, expiresIn = "1y") {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn });
  }
}

module.exports = new AuthService();
