const autoBind = require("auto-bind");
const createHttpError = require("http-errors");
const { Op } = require("sequelize");
const {
  PostModel,
  OptionModel,
  CategoryModel,
  CategoryAncestorModel,
  UserModel,
} = require("../../models");
const { PostMessage } = require("./post.message");
const { isValidId, toId } = require("../../common/utils/validators");

class PostService {
  #model;
  #optionModel;
  #categoryModel;
  #ancestorModel;
  constructor() {
    autoBind(this);
    this.#model = PostModel;
    this.#optionModel = OptionModel;
    this.#categoryModel = CategoryModel;
    this.#ancestorModel = CategoryAncestorModel;
  }

  async getCategoryOptions(categoryId) {
    return await this.#optionModel.findAll({
      where: { categoryId },
    });
  }

  async create(dto) {
    return await this.#model.create(dto);
  }

  async find(userId) {
    if (!isValidId(userId)) {
      throw new createHttpError.BadRequest(PostMessage.RequestNotValid);
    }
    return await this.#model.findAll({
      where: { userId: toId(userId) },
      order: [["id", "DESC"]],
    });
  }

  async findAll(options = {}) {
    const { category, search } = options;
    const where = {};

    if (category) {
      const result = await this.#categoryModel.findOne({
        where: { slug: category },
      });
      if (!result) return [];

      // خود دسته + همه‌ی زیرشاخه‌ها در هر عمقی
      const descendants = await this.#ancestorModel.findAll({
        where: { ancestorId: result.id },
        attributes: ["categoryId"],
      });
      where.categoryId = [
        result.id,
        ...descendants.map((row) => row.categoryId),
      ];
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
      ];
    }

    return await this.#model.findAll({ where, order: [["id", "DESC"]] });
  }

  async checkExist(postId) {
    if (!isValidId(postId)) {
      throw new createHttpError.BadRequest(PostMessage.RequestNotValid);
    }

    const post = await this.#model.findByPk(toId(postId), {
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "mobile"],
          required: false,
        },
      ],
    });

    if (!post) throw new createHttpError.NotFound(PostMessage.NotFound);

    const value = post.toJSON();
    value.userMobile = value.user?.mobile ?? null;
    delete value.user;
    return value;
  }

  async remove(postId) {
    const post = await this.checkExist(postId);
    await this.#model.destroy({ where: { id: post.id } });
  }
}

module.exports = new PostService();
