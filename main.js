// ⚠️ باید قبل از هر require دیگری اجرا شود تا متغیرهای محیطی در دسترس باشند
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { connectDB } = require("./src/config/database.config");
const { syncModels } = require("./src/models");
const SwaggerConfig = require("./src/config/swagger.config");
const mainRouter = require("./src/app.routes");
const NotFoundHandler = require("./src/common/exception/not-found.handler");
const AllExceptionHandler = require("./src/common/exception/all-exception.handler");

async function main() {
  const app = express();

  // پورت دیفالت در صورت نبود .env (Render مقدار PORT را خودش ست می‌کند)
  const port = process.env.PORT || 3405;

  // اتصال به دیتابیس و ساخت جداول
  await connectDB();
  await syncModels({ alter: process.env.DB_SYNC_ALTER === "true" });

  app.use(cors({ origin: "*" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));

  app.use((req, res, next) => {
    console.log(`\n🔔 ${req.method} ${req.originalUrl}`);
    console.log("📦 Body:", req.body);
    console.log("🧩 Query:", req.query);
    next();
  });

  // healthcheck برای Render
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  // روت‌ها
  app.use(mainRouter);
  SwaggerConfig(app);
  NotFoundHandler(app);
  AllExceptionHandler(app);

  const otpExposed =
    process.env.OTP_DEBUG_RETURN !== undefined &&
    process.env.OTP_DEBUG_RETURN !== ""
      ? String(process.env.OTP_DEBUG_RETURN).toLowerCase() === "true"
      : !process.env.MELI_TOKEN;

  if (otpExposed) {
    console.warn(
      "⚠️  OTP در پاسخ API برگردانده می‌شود — هرکسی می‌تواند با هر شماره‌ای لاگین کند." +
        (process.env.NODE_ENV === "production"
          ? " این حالت در پروداکشن فعال است!"
          : "")
    );
  }

  app.listen(port, () => {
    console.log(`🚀 Server is running at: http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error("❌ Failed to start the server:", error);
  process.exit(1);
});
