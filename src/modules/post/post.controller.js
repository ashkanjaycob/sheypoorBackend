const autoBind = require("auto-bind");
const createHttpError = require("http-errors");
const utf8 = require("utf8");
const { PostMessage } = require("./post.message");
const postService = require("./post.service");
const { CategoryModel } = require("../../models");
const { removePropertyInObject } = require("../../common/utils/functions");
const { getAddressDetail } = require("../../common/utils/http");
const { toId } = require("../../common/utils/validators");

class PostController {
  #service;
  success_message;
  constructor() {
    autoBind(this);
    this.#service = postService;
  }

  async createPostPage(req, res, next) {
    try {
      let { slug } = req.query;
      let showBack = false;
      let where = { parentId: null };
      let options = null;
      let category = null;

      if (slug) {
        slug = slug.trim();
        category = await CategoryModel.findOne({ where: { slug } });
        if (!category) throw new createHttpError.NotFound(PostMessage.NotFound);

        options = await this.#service.getCategoryOptions(category.id);
        if (options.length === 0) options = null;

        showBack = true;
        where = { parentId: category.id };
      }

      const categories = await CategoryModel.findAll({ where });

      res.json({
        categories,
        showBack,
        category: category ? String(category.id) : undefined,
        options,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const images = req?.files?.map((image) => image?.path?.slice(7)) ?? [];
      const {
        title_post: title,
        description: content,
        lat,
        lng,
        category,
        amount,
      } = req.body;

      const categoryId = toId(category);
      if (!categoryId) {
        throw new createHttpError.BadRequest(PostMessage.RequestNotValid);
      }

      const options = removePropertyInObject(req.body, [
        "amount",
        "title_post",
        "description",
        "lat",
        "lng",
        "category",
        "images",
      ]);
      for (let key in options) {
        let value = options[key];
        delete options[key];
        key = utf8.decode(key);
        options[key] = value;
      }

      const { address, province, city, district } = await getAddressDetail(
        lat,
        lng
      );

      await this.#service.create({
        userId,
        title,
        amount: Number(amount) || 0,
        content,
        lat: lat || null,
        lng: lng || null,
        categoryId,
        images,
        options,
        address,
        province,
        city,
        district,
      });

      return res.json({
        message: PostMessage.Created,
      });
    } catch (error) {
      next(error);
    }
  }

  async findMyPosts(req, res, next) {
    try {
      const userId = req.user.id;
      const posts = await this.#service.find(userId);
      res.json({
        posts,
        count: posts.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await this.#service.remove(id);
      return res.json({
        message: PostMessage.Deleted,
      });
    } catch (error) {
      next(error);
    }
  }

  async showPost(req, res, next) {
    try {
      const { id } = req.params;
      const post = await this.#service.checkExist(id);
      res.json({
        post,
      });
    } catch (error) {
      next(error);
    }
  }

  // لیست عمومی برای لندینگ — بدون نیاز به توکن
  async publicList(req, res, next) {
    try {
      const { posts, pagination } = await this.#service.findPublic(req.query);
      res.json({
        posts,
        count: posts.length,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async postList(req, res, next) {
    try {
      const query = req.query;
      const posts = await this.#service.findAll(query);
      res.json({
        posts,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PostController();
