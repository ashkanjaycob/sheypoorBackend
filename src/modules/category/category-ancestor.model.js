const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../../config/database.config");

/**
 * جایگزین آرایه‌ی `parents` در مونگو.
 * هر ردیف یعنی: categoryId یکی از فرزندان (در هر عمقی) از ancestorId است.
 */
class CategoryAncestorModel extends Model {}

CategoryAncestorModel.init(
  {
    categoryId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: { model: "categories", key: "id" },
      onDelete: "CASCADE",
    },
    ancestorId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      primaryKey: true,
      references: { model: "categories", key: "id" },
      onDelete: "CASCADE",
    },
  },
  {
    sequelize,
    modelName: "categoryAncestor",
    tableName: "category_ancestors",
    timestamps: false,
    indexes: [{ fields: ["ancestor_id"] }],
  }
);

module.exports = CategoryAncestorModel;
