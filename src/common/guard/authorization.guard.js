const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const AuthorizationMessage = require("../messages/auth.message");
const { UserModel } = require("../../models");

const Authorization = async (req, res, next) => {
  try {
    const { authorization } = req?.headers ?? {};
    if (!authorization)
      throw new createHttpError.Unauthorized(AuthorizationMessage.Login);

    const [bearer, token] = authorization.split(" ");
    if (!token || bearer?.toLowerCase() !== "bearer")
      throw new createHttpError.Unauthorized(AuthorizationMessage.Login);

    let data;
    try {
      data = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      throw new createHttpError.Unauthorized(AuthorizationMessage.InvalidToken);
    }

    if (typeof data === "object" && "id" in data) {
      const user = await UserModel.findByPk(data.id, {
        attributes: {
          exclude: [
            "accessToken",
            "refreshToken",
            "otpCode",
            "otpExpiresIn",
            "verifiedMobile",
            "updatedAt",
          ],
        },
      });
      if (!user)
        throw new createHttpError.Unauthorized(
          AuthorizationMessage.NotFoundAccount
        );
      req.user = user;
      return next();
    }

    throw new createHttpError.Unauthorized(AuthorizationMessage.InvalidToken);
  } catch (error) {
    next(error);
  }
};

module.exports = Authorization;
