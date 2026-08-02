const { Sequelize } = require("sequelize");
require("dotenv").config();

const isTrue = (value) => String(value).toLowerCase() === "true";

// روی هاست‌های ابری (Aiven / PlanetScale / Railway) معمولا SSL لازم است
const useSsl = isTrue(process.env.DB_SSL);

const commonOptions = {
  dialect: "mysql",
  logging: isTrue(process.env.DB_LOGGING) ? console.log : false,
  define: {
    underscored: true,
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
  },
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: useSsl ? { ssl: { rejectUnauthorized: false } } : {},
};

// اگر DATABASE_URL باشد از آن استفاده می‌کنیم (پروداکشن)، در غیر این صورت متغیرهای جداگانه (لوکال)
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, commonOptions)
  : new Sequelize(
      process.env.MYSQL_DATABASE || "sheypoor",
      process.env.MYSQL_USER || "root",
      process.env.MYSQL_PASSWORD || "",
      {
        host: process.env.MYSQL_HOST || "127.0.0.1",
        port: Number(process.env.MYSQL_PORT || 3306),
        ...commonOptions,
      }
    );

async function connectDB() {
  await sequelize.authenticate();
  console.log("✅ connected to MySQL.");
}

module.exports = { sequelize, connectDB };
