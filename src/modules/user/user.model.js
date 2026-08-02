const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../config/database.config");

class UserModel extends Model {
  // سازگاری با کد قبلی مونگو: user.otp.code / user.otp.expiresIn
  get otp() {
    return {
      code: this.getDataValue("otpCode"),
      expiresIn: Number(this.getDataValue("otpExpiresIn") || 0),
    };
  }

  set otp(value = {}) {
    this.setDataValue("otpCode", value?.code ?? null);
    this.setDataValue("otpExpiresIn", value?.expiresIn ?? 0);
  }

  toJSON() {
    const values = { ...this.get() };
    values._id = values.id; // سازگاری با فرانت‌اندی که _id می‌خواند
    return values;
  }
}

UserModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: { type: DataTypes.STRING(255), allowNull: true },
    mobile: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    otpCode: { type: DataTypes.STRING(10), allowNull: true },
    otpExpiresIn: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
    verifiedMobile: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    accessToken: { type: DataTypes.TEXT, allowNull: true },
    refreshToken: { type: DataTypes.TEXT, allowNull: true },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "USER",
    },
  },
  {
    sequelize,
    modelName: "user",
    tableName: "users",
    timestamps: true,
  }
);

module.exports = UserModel;
