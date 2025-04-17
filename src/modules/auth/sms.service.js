const axios = require("axios");

const MELI_TOKEN = process.env.MELI_TOKEN;

async function sendOtpSms(mobile, code) {
  try {
    const response = await axios.post(
      "https://console.melipayamak.com/api/send/otp/5b8834e7c4d34494a1834912285bd0d2",
      {
        to: mobile,
        text: `کد ورود شما: ${code}`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": MELI_TOKEN,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "❌ خطا در ارسال پیامک:",
      error.response?.data || error.message
    );
    throw new Error("ارسال پیامک ناموفق بود");
  }
}

module.exports = { sendOtpSms };
