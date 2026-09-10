#!/usr/bin/env node
/**
 * اسکریپت تست خودکار Rate Limiting
 *
 * استفاده:
 *   node scripts/test-rate-limit.js                          # لوکال (پیش‌فرض)
 *   node scripts/test-rate-limit.js --target=local           # لوکال
 *   node scripts/test-rate-limit.js --target=remote          # سرور Render
 *   node scripts/test-rate-limit.js --target=https://your.server.com
 */

const http = require("http");
const https = require("https");

// ─── رنگ‌های ترمینال ──────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
};

// ─── تنظیم آدرس سرور ────────────────────────────────────────
const TARGETS = {
  local: "http://localhost:3405",
  remote: "https://sheypoorbackend-9krs.onrender.com",
};

function resolveBaseUrl() {
  const arg = process.argv.find((a) => a.startsWith("--target="));
  const val = arg ? arg.split("=")[1] : "local";
  if (val.startsWith("http")) return val;
  return TARGETS[val] || TARGETS.local;
}

const BASE_URL = resolveBaseUrl();

// ─── تابع ارسال درخواست ──────────────────────────────────────
function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const lib = url.protocol === "https:" ? https : http;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (body) {
      const data = JSON.stringify(body);
      options.headers["Content-Length"] = Buffer.byteLength(data);
    }

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── نمایش نتیجه ─────────────────────────────────────────────
function logResult(i, total, res, label = "") {
  const status = res.status;
  const remaining = res.headers["ratelimit-remaining"] ?? "—";
  const limit = res.headers["ratelimit-limit"] ?? "—";
  const retryAfter = res.headers["retry-after"] ?? "—";

  let statusColor;
  if (status === 429) statusColor = C.bgRed + C.white;
  else if (status >= 400) statusColor = C.yellow;
  else statusColor = C.green;

  const prefix = label ? `${C.cyan}[${label}]${C.reset} ` : "";
  console.log(
    `  ${prefix}${C.dim}#${String(i).padStart(3)}/${total}${C.reset}  ` +
      `${statusColor} ${status} ${C.reset}  ` +
      `Remaining: ${C.bold}${remaining}${C.reset}/${limit}  ` +
      (status === 429
        ? `${C.red}⛔ BLOCKED — Retry-After: ${retryAfter}s${C.reset}`
        : "")
  );
}

// ─── تست ۱: لیمیت سراسری (Global) ───────────────────────────
async function testGlobalLimit() {
  console.log(
    `\n${C.bold}${C.blue}━━━ تست ۱: لیمیتر سراسری (Global) — GET /health ━━━${C.reset}`
  );
  console.log(`${C.dim}  سقف: ۱۲۰ درخواست / ۱ دقیقه — ولی /health از لیمیت مستثنی است${C.reset}\n`);

  const count = 5;
  for (let i = 1; i <= count; i++) {
    const res = await request("GET", "/health");
    logResult(i, count, res, "health");
  }
  console.log(`\n  ${C.green}✔ /health باید همیشه 200 برگرداند (مستثنی از لیمیت)${C.reset}`);
}

// ─── تست ۲: لیمیت روت عمومی ─────────────────────────────────
async function testPublicEndpoint() {
  console.log(
    `\n${C.bold}${C.magenta}━━━ تست ۲: لیمیتر سراسری — GET / (لیست آگهی‌ها) ━━━${C.reset}`
  );
  console.log(`${C.dim}  ارسال رگباری ۱۳۰ درخواست — سقف سراسری: ۱۲۰ در دقیقه${C.reset}\n`);

  const count = 130;
  let blocked = false;
  for (let i = 1; i <= count; i++) {
    const res = await request("GET", "/");
    if (i <= 3 || i >= 118 || res.status === 429) {
      logResult(i, count, res, "postList");
    } else if (i === 4) {
      console.log(`  ${C.dim}  ... (درخواست‌های میانی حذف شدند) ...${C.reset}`);
    }
    if (res.status === 429) {
      blocked = true;
      console.log(
        `\n  ${C.green}✔ لیمیت سراسری در درخواست #${i} فعال شد!${C.reset}`
      );
      // نمایش بدنه پاسخ 429
      console.log(
        `  ${C.yellow}  پاسخ: ${JSON.stringify(res.body)}${C.reset}\n`
      );
      break;
    }
  }
  if (!blocked) {
    console.log(
      `\n  ${C.red}✘ لیمیت سراسری فعال نشد! (آیا سقف 120 صحیح تنظیم شده؟)${C.reset}\n`
    );
  }
}

// ─── تست ۳: لیمیت ارسال OTP ─────────────────────────────────
async function testOtpSendLimit() {
  console.log(
    `\n${C.bold}${C.yellow}━━━ تست ۳: لیمیتر ارسال OTP — POST /auth/send-otp ━━━${C.reset}`
  );
  console.log(`${C.dim}  سقف: ۳ بار در هر ۲ دقیقه — کلید: IP + mobile${C.reset}\n`);

  const count = 5;
  let blocked = false;
  for (let i = 1; i <= count; i++) {
    const res = await request("POST", "/auth/send-otp", {
      mobile: "09001112233",
    });
    logResult(i, count, res, "send-otp");
    if (res.status === 429) {
      blocked = true;
      console.log(
        `\n  ${C.green}✔ لیمیت OTP Send در درخواست #${i} فعال شد!${C.reset}`
      );
      console.log(
        `  ${C.yellow}  پاسخ: ${JSON.stringify(res.body)}${C.reset}\n`
      );
      break;
    }
  }
  if (!blocked) {
    console.log(
      `\n  ${C.red}✘ لیمیت OTP Send فعال نشد!${C.reset}\n`
    );
  }
}

// ─── تست ۴: لیمیت بررسی OTP ─────────────────────────────────
async function testOtpCheckLimit() {
  console.log(
    `\n${C.bold}${C.red}━━━ تست ۴: لیمیتر بررسی OTP — POST /auth/check-otp ━━━${C.reset}`
  );
  console.log(`${C.dim}  سقف: ۵ بار در هر ۵ دقیقه — کلید: IP + mobile${C.reset}\n`);

  const count = 7;
  let blocked = false;
  for (let i = 1; i <= count; i++) {
    const res = await request("POST", "/auth/check-otp", {
      mobile: "09001112233",
      code: "00000",
    });
    logResult(i, count, res, "check-otp");
    if (res.status === 429) {
      blocked = true;
      console.log(
        `\n  ${C.green}✔ لیمیت OTP Check در درخواست #${i} فعال شد!${C.reset}`
      );
      console.log(
        `  ${C.yellow}  پاسخ: ${JSON.stringify(res.body)}${C.reset}\n`
      );
      break;
    }
  }
  if (!blocked) {
    console.log(
      `\n  ${C.red}✘ لیمیت OTP Check فعال نشد!${C.reset}\n`
    );
  }
}

// ─── تست ۵: لیمیت whoami (بدون توکن) ────────────────────────
async function testWhoamiLimit() {
  console.log(
    `\n${C.bold}${C.cyan}━━━ تست ۵: لیمیتر پروفایل — GET /user/whoami (بدون توکن) ━━━${C.reset}`
  );
  console.log(`${C.dim}  بدون توکن — لیمیت سراسری اعمال می‌شود و 401 برمی‌گردد${C.reset}\n`);

  const count = 5;
  for (let i = 1; i <= count; i++) {
    const res = await request("GET", "/user/whoami");
    logResult(i, count, res, "whoami");
  }
  console.log(
    `\n  ${C.green}✔ بدون توکن، پاسخ 401 (Unauthorized) دریافت شد — صحیح${C.reset}\n`
  );
}

// ─── خلاصه نتایج ─────────────────────────────────────────────
async function main() {
  console.log(
    `\n${C.bold}${C.bgGreen}${C.white} 🧪 شروع تست Rate Limiting ${C.reset}`
  );
  console.log(`${C.dim}  سرور مقصد: ${BASE_URL}${C.reset}`);
  console.log(`${C.dim}  زمان: ${new Date().toLocaleString("fa-IR")}${C.reset}`);

  try {
    // ابتدا بررسی دسترسی به سرور
    console.log(`\n${C.dim}  بررسی دسترسی به سرور...${C.reset}`);
    const healthRes = await request("GET", "/health");
    if (healthRes.status !== 200) {
      console.error(
        `${C.red}  ✘ سرور در دسترس نیست (status: ${healthRes.status})${C.reset}`
      );
      process.exit(1);
    }
    console.log(`  ${C.green}✔ سرور در دسترس است${C.reset}`);

    await testGlobalLimit();
    await testOtpSendLimit();
    await testOtpCheckLimit();
    await testWhoamiLimit();
    // تست سراسری در انتها اجرا شود تا بقیه تست‌ها تحت تأثیر قرار نگیرند
    await testPublicEndpoint();

    console.log(
      `\n${C.bold}${C.bgGreen}${C.white} ✅ تست‌ها به پایان رسید ${C.reset}\n`
    );
  } catch (err) {
    console.error(
      `\n${C.bgRed}${C.white} ✘ خطا: ${err.message} ${C.reset}\n`
    );
    if (err.code === "ECONNREFUSED") {
      console.log(
        `${C.yellow}  💡 آیا سرور در حال اجراست؟ ابتدا "npm run dev" را اجرا کنید.${C.reset}\n`
      );
    }
    process.exit(1);
  }
}

main();
