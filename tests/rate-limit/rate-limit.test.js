/**
 * تست‌های جامع Rate Limiting
 *
 * این تست‌ها بدون نیاز به دیتابیس اجرا می‌شوند.
 * هر تست یک Express app ایزوله با لیمیتر مربوطه می‌سازد و
 * صحت عملکرد لیمیت‌ها، هدرها و فرمت پاسخ خطا را بررسی می‌کند.
 */

const express = require("express");
const request = require("supertest");

// ─── Fresh import helper ─────────────────────────────────────
// express-rate-limit شمارنده‌ها را در حافظه نگه می‌دارد —
// برای هر تست باید ماژول را از نو بارگذاری کنیم تا شمارنده‌ها ریست شوند.
function freshRequire() {
  // حذف کش ماژول rate-limit.config و express-rate-limit
  Object.keys(require.cache).forEach((key) => {
    if (
      key.includes("rate-limit.config") ||
      key.includes("express-rate-limit")
    ) {
      delete require.cache[key];
    }
  });
  return require("../../src/config/rate-limit.config");
}

// ─── ساخت اپ تست ایزوله ───────────────────────────────────────
function createTestApp(middleware, handler) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(express.json());
  if (Array.isArray(middleware)) {
    middleware.forEach((m) => app.use(m));
  } else if (middleware) {
    app.use(middleware);
  }
  app.all("/test", handler || ((req, res) => res.json({ ok: true })));
  app.get("/health", (req, res) => res.json({ status: "ok" }));
  app.get("/swagger/docs", (req, res) => res.json({ docs: true }));
  return app;
}

// ═════════════════════════════════════════════════════════════════
// ۱. تست‌های ماژول — بررسی ساختار export
// ═════════════════════════════════════════════════════════════════
describe("Rate Limit Config — Module Exports", () => {
  let config;

  beforeAll(() => {
    config = freshRequire();
  });

  test("باید همه لیمیترها را export کند", () => {
    expect(config.globalRateLimiter).toBeDefined();
    expect(config.otpSendLimiter).toBeDefined();
    expect(config.otpCheckLimiter).toBeDefined();
    expect(config.userRateLimiter).toBeDefined();
    expect(config.postCreateLimiter).toBeDefined();
  });

  test("باید پیام‌های خطا را export کند", () => {
    expect(config.RateLimitMessages).toBeDefined();
    expect(config.RateLimitMessages.General).toBeTruthy();
    expect(config.RateLimitMessages.OtpSend).toBeTruthy();
    expect(config.RateLimitMessages.OtpCheck).toBeTruthy();
    expect(config.RateLimitMessages.UserProfile).toBeTruthy();
    expect(config.RateLimitMessages.PostCreate).toBeTruthy();
  });

  test("لیمیترها باید از نوع function باشند (Express middleware)", () => {
    expect(typeof config.globalRateLimiter).toBe("function");
    expect(typeof config.otpSendLimiter).toBe("function");
    expect(typeof config.otpCheckLimiter).toBe("function");
    expect(typeof config.userRateLimiter).toBe("function");
    expect(typeof config.postCreateLimiter).toBe("function");
  });

  test("پیام‌های خطا باید freeze شده باشند (غیرقابل تغییر)", () => {
    expect(Object.isFrozen(config.RateLimitMessages)).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════
// ۲. تست لیمیتر سراسری (Global)
// ═════════════════════════════════════════════════════════════════
describe("Global Rate Limiter", () => {
  let app;

  beforeAll(() => {
    const { globalRateLimiter } = freshRequire();
    app = createTestApp(globalRateLimiter);
  });

  test("باید درخواست‌های معمولی را اجازه دهد و هدر RateLimit ارسال کند", async () => {
    const res = await request(app).get("/test");
    expect(res.status).toBe(200);
    // در draft-7 هدرها ترکیبی هستند: ratelimit: limit=120, remaining=119, reset=60
    expect(res.headers).toHaveProperty("ratelimit");
    expect(res.headers["ratelimit"]).toMatch(/limit=\d+/);
    expect(res.headers["ratelimit"]).toMatch(/remaining=\d+/);
    expect(res.headers["ratelimit"]).toMatch(/reset=\d+/);
    expect(res.headers).toHaveProperty("ratelimit-policy");
  });

  test("باید بعد از رسیدن به سقف (120) کد 429 برگرداند", async () => {
    const { globalRateLimiter } = freshRequire();
    const testApp = createTestApp(globalRateLimiter);

    // ارسال ۱۲۰ درخواست مجاز
    for (let i = 0; i < 120; i++) {
      await request(testApp).get("/test");
    }

    // درخواست ۱۲۱ باید بلاک شود
    const res = await request(testApp).get("/test");
    expect(res.status).toBe(429);
    expect(res.body.statusCode).toBe(429);
    expect(res.body.message).toBeTruthy();
    expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
  });

  test("باید /health را از لیمیت مستثنی کند", async () => {
    const { globalRateLimiter } = freshRequire();
    const testApp = createTestApp(globalRateLimiter);

    // پر کردن سقف لیمیت
    for (let i = 0; i < 120; i++) {
      await request(testApp).get("/test");
    }

    // /health باید هنوز 200 باشد
    const res = await request(testApp).get("/health");
    expect(res.status).toBe(200);
  });

  test("باید /swagger را از لیمیت مستثنی کند", async () => {
    const { globalRateLimiter } = freshRequire();
    const testApp = createTestApp(globalRateLimiter);

    // پر کردن سقف لیمیت
    for (let i = 0; i < 120; i++) {
      await request(testApp).get("/test");
    }

    // /swagger باید هنوز 200 باشد
    const res = await request(testApp).get("/swagger/docs");
    expect(res.status).toBe(200);
  });

  test("نباید هدرهای قدیمی (legacy) ارسال شود", async () => {
    const res = await request(app).get("/test");
    expect(res.headers).not.toHaveProperty("x-ratelimit-limit");
    expect(res.headers).not.toHaveProperty("x-ratelimit-remaining");
  });
});

// ═════════════════════════════════════════════════════════════════
// ۳. تست لیمیتر ارسال OTP
// ═════════════════════════════════════════════════════════════════
describe("OTP Send Limiter", () => {
  test("باید بعد از ۳ درخواست با یک شماره موبایل، بلاک کند", async () => {
    const { otpSendLimiter } = freshRequire();
    const app = createTestApp(otpSendLimiter);

    // ۳ درخواست مجاز
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post("/test")
        .send({ mobile: "09121234567" });
      expect(res.status).toBe(200);
    }

    // درخواست ۴ — باید بلاک شود
    const blocked = await request(app)
      .post("/test")
      .send({ mobile: "09121234567" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.statusCode).toBe(429);
    expect(blocked.body.retryAfterSeconds).toBe(120); // 2 دقیقه
  });

  test("باید شماره‌های مختلف موبایل را جداگانه لیمیت کند", async () => {
    const { otpSendLimiter } = freshRequire();
    const app = createTestApp(otpSendLimiter);

    // ۳ درخواست با شماره اول
    for (let i = 0; i < 3; i++) {
      await request(app).post("/test").send({ mobile: "09111111111" });
    }

    // شماره اول بلاک شده
    const blocked = await request(app)
      .post("/test")
      .send({ mobile: "09111111111" });
    expect(blocked.status).toBe(429);

    // شماره دوم هنوز مجاز است
    const allowed = await request(app)
      .post("/test")
      .send({ mobile: "09222222222" });
    expect(allowed.status).toBe(200);
  });

  test("پاسخ 429 باید حاوی پیام فارسی صحیح باشد", async () => {
    const { otpSendLimiter, RateLimitMessages } = freshRequire();
    const app = createTestApp(otpSendLimiter);

    for (let i = 0; i < 3; i++) {
      await request(app).post("/test").send({ mobile: "09333333333" });
    }

    const res = await request(app)
      .post("/test")
      .send({ mobile: "09333333333" });
    expect(res.body.message).toBe(RateLimitMessages.OtpSend);
  });
});

// ═════════════════════════════════════════════════════════════════
// ۴. تست لیمیتر بررسی OTP (Anti Brute-force)
// ═════════════════════════════════════════════════════════════════
describe("OTP Check Limiter", () => {
  test("باید بعد از ۵ تلاش ناموفق، بلاک کند", async () => {
    const { otpCheckLimiter } = freshRequire();
    const app = createTestApp(otpCheckLimiter);

    // ۵ تلاش مجاز
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/test")
        .send({ mobile: "09121234567", code: "00000" });
      expect(res.status).toBe(200);
    }

    // تلاش ۶ — بلاک
    const blocked = await request(app)
      .post("/test")
      .send({ mobile: "09121234567", code: "00000" });
    expect(blocked.status).toBe(429);
    expect(blocked.body.retryAfterSeconds).toBe(300); // 5 دقیقه
  });

  test("باید شماره‌های مختلف را جداگانه لیمیت کند", async () => {
    const { otpCheckLimiter } = freshRequire();
    const app = createTestApp(otpCheckLimiter);

    // ۵ تلاش با شماره اول
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/test")
        .send({ mobile: "09444444444", code: "11111" });
    }

    // شماره اول بلاک شده
    const blocked = await request(app)
      .post("/test")
      .send({ mobile: "09444444444", code: "11111" });
    expect(blocked.status).toBe(429);

    // شماره دوم مجاز
    const allowed = await request(app)
      .post("/test")
      .send({ mobile: "09555555555", code: "22222" });
    expect(allowed.status).toBe(200);
  });

  test("پاسخ 429 باید حاوی پیام فارسی صحیح باشد", async () => {
    const { otpCheckLimiter, RateLimitMessages } = freshRequire();
    const app = createTestApp(otpCheckLimiter);

    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/test")
        .send({ mobile: "09666666666", code: "33333" });
    }

    const res = await request(app)
      .post("/test")
      .send({ mobile: "09666666666", code: "33333" });
    expect(res.body.message).toBe(RateLimitMessages.OtpCheck);
  });
});

// ═════════════════════════════════════════════════════════════════
// ۵. تست لیمیتر پروفایل کاربر (whoami)
// ═════════════════════════════════════════════════════════════════
describe("User Profile Rate Limiter", () => {
  test("باید بعد از ۶۰ درخواست بلاک کند", async () => {
    const { userRateLimiter } = freshRequire();
    const app = createTestApp(userRateLimiter);

    for (let i = 0; i < 60; i++) {
      await request(app).get("/test");
    }

    const blocked = await request(app).get("/test");
    expect(blocked.status).toBe(429);
    expect(blocked.body.retryAfterSeconds).toBe(60); // 1 دقیقه
  });

  test("باید کاربران مختلف را جداگانه لیمیت کند (بر اساس user.id)", async () => {
    const { userRateLimiter } = freshRequire();

    // شبیه‌سازی Authorization middleware — تزریق req.user
    const mockAuth = (userId) => (req, res, next) => {
      req.user = { id: userId };
      next();
    };

    const app = express();
    app.set("trust proxy", 1);
    app.get(
      "/whoami-a",
      mockAuth(1),
      userRateLimiter,
      (req, res) => res.json({ user: "A" })
    );
    app.get(
      "/whoami-b",
      mockAuth(2),
      userRateLimiter,
      (req, res) => res.json({ user: "B" })
    );

    // پر کردن سقف برای کاربر A
    for (let i = 0; i < 60; i++) {
      await request(app).get("/whoami-a");
    }

    // کاربر A بلاک شده
    const blockedA = await request(app).get("/whoami-a");
    expect(blockedA.status).toBe(429);

    // کاربر B هنوز مجاز
    const allowedB = await request(app).get("/whoami-b");
    expect(allowedB.status).toBe(200);
  });

  test("پاسخ 429 باید حاوی پیام فارسی صحیح باشد", async () => {
    const { userRateLimiter, RateLimitMessages } = freshRequire();
    const app = createTestApp(userRateLimiter);

    for (let i = 0; i < 60; i++) {
      await request(app).get("/test");
    }

    const res = await request(app).get("/test");
    expect(res.body.message).toBe(RateLimitMessages.UserProfile);
  });
});

// ═════════════════════════════════════════════════════════════════
// ۶. تست لیمیتر ساخت آگهی
// ═════════════════════════════════════════════════════════════════
describe("Post Create Rate Limiter", () => {
  test("باید بعد از ۱۰ آگهی بلاک کند", async () => {
    const { postCreateLimiter } = freshRequire();
    const app = createTestApp(postCreateLimiter);

    for (let i = 0; i < 10; i++) {
      const res = await request(app).post("/test").send({});
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post("/test").send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.retryAfterSeconds).toBe(600); // 10 دقیقه
  });

  test("پاسخ 429 باید حاوی پیام فارسی صحیح باشد", async () => {
    const { postCreateLimiter, RateLimitMessages } = freshRequire();
    const app = createTestApp(postCreateLimiter);

    for (let i = 0; i < 10; i++) {
      await request(app).post("/test").send({});
    }

    const res = await request(app).post("/test").send({});
    expect(res.body.message).toBe(RateLimitMessages.PostCreate);
  });
});

// ═════════════════════════════════════════════════════════════════
// ۷. تست فرمت پاسخ خطای 429 (Response Format)
// ═════════════════════════════════════════════════════════════════
describe("429 Response Format — All Limiters", () => {
  const limiterConfigs = [
    { name: "globalRateLimiter", limit: 120, method: "get" },
    { name: "otpSendLimiter", limit: 3, method: "post", body: { mobile: "09770000001" } },
    { name: "otpCheckLimiter", limit: 5, method: "post", body: { mobile: "09770000002", code: "00000" } },
    { name: "userRateLimiter", limit: 60, method: "get" },
    { name: "postCreateLimiter", limit: 10, method: "post", body: {} },
  ];

  test.each(limiterConfigs)(
    "$name — پاسخ 429 باید ساختار استاندارد داشته باشد (statusCode, message, retryAfterSeconds)",
    async ({ name, limit, method, body }) => {
      const config = freshRequire();
      const limiter = config[name];
      const app = createTestApp(limiter);

      // پر کردن سقف
      for (let i = 0; i < limit; i++) {
        if (method === "post") {
          await request(app).post("/test").send(body);
        } else {
          await request(app).get("/test");
        }
      }

      // درخواست بلاک‌شده
      let res;
      if (method === "post") {
        res = await request(app).post("/test").send(body);
      } else {
        res = await request(app).get("/test");
      }

      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty("statusCode", 429);
      expect(res.body).toHaveProperty("message");
      expect(typeof res.body.message).toBe("string");
      expect(res.body.message.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty("retryAfterSeconds");
      expect(typeof res.body.retryAfterSeconds).toBe("number");
      expect(res.body.retryAfterSeconds).toBeGreaterThan(0);
    }
  );
});

// ═════════════════════════════════════════════════════════════════
// ۸. تست هدرهای استاندارد (Standard Headers)
// ═════════════════════════════════════════════════════════════════
describe("Standard Rate Limit Headers (draft-7)", () => {
  test("باید هدرهای RateLimit در پاسخ‌های موفق باشد (فرمت ترکیبی draft-7)", async () => {
    const { otpSendLimiter } = freshRequire();
    const app = createTestApp(otpSendLimiter);

    const res = await request(app)
      .post("/test")
      .send({ mobile: "09880000001" });

    expect(res.status).toBe(200);
    // draft-7: هدر ترکیبی ratelimit و ratelimit-policy
    expect(res.headers["ratelimit"]).toBeDefined();
    expect(res.headers["ratelimit"]).toMatch(/limit=\d+/);
    expect(res.headers["ratelimit"]).toMatch(/remaining=\d+/);
    expect(res.headers["ratelimit-policy"]).toBeDefined();
  });

  test("باید Retry-After در پاسخ 429 باشد", async () => {
    const { otpSendLimiter } = freshRequire();
    const app = createTestApp(otpSendLimiter);

    for (let i = 0; i < 3; i++) {
      await request(app).post("/test").send({ mobile: "09880000002" });
    }

    const res = await request(app)
      .post("/test")
      .send({ mobile: "09880000002" });
    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBeDefined();
  });

  test("RateLimit remaining باید کاهشی باشد", async () => {
    const { otpSendLimiter } = freshRequire();
    const app = createTestApp(otpSendLimiter);

    const res1 = await request(app)
      .post("/test")
      .send({ mobile: "09880000003" });
    const res2 = await request(app)
      .post("/test")
      .send({ mobile: "09880000003" });

    // draft-7: هدر ترکیبی ratelimit حاوی remaining=X
    const extractRemaining = (header) => {
      const match = header.match(/remaining=(\d+)/);
      return match ? parseInt(match[1]) : NaN;
    };

    const remaining1 = extractRemaining(res1.headers["ratelimit"]);
    const remaining2 = extractRemaining(res2.headers["ratelimit"]);

    expect(remaining1).toBeGreaterThan(remaining2);
  });

  test("نباید هدرهای قدیمی (X-RateLimit-*) ارسال شود", async () => {
    const { globalRateLimiter } = freshRequire();
    const app = createTestApp(globalRateLimiter);

    const res = await request(app).get("/test");
    expect(res.headers["x-ratelimit-limit"]).toBeUndefined();
    expect(res.headers["x-ratelimit-remaining"]).toBeUndefined();
    expect(res.headers["x-ratelimit-reset"]).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════
// ۹. تست trust proxy در main.js
// ═════════════════════════════════════════════════════════════════
describe("Trust Proxy Configuration", () => {
  test("فایل main.js باید شامل trust proxy باشد", () => {
    const fs = require("fs");
    const path = require("path");
    const mainContent = fs.readFileSync(
      path.join(__dirname, "../../main.js"),
      "utf-8"
    );
    expect(mainContent).toContain('trust proxy');
    expect(mainContent).toContain('app.set("trust proxy", 1)');
  });

  test("فایل main.js باید globalRateLimiter را import کرده باشد", () => {
    const fs = require("fs");
    const path = require("path");
    const mainContent = fs.readFileSync(
      path.join(__dirname, "../../main.js"),
      "utf-8"
    );
    expect(mainContent).toContain("globalRateLimiter");
    expect(mainContent).toContain("rate-limit.config");
  });
});

// ═════════════════════════════════════════════════════════════════
// ۱۰. تست یکپارچگی روت‌ها (Route Integration)
// ═════════════════════════════════════════════════════════════════
describe("Route Files Integration", () => {
  const fs = require("fs");
  const path = require("path");

  test("auth.routes.js باید otpSendLimiter و otpCheckLimiter را استفاده کند", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../../src/modules/auth/auth.routes.js"),
      "utf-8"
    );
    expect(content).toContain("otpSendLimiter");
    expect(content).toContain("otpCheckLimiter");
    expect(content).toContain("rate-limit.config");
    // باید لیمیتر قبل از کنترلر باشد
    expect(content).toMatch(/send-otp.*otpSendLimiter/s);
    expect(content).toMatch(/check-otp.*otpCheckLimiter/s);
  });

  test("user.routes.js باید userRateLimiter را استفاده کند", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../../src/modules/user/user.routes.js"),
      "utf-8"
    );
    expect(content).toContain("userRateLimiter");
    expect(content).toContain("rate-limit.config");
    // باید بعد از Authorization باشد
    expect(content).toMatch(/Authorization.*userRateLimiter/s);
  });

  test("post.routes.js باید postCreateLimiter را استفاده کند", () => {
    const content = fs.readFileSync(
      path.join(__dirname, "../../src/modules/post/post.routes.js"),
      "utf-8"
    );
    expect(content).toContain("postCreateLimiter");
    expect(content).toContain("rate-limit.config");
  });
});
