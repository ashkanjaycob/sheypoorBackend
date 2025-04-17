const express = require("express");
const dotenv = require("dotenv");
const SwaggerConfig = require("./src/config/swagger.config");
const mainRouter = require("./src/app.routes");
const NotFoundHandler = require("./src/common/exception/not-found.handler");
const AllExceptionHandler = require("./src/common/exception/all-exception.handler");
const cors = require("cors");

dotenv.config();

async function main() {
  const app = express();

  // پورت دیفالت در صورت نبود .env
  const port = process.env.PORT || 3405;

  // کانفیگ‌های اولیه
  require("./src/config/mongoose.config");

  app.use(
    cors({
      origin: "*",
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));

  app.use((req, res, next) => {
    console.log(`\n🔔 ${req.method} ${req.originalUrl}`);
    console.log("📦 Body:", req.body);
    console.log("🧩 Query:", req.code);
    next();
  });

  // روت‌ها
  app.use(mainRouter);
  SwaggerConfig(app);
  NotFoundHandler(app);
  AllExceptionHandler(app);

  // راه‌اندازی سرور
  app.listen(port, () => {
    console.log(`🚀 Server is running at: http://localhost:${port}`);
  });
}

main();
