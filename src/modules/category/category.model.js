const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../config/database.config");

class CategoryModel extends Model {
  toJSON() {
    const values = { ...this.get() };
    values._id = values.id;
    values.parent = values.parentId ?? null;
    if (Array.isArray(values.children)) {
      values.children = values.children.map((child) =>
        typeof child?.toJSON === "function" ? child.toJSON() : child
      );
    }
    return values;
  }
}

CategoryModel.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    icon: { type: DataTypes.STRING(255), allowNull: false },
    parentId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: "categories", key: "id" },
    },
  },
  {
    sequelize,
    modelName: "category",
    tableName: "categories",
    timestamps: false,
    indexes: [{ fields: ["slug"] }, { fields: ["parent_id"] }],
  }
);

module.exports = CategoryModel;
