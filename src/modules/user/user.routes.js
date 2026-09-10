const {Router} = require("express");
const userController = require("./user.controller");
const Authorization = require("../../common/guard/authorization.guard");
const { userRateLimiter } = require("../../config/rate-limit.config");
const router = Router();
router.get("/whoami", Authorization, userRateLimiter, userController.whoami);
module.exports = {
    UserRouter: router
}