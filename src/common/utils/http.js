const { default: axios } = require("axios");

/**
 * تبدیل مختصات به آدرس با map.ir
 * اگر سرویس در دسترس نباشد یا کلید منقضی شده باشد،
 * ساخت آگهی نباید شکست بخورد — فقط فیلدهای آدرس خالی می‌مانند.
 */
const getAddressDetail = async (lat, lng) => {
  const empty = {
    province: undefined,
    city: undefined,
    district: undefined,
    address: undefined,
  };

  if (!lat || !lng) return empty;
  if (!process.env.MAP_IR_URL || !process.env.MAP_API_KEY) return empty;

  try {
    const result = await axios
      .get(`${process.env.MAP_IR_URL}?lat=${lat}&lon=${lng}`, {
        headers: { "x-api-key": process.env.MAP_API_KEY },
        timeout: 8000,
      })
      .then((res) => res.data);

    return {
      province: result?.province,
      city: result?.city,
      district: result?.region ?? result?.district,
      address: result?.address,
    };
  } catch (error) {
    console.warn(
      "[map.ir] reverse geocode failed:",
      error.response?.status || error.message
    );
    return empty;
  }
};

module.exports = {
  getAddressDetail,
};
