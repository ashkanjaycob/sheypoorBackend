const axios = require("axios");

const OTP_ENDPOINT =
  process.env.MELI_OTP_URL ||
  "https://console.melipayamak.com/api/send/otp/f1f64d955e624d4486a180c50a29141b";

async function sendOtpSms(mobile, code) {
  // ⚠️ داخل تابع خوانده می‌شود، نه در زمان import،
  // وگرنه اگر dotenv هنوز اجرا نشده باشد مقدار undefined می‌ماند.
  const meliToken = process.env.MELI_TOKEN;

  if (!meliToken) {
    console.warn(
      `[SMS] MELI_TOKEN is not configured. Returning code for testing. Code for ${mobile}: ${code}`
    );
    return { code: String(code) };
  }

  try {
    const response = await axios.post(
      OTP_ENDPOINT,
      { to: mobile },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": meliToken,
        },
        timeout: 10000,
      }
    );
    console.log("[SMS] Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[SMS] Error:", error.response?.data || error.message);
    throw new Error("SMS sending failed");
  }
}

module.exports = { sendOtpSms };
