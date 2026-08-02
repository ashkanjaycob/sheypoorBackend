const { Router } = require("express");
const categoryController = require("./category.controller");
const Authorization = require("../../common/guard/authorization.guard");
const AdminGuard = require("../../common/guard/admin.guard");

const router = Router();
router.get("/", categoryController.find);
// مدیریت دسته‌بندی‌ها فقط برای ادمین (پنل ادمین)
router.post("/", Authorization, AdminGuard, categoryController.create);
router.delete("/:id", Authorization, AdminGuard, categoryController.remove);
module.exports = {
  CategoryRouter: router,
};
