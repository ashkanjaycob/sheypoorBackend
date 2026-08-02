const autoBind = require("auto-bind");
const createHttpError = require("http-errors");
const { Op } = require("sequelize");
const { default: slugify } = require("slugify");
const { OptionModel, CategoryModel } = require("../../models");
const { OptionMessage } = require("./option.message");
const categoryService = require("../category/category.service");
const { isTrue, isFalse } = require("../../common/utils/functions");
const { isValidId, toId } = require("../../common/utils/validators");

const CATEGORY_INCLUDE = {
  model: CategoryModel,
  as: "category",
  attributes: ["id", "name", "slug"],
};

class OptionService {
  #model;
  #categoryService;
  constructor() {
    autoBind(this);
    this.#model = OptionModel;
    this.#categoryService = categoryService;
  }

  async find() {
    return await this.#model.findAll({
      include: [CATEGORY_INCLUDE],
      order: [["id", "DESC"]],
    });
  }

  async create(optionDto) {
    const category = await this.#categoryService.checkExistById(
      optionDto.category
    );

    if (!optionDto.key) {
      throw new createHttpError.BadRequest("فیلد key الزامی است.");
    }

    const key = slugify(optionDto.key, {
      trim: true,
      replacement: "_",
      lower: true,
    });

    await this.alreadyExistByCategoryAndKey(key, category.id);

    let list = optionDto.enum;
    if (list && typeof list === "string") list = list.split(",");
    else if (!Array.isArray(list)) list = [];

    let required = false;
    if (isTrue(optionDto?.required)) required = true;
    if (isFalse(optionDto?.required)) required = false;

    return await this.#model.create({
      title: optionDto.title,
      key,
      type: optionDto.type,
      enum: list,
      guid: optionDto.guid,
      required,
      categoryId: category.id,
    });
  }

  async update(id, optionDto) {
    const existOption = await this.checkExistById(id);
    const payload = {};

    let categoryId = existOption.categoryId;
    if (optionDto.category && isValidId(optionDto.category)) {
      const category = await this.#categoryService.checkExistById(
        optionDto.category
      );
      categoryId = category.id;
      payload.categoryId = category.id;
    }

    if (optionDto.key) {
      payload.key = slugify(optionDto.key, {
        trim: true,
        replacement: "_",
        lower: true,
      });
      await this.alreadyExistByCategoryAndKey(
        payload.key,
        categoryId,
        existOption.id
      );
    }

    if (optionDto?.enum && typeof optionDto.enum === "string") {
      payload.enum = optionDto.enum.split(",");
    } else if (Array.isArray(optionDto.enum)) {
      payload.enum = optionDto.enum;
    }

    if (isTrue(optionDto?.required)) payload.required = true;
    else if (isFalse(optionDto?.required)) payload.required = false;

    if (optionDto.title) payload.title = optionDto.title;
    if (optionDto.type) payload.type = optionDto.type;
    if (optionDto.guid !== undefined) payload.guid = optionDto.guid;

    return await this.#model.update(payload, { where: { id: existOption.id } });
  }

  async findById(id) {
    return await this.checkExistById(id);
  }

  async removeById(id) {
    const option = await this.checkExistById(id);
    return await this.#model.destroy({ where: { id: option.id } });
  }

  async findByCategoryId(category) {
    if (!isValidId(category)) {
      throw new createHttpError.BadRequest(OptionMessage.NotFound);
    }
    return await this.#model.findAll({
      where: { categoryId: toId(category) },
      include: [CATEGORY_INCLUDE],
    });
  }

  async findByCategorySlug(slug) {
    const options = await this.#model.findAll({
      include: [
        {
          model: CategoryModel,
          as: "category",
          attributes: ["id", "name", "slug", "icon"],
          where: { slug },
          required: true,
        },
      ],
    });

    // خروجی مسطح، مطابق aggregate قبلی
    return options.map((option) => {
      const value = option.toJSON();
      const category = value.category;
      delete value.category;
      return {
        ...value,
        categorySlug: category?.slug,
        categoryName: category?.name,
        categoryIcon: category?.icon,
      };
    });
  }

  async checkExistById(id) {
    if (!isValidId(id)) {
      throw new createHttpError.BadRequest(OptionMessage.NotFound);
    }
    const option = await this.#model.findByPk(toId(id));
    if (!option) throw new createHttpError.NotFound(OptionMessage.NotFound);
    return option;
  }

  async alreadyExistByCategoryAndKey(key, categoryId, exceptionId = null) {
    const where = { categoryId, key };
    if (exceptionId) where.id = { [Op.ne]: exceptionId };

    const isExist = await this.#model.findOne({ where });
    if (isExist) throw new createHttpError.Conflict(OptionMessage.AlreadyExist);
    return null;
  }
}

module.exports = new OptionService();
