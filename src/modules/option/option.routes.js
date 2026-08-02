const { Router } = require("express");
const optionController = require("./option.controller");
const Authorization = require("../../common/guard/authorization.guard");
const AdminGuard = require("../../common/guard/admin.guard");

const router = Router();
router.get("/by-category/:categoryId", optionController.findByCategoryId);
router.get("/by-category-slug/:slug", optionController.findByCategorySlug);
router.get("/", optionController.find);
router.get("/:id", optionController.findById);
// مدیریت آپشن‌ها فقط برای ادمین (پنل ادمین)
router.post("/", Authorization, AdminGuard, optionController.create);
router.put("/:id", Authorization, AdminGuard, optionController.update);
router.delete("/:id", Authorization, AdminGuard, optionController.removeById);
module.exports = {
  OptionRoutes: router,
};
