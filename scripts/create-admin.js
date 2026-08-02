require("dotenv").config();

const jwt = require("jsonwebtoken");
const { connectDB } = require("../src/config/database.config");
const { syncModels, UserModel } = require("../src/models");
const Roles = require("../src/common/constant/role.enum");

/**
 * ساخت یا ارتقای یک کاربر به ادمین.
 *   npm run db:admin -- 09121112233 "نام ادمین"
 */
async function createAdmin() {
  const mobile = process.argv[2];
  const fullName = process.argv[3] || "Admin";

  if (!mobile || !/^09\d{9}$/.test(mobile)) {
    console.error("❌ شماره موبایل معتبر لازم است.");
    console.error('   مثال: npm run db:admin -- 09121112233 "نام ادمین"');
    process.exit(1);
  }

  await connectDB();
  await syncModels();

  let user = await UserModel.findOne({ where: { mobile } });

  if (user) {
    user.role = Roles.Admin;
    user.verifiedMobile = true;
    if (!user.fullName) user.fullName = fullName;
    await user.save();
    console.log(`♻️  کاربر موجود به ادمین ارتقا یافت: ${mobile}`);
  } else {
    user = await UserModel.create({
      mobile,
      fullName,
      role: Roles.Admin,
      verifiedMobile: true,
    });
    console.log(`✅ ادمین جدید ساخته شد: ${mobile}`);
  }

  // یک توکن آماده تا بدون طی کردن مراحل OTP وارد پنل شوید
  const accessToken = jwt.sign(
    { id: user.id, mobile: user.mobile, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "30d" }
  );
  const refreshToken = jwt.sign(
    { id: user.id, mobile: user.mobile, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1y" }
  );

  user.accessToken = accessToken;
  user.refreshToken = refreshToken;
  await user.save();

  console.log(`   id: ${user.id}`);
  console.log(`   role: ${user.role}`);
  console.log("\n🔑 accessToken (اعتبار ۳۰ روز):\n");
  console.log(accessToken);
  console.log("\nنمونه‌ی استفاده:");
  console.log(
    `curl localhost:${process.env.PORT || 3403}/user/whoami -H "Authorization: Bearer ${accessToken}"`
  );

  process.exit(0);
}

createAdmin().catch((error) => {
  console.error("❌ create-admin failed:", error);
  process.exit(1);
});
