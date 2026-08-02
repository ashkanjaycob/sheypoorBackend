const autoBind = require("auto-bind");
const createHttpError = require("http-errors");
const { default: slugify } = require("slugify");
const {
  sequelize,
  CategoryModel,
  CategoryAncestorModel,
  OptionModel,
} = require("../../models");
const { CategoryMessage } = require("./category.message");
const { isValidId, toId } = require("../../common/utils/validators");

class CategoryService {
  #model;
  #ancestorModel;
  #optionModel;
  constructor() {
    autoBind(this);
    this.#model = CategoryModel;
    this.#ancestorModel = CategoryAncestorModel;
    this.#optionModel = OptionModel;
  }

  /**
   * دسته‌های ریشه به همراه کل درخت فرزندان.
   * معادل autoPopulate بازگشتی مونگو، ولی فقط با یک کوئری.
   */
  async find() {
    const all = await this.#model.findAll({ order: [["id", "ASC"]] });
    const plain = all.map((item) => item.toJSON());

    const byId = new Map(plain.map((item) => [String(item.id), item]));
    plain.forEach((item) => (item.children = []));

    const roots = [];
    for (const item of plain) {
      if (item.parentId) {
        const parent = byId.get(String(item.parentId));
        if (parent) parent.children.push(item);
        else roots.push(item);
      } else {
        roots.push(item);
      }
    }
    return roots;
  }

  async remove(id) {
    const category = await this.checkExistById(id);

    // کل زیردرخت + خود دسته
    const descendants = await this.#ancestorModel.findAll({
      where: { ancestorId: category.id },
      attributes: ["categoryId"],
    });
    const ids = [
      category.id,
      ...descendants.map((row) => row.categoryId),
    ];

    await sequelize.transaction(async (transaction) => {
      await this.#optionModel.destroy({
        where: { categoryId: ids },
        transaction,
      });
      await this.#ancestorModel.destroy({
        where: { categoryId: ids },
        transaction,
      });
      await this.#model.destroy({ where: { id: ids }, transaction });
    });

    return true;
  }

  async create(categoryDto) {
    const parentId = toId(categoryDto?.parent);
    let ancestorIds = [];

    if (categoryDto?.parent && isValidId(categoryDto.parent)) {
      const existCategory = await this.checkExistById(parentId);
      const parentAncestors = await this.#ancestorModel.findAll({
        where: { categoryId: existCategory.id },
        attributes: ["ancestorId"],
      });
      ancestorIds = [
        ...new Set([
          Number(existCategory.id),
          ...parentAncestors.map((row) => Number(row.ancestorId)),
        ]),
      ];
    }

    if (categoryDto?.slug) {
      categoryDto.slug = slugify(categoryDto.slug);
      await this.alreadyExistBySlug(categoryDto.slug);
    } else {
      categoryDto.slug = slugify(categoryDto.name || "");
      await this.alreadyExistBySlug(categoryDto.slug);
    }

    return await sequelize.transaction(async (transaction) => {
      const category = await this.#model.create(
        {
          name: categoryDto.name,
          icon: categoryDto.icon,
          slug: categoryDto.slug,
          parentId: parentId,
        },
        { transaction }
      );

      if (ancestorIds.length) {
        await this.#ancestorModel.bulkCreate(
          ancestorIds.map((ancestorId) => ({
            categoryId: category.id,
            ancestorId,
          })),
          { transaction }
        );
      }

      return category;
    });
  }

  async checkExistById(id) {
    if (!isValidId(id)) {
      throw new createHttpError.BadRequest(CategoryMessage.NotFound);
    }
    const category = await this.#model.findByPk(toId(id));
    if (!category) throw new createHttpError.NotFound(CategoryMessage.NotFound);
    return category;
  }

  async checkExistBySlug(slug) {
    const category = await this.#model.findOne({ where: { slug } });
    if (!category) throw new createHttpError.NotFound(CategoryMessage.NotFound);
    return category;
  }

  async alreadyExistBySlug(slug) {
    const category = await this.#model.findOne({ where: { slug } });
    if (category)
      throw new createHttpError.Conflict(CategoryMessage.AlreadyExist);
    return null;
  }
}

module.exports = new CategoryService();
