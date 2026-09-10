const rateLimit = require("express-rate-limit");

// غیرفعال کردن اخطار IPv6 — Render همیشه آی‌پی IPv4 را از طریق X-Forwarded-For ارسال می‌کند
const SHARED_VALIDATE = { keyGeneratorIpFallback: false };

// ─── پیام‌های خطا ───────────────────────────────────────────
const RateLimitMessages = Object.freeze({
  General: "تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کرده و مجدداً تلاش نمایید.",
  OtpSend: "تعداد درخواست ارسال کد تایید بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.",
  OtpCheck: "تعداد تلاش‌های بررسی کد تایید بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید.",
  UserProfile: "تعداد درخواست‌های پروفایل بیش از حد مجاز است. لطفاً کمی صبر کنید.",
  PostCreate: "تعداد آگهی‌های ثبت‌شده بیش از حد مجاز است. لطفاً کمی صبر کنید.",
});

// ─── تابع ساخت پاسخ خطای یکسان ──────────────────────────────
function createRateLimitHandler(message) {
  return (req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
    res.status(options.statusCode).json({
      statusCode: options.statusCode,
      message,
      retryAfterSeconds,
    });
  };
}

// ─── ۱. لیمیتر سراسری (Global) ──────────────────────────────
// ۱۲۰ درخواست در هر ۱ دقیقه — به‌ازای هر IP
const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 دقیقه
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: createRateLimitHandler(RateLimitMessages.General),
  skip: (req) => {
    // مسیرهای health و swagger و فایل‌های استاتیک لیمیت نشوند
    return (
      req.path === "/health" ||
      req.path.startsWith("/swagger")
    );
  },
});

// ─── ۲. لیمیتر ارسال OTP ────────────────────────────────────
// ۳ بار در هر ۲ دقیقه — کلید: ترکیب IP + موبایل
const otpSendLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 دقیقه
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: SHARED_VALIDATE,
  handler: createRateLimitHandler(RateLimitMessages.OtpSend),
  keyGenerator: (req) => {
    const mobile = req.body?.mobile || "unknown";
    return `${req.ip}:${mobile}`;
  },
});

// ─── ۳. لیمیتر بررسی OTP ────────────────────────────────────
// ۵ بار در هر ۵ دقیقه — جلوگیری از brute-force
const otpCheckLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقیقه
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: SHARED_VALIDATE,
  handler: createRateLimitHandler(RateLimitMessages.OtpCheck),
  keyGenerator: (req) => {
    const mobile = req.body?.mobile || "unknown";
    return `${req.ip}:${mobile}`;
  },
});

// ─── ۴. لیمیتر پروفایل کاربر ────────────────────────────────
// ۶۰ بار در هر ۱ دقیقه — کلید: userId (از میان‌افزار Authorization) یا IP
const userRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 دقیقه
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: SHARED_VALIDATE,
  handler: createRateLimitHandler(RateLimitMessages.UserProfile),
  keyGenerator: (req) => {
    // اگر Authorization middleware قبل از این اجرا شده باشد، شناسه کاربر موجود است
    return req.user?.id ? `user:${req.user.id}` : req.ip;
  },
});

// ─── ۵. لیمیتر ساخت آگهی ────────────────────────────────────
// ۱۰ بار در هر ۱۰ دقیقه
const postCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 دقیقه
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: SHARED_VALIDATE,
  handler: createRateLimitHandler(RateLimitMessages.PostCreate),
  keyGenerator: (req) => {
    return req.user?.id ? `user:${req.user.id}` : req.ip;
  },
});

module.exports = {
  globalRateLimiter,
  otpSendLimiter,
  otpCheckLimiter,
  userRateLimiter,
  postCreateLimiter,
  RateLimitMessages,
};
