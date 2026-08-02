/**
 * جایگزین isValidObjectId مونگو.
 * شناسه‌های MySQL عدد صحیح مثبت هستند.
 */
const isValidId = (value) => {
  if (value === null || value === undefined || value === "") return false;
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
};

const toId = (value) => (isValidId(value) ? Number(value) : null);

module.exports = { isValidId, toId };
