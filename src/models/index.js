const { sequelize } = require("../config/database.config");

const UserModel = require("../modules/user/user.model");
const CategoryModel = require("../modules/category/category.model");
const CategoryAncestorModel = require("../modules/category/category-ancestor.model");
const OptionModel = require("../modules/option/option.model");
const PostModel = require("../modules/post/post.model");

// ---------- روابط ----------

// درخت دسته‌بندی (خودارجاع)
CategoryModel.hasMany(CategoryModel, {
  as: "children",
  foreignKey: "parentId",
  onDelete: "CASCADE",
});
CategoryModel.belongsTo(CategoryModel, {
  as: "parentCategory",
  foreignKey: "parentId",
});

// جدول اجداد (جایگزین آرایه‌ی parents)
CategoryModel.hasMany(CategoryAncestorModel, {
  as: "ancestorLinks",
  foreignKey: "categoryId",
  onDelete: "CASCADE",
});
CategoryAncestorModel.belongsTo(CategoryModel, {
  as: "category",
  foreignKey: "categoryId",
});
CategoryAncestorModel.belongsTo(CategoryModel, {
  as: "ancestor",
  foreignKey: "ancestorId",
});

// آپشن‌ها
CategoryModel.hasMany(OptionModel, {
  as: "options",
  foreignKey: "categoryId",
  onDelete: "CASCADE",
});
OptionModel.belongsTo(CategoryModel, {
  as: "category",
  foreignKey: "categoryId",
});

// آگهی‌ها
UserModel.hasMany(PostModel, { as: "posts", foreignKey: "userId" });
PostModel.belongsTo(UserModel, { as: "user", foreignKey: "userId" });

CategoryModel.hasMany(PostModel, { as: "posts", foreignKey: "categoryId" });
PostModel.belongsTo(CategoryModel, {
  as: "categoryRef",
  foreignKey: "categoryId",
});

/**
 * ساخت جداول در صورت نبودن.
 * برای پروداکشن بهتر است به جای sync از migration استفاده شود،
 * ولی برای شروع سریع روی Render/لوکال کافی است.
 */
async function syncModels({ alter = false } = {}) {
  await sequelize.sync({ alter });
  console.log("✅ tables are ready.");
}

module.exports = {
  sequelize,
  UserModel,
  CategoryModel,
  CategoryAncestorModel,
  OptionModel,
  PostModel,
  syncModels,
};
