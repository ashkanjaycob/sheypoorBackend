const autoBind = require("auto-bind");
const createHttpError = require("http-errors");
const axios = require("axios");
const cheerio = require("cheerio");
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

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const post = await this.#service.checkExist(id);
      
      if (post.userId !== userId) {
        throw new createHttpError.Forbidden("شما مجاز به ویرایش این آگهی نیستید");
      }

      const images = req?.files?.map((image) => image?.path?.slice(7)) ?? [];
      const {
        title_post,
        title,
        description,
        content,
        lat,
        lng,
        category,
        amount,
      } = req.body;

      const categoryId = category ? toId(category) : undefined;
      if (category && !categoryId) {
        throw new createHttpError.BadRequest(PostMessage.RequestNotValid);
      }

      const options = removePropertyInObject(req.body, [
        "amount",
        "title_post",
        "title",
        "description",
        "content",
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

      const newTitle = title_post || title || post.title;
      const newContent = description || content || post.content;
      
      if (title) options.title = title;
      if (content) options.content = content;

      let addressDetail = {};
      if (lat && lng) {
        addressDetail = await getAddressDetail(lat, lng);
      }

      const updatePayload = {
        title: newTitle,
        amount: amount !== undefined ? Number(amount) || 0 : post.amount,
        content: newContent,
        lat: lat || post.lat,
        lng: lng || post.lng,
        categoryId: categoryId || post.categoryId,
        options: { ...post.options, ...options },
        ...addressDetail,
      };

      if (images && images.length > 0) {
        updatePayload.images = images;
      }

      await this.#service.update(id, updatePayload);

      return res.json({
        message: PostMessage.Updated,
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
  async scrapeSheypoor(req, res, next) {
    try {
      const { url, categoryId } = req.body;
      if (!url || !categoryId) {
        throw new createHttpError.BadRequest("URL and Category ID are required.");
      }
      
      const userId = req.user.id;

      // Fetch Sheypoor HTML
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const postsToScrape = [];
      
      // Sheypoor listing items are inside <a> tags
      $('a[href*="/v/"]').slice(0, 20).each((i, el) => {
        const title = $(el).find('h2').first().text().trim();
        if (!title) return;
        
        let priceText = "";
        let amount = 0;
        let location = "ایران";

        const parts = [];
        $(el).find('*').each((idx, child) => {
           const text = $(child).contents().filter(function() {
              return this.type === 'text';
           }).text().trim();
           if (text && text.length > 2 && text !== title) {
              parts.push(text);
           }
        });

        for (let j = 0; j < parts.length; j++) {
           const pt = parts[j].replace(/,/g, '');
           if (pt.match(/^[۰-۹0-9]+$/)) {
              amount = parseInt(pt.replace(/[۰-۹]/g, w => String.fromCharCode(w.charCodeAt(0) - 1728)));
              priceText = parts[j];
              location = parts[j+1] || location;
              break;
           } else if (parts[j].includes('توافقی')) {
              amount = 0;
              priceText = "توافقی";
              location = parts[j+1] || location;
              break;
           }
        }
        
        let image = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || "";
        if (image && !image.startsWith('http')) {
           image = image.replace(/^(\.\/|\/)/, 'https://www.sheypoor.com/');
        }
        
        const link = $(el).attr('href');
        const originalUrl = link && link.startsWith('http') ? link : (link ? `https://www.sheypoor.com${link}` : url);

        if (title) {
          postsToScrape.push({
            title,
            content: priceText,
            amount,
            city: location,
            district: "",
            image,
            originalUrl
          });
        }
      });

      if (postsToScrape.length === 0) {
        return res.json({
          message: "Successfully scraped and created 0 posts.",
          debug_html: response.data.substring(0, 1000) // Send a snippet of HTML to debug if failed
        });
      }

      // Fetch descriptions sequentially to avoid rate limiting
      for (let i = 0; i < postsToScrape.length; i++) {
        try {
          const item = postsToScrape[i];
          const postRes = await axios.get(item.originalUrl, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          const $post = cheerio.load(postRes.data);
          let desc = "";
          $post('p').each((_, p) => {
            const t = $(p).text().trim();
            if (t.length > desc.length) desc = t;
          });
          
          if (desc) {
             item.content = desc;
          } else {
             item.content = item.title;
          }
        } catch (e) {
          console.error("Could not fetch description for", postsToScrape[i].originalUrl);
          postsToScrape[i].content = postsToScrape[i].title;
        }
      }


      let scrapedCount = 0;
      for (const item of postsToScrape) {
        const images = item.image ? [item.image] : [];
        
        const options = {
          title: item.title,
          content: item.content,
          originalUrl: item.originalUrl
        };

        await this.#service.create({
          userId,
          title: item.title,
          amount: item.amount,
          content: item.content,
          lat: null,
          lng: null,
          categoryId,
          images,
          options,
          address: "",
          province: "",
          city: item.city,
          district: item.district,
        });
        
        scrapedCount++;
      }

      return res.json({
        message: `Successfully scraped and created ${scrapedCount} posts from Sheypoor.`,
      });
    } catch (error) {
      console.error("Scraping error:", error);
      next(createHttpError.InternalServerError("Failed to scrape Sheypoor. Please check the URL."));
    }
  }
}

module.exports = new PostController();
