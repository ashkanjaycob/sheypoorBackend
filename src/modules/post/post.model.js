const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../config/database.config");

class PostModel extends Model {
  toJSON() {
    const values = { ...this.get() };
    values._id = values.id;
    // سازگاری با ساختار قبلی مونگو: coordinate = [lat, lng]
    values.coordinate =
      values.lat !== null && values.lng !== null
        ? [Number(values.lat), Number(values.lng)]
        : [];
    values.category = values.categoryId;
    return values;
  }
}

PostModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    title: { type: DataTypes.STRING(255), allowNull: true },
    userId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const raw = this.getDataValue("amount");
        return raw === null ? 0 : Number(raw);
      },
    },
    content: { type: DataTypes.TEXT, allowNull: true },
    categoryId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "categories", key: "id" },
    },
    province: { type: DataTypes.STRING(255), allowNull: true },
    city: { type: DataTypes.STRING(255), allowNull: true },
    district: { type: DataTypes.STRING(255), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    images: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    options: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  },
  {
    sequelize,
    modelName: "post",
    tableName: "posts",
    timestamps: true,
    indexes: [{ fields: ["user_id"] }, { fields: ["category_id"] }],
  }
);

module.exports = PostModel;
