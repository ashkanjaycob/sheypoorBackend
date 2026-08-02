const createHttpError = require("http-errors");
const Roles = require("../constant/role.enum");

/**
 * باید بعد از Authorization استفاده شود.
 * مثال: router.post("/", Authorization, AdminGuard, controller.create)
 */
const AdminGuard = (req, res, next) => {
  if (!req.user) {
    return next(
      new createHttpError.Unauthorized("لطفا وارد حساب کاربری شوید.")
    );
  }
  if (req.user.role !== Roles.Admin) {
    return next(
      new createHttpError.Forbidden("این بخش فقط برای ادمین در دسترس است.")
    );
  }
  return next();
};

module.exports = AdminGuard;
