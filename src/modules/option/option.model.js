const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../config/database.config");

class OptionModel extends Model {
  toJSON() {
    const values = { ...this.get() };
    values._id = values.id;
    if (values.category && typeof values.category?.toJSON === "function") {
      values.category = values.category.toJSON();
    }
    return values;
  }
}

OptionModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    // `key` در MySQL کلیدواژه‌ی رزرو شده است، پس نام ستون option_key است
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "option_key",
    },
    type: {
      type: DataTypes.ENUM("number", "string", "array", "boolean"),
      allowNull: true,
    },
    // `enum` هم کلیدواژه است
    enum: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: "enum_values",
    },
    guid: { type: DataTypes.STRING(255), allowNull: true },
    required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    categoryId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: { model: "categories", key: "id" },
    },
  },
  {
    sequelize,
    modelName: "option",
    tableName: "options",
    timestamps: false,
    indexes: [{ unique: true, fields: ["category_id", "option_key"] }],
  }
);

module.exports = OptionModel;
