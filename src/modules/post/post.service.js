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

  /**
   * ساخت شرط جستجو. اگر اسلاگ دسته‌بندی وجود نداشته باشد null برمی‌گرداند.
   */
  async buildFilter({ category, search } = {}) {
    const where = {};

    if (category) {
      const result = await this.#categoryModel.findOne({
        where: { slug: category },
      });
      if (!result) return null;

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

    return where;
  }

  async findAll(options = {}) {
    const where = await this.buildFilter(options);
    if (where === null) return [];
    return await this.#model.findAll({ where, order: [["id", "DESC"]] });
  }

  /**
   * لیست عمومی آگهی‌ها برای لندینگ فرانت — بدون احراز هویت، با صفحه‌بندی
   * و اطلاعات دسته‌بندی هر آگهی.
   */
  async findPublic(query = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));

    const where = await this.buildFilter(query);
    if (where === null) {
      return {
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }

    const { rows, count } = await this.#model.findAndCountAll({
      where,
      include: [
        {
          model: this.#categoryModel,
          as: "categoryRef",
          attributes: ["id", "name", "slug", "icon"],
          required: false,
        },
      ],
      order: [["id", "DESC"]],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
    });

    const posts = rows.map((row) => {
      const value = row.toJSON();
      const category = value.categoryRef;
      delete value.categoryRef;
      return {
        ...value,
        categoryName: category?.name ?? null,
        categorySlug: category?.slug ?? null,
        categoryIcon: category?.icon ?? null,
      };
    });

    return {
      posts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
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

  async update(postId, dto) {
    const post = await this.checkExist(postId);
    await this.#model.update(dto, { where: { id: post.id } });
  }
}

module.exports = new PostService();
