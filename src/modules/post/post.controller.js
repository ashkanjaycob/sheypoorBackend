const autoBind = require("auto-bind");
const createHttpError = require("http-errors");
const axios = require("axios");
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
  async scrapeDivar(req, res, next) {
    try {
      const { url, categoryId } = req.body;
      if (!url || !categoryId) {
        throw new createHttpError.BadRequest("URL and Category ID are required.");
      }
      
      const userId = req.user.id; // Assigned to the admin requesting it

      // Parse Divar URL (e.g. https://divar.ir/s/tehran/real-estate)
      const urlParts = new URL(url).pathname.split('/');
      // Usually pathname is /s/city/category
      const citySegment = urlParts[2] || 'tehran';
      const categorySegment = urlParts[3] || '';

      const apiUrl = `https://api.divar.ir/v8/web-search/${citySegment}/${categorySegment}`;
      const response = await axios.get(apiUrl);
      
      const widgets = response.data?.web_widgets?.post_list || [];
      const postsToScrape = widgets.slice(0, 20);

      let scrapedCount = 0;
      for (const widget of postsToScrape) {
        const item = widget.data;
        if (!item || !item.title) continue;

        // Basic fields
        const title = item.title;
        // Divar search results don't always give full description, use subtitle or empty
        const content = item.description || item.subtitle || item.middle_description_text || "";
        
        // Try to parse price if available in middle_description_text
        let amount = 0;
        if (item.middle_description_text && item.middle_description_text.includes('تومان')) {
           const numStr = item.middle_description_text.replace(/[^0-9]/g, '');
           if (numStr) amount = Number(numStr);
        }

        const city = item.city || "تهران";
        const district = item.district || "";
        
        // Images: Divar returns a thumbnail
        const images = item.image ? [item.image] : [];
        
        // Put title and content into options to match how frontend expects them
        const options = {
          title,
          content,
          originalUrl: `https://divar.ir/v/${item.token}`
        };

        await this.#service.create({
          userId,
          title,
          amount,
          content,
          lat: null,
          lng: null,
          categoryId,
          images,
          options,
          address: "",
          province: "",
          city,
          district,
        });
        
        scrapedCount++;
      }

      return res.json({
        message: `Successfully scraped and created ${scrapedCount} posts.`,
      });
    } catch (error) {
      console.error("Scraping error:", error);
      next(createHttpError.InternalServerError("Failed to scrape Divar. Please check the URL."));
    }
  }
}

module.exports = new PostController();
