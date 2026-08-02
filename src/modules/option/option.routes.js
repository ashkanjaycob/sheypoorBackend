const { Router } = require("express");
const optionController = require("./option.controller");
const Authorization = require("../../common/guard/authorization.guard");

const router = Router();
router.get("/by-category/:categoryId", optionController.findByCategoryId);
router.get("/by-category-slug/:slug", optionController.findByCategorySlug);
router.get("/", optionController.find);
router.get("/:id", optionController.findById);
// نوشتن روی آپشن‌ها فقط برای کاربر لاگین‌شده
router.post("/", Authorization, optionController.create);
router.put("/:id", Authorization, optionController.update);
router.delete("/:id", Authorization, optionController.removeById);
module.exports = {
  OptionRoutes: router,
};
