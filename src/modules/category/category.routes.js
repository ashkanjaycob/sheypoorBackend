const { Router } = require("express");
const categoryController = require("./category.controller");
const Authorization = require("../../common/guard/authorization.guard");

const router = Router();
router.get("/", categoryController.find);
// نوشتن روی دسته‌بندی‌ها فقط برای کاربر لاگین‌شده
router.post("/", Authorization, categoryController.create);
router.delete("/:id", Authorization, categoryController.remove);
module.exports = {
  CategoryRouter: router,
};
