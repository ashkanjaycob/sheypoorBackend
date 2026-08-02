/**
 * @swagger
 * tags:
 *  name: Post
 *  description: آگهی‌ها — لیست عمومی، ساخت، مدیریت
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 12
 *         _id:
 *           type: integer
 *           description: هم‌نام id، برای سازگاری با فرانت قدیمی
 *           example: 12
 *         title:
 *           type: string
 *           example: پراید ۱۳۹۰
 *         content:
 *           type: string
 *           example: در حد صفر
 *         amount:
 *           type: number
 *           example: 250000000
 *         userId:
 *           type: integer
 *           example: 3
 *         categoryId:
 *           type: integer
 *           example: 6
 *         province:
 *           type: string
 *           nullable: true
 *         city:
 *           type: string
 *           nullable: true
 *         district:
 *           type: string
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         coordinate:
 *           type: array
 *           description: "[lat, lng]"
 *           items:
 *             type: number
 *           example: [35.7, 51.4]
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           example: ["upload/1700290342224.webp"]
 *         options:
 *           type: object
 *           example: { mileage: "120000" }
 *         createdAt:
 *           type: string
 *           format: date-time
 *     PostListItem:
 *       allOf:
 *         - $ref: '#/components/schemas/Post'
 *         - type: object
 *           properties:
 *             categoryName:
 *               type: string
 *               example: خودرو سواری
 *             categorySlug:
 *               type: string
 *               example: cars
 *             categoryIcon:
 *               type: string
 *               example: car-side
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 137
 *         totalPages:
 *           type: integer
 *           example: 7
 */

/**
 * @swagger
 *
 * /post:
 *  get:
 *      summary: لیست عمومی آگهی‌ها برای لندینگ (بدون احراز هویت)
 *      description: >
 *          همه‌ی آگهی‌ها را با صفحه‌بندی برمی‌گرداند.
 *          فیلتر روی یک دسته‌ی والد، آگهی‌های همه‌ی زیرشاخه‌ها را هم شامل می‌شود.
 *      tags:
 *          -   Post
 *      security: []
 *      parameters:
 *          -   in: query
 *              name: page
 *              schema:
 *                  type: integer
 *                  default: 1
 *              description: شماره صفحه
 *          -   in: query
 *              name: limit
 *              schema:
 *                  type: integer
 *                  default: 20
 *                  maximum: 50
 *              description: تعداد در هر صفحه
 *          -   in: query
 *              name: category
 *              schema:
 *                  type: string
 *              description: اسلاگ دسته‌بندی (مثلا cars)
 *          -   in: query
 *              name: search
 *              schema:
 *                  type: string
 *              description: جستجو در عنوان و توضیحات
 *      responses:
 *          200:
 *              description: success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              posts:
 *                                  type: array
 *                                  items:
 *                                      $ref: '#/components/schemas/PostListItem'
 *                              count:
 *                                  type: integer
 *                                  example: 20
 *                              pagination:
 *                                  $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 *
 * /:
 *  get:
 *      summary: لیست آگهی‌ها روی روت اصلی (بدون صفحه‌بندی — سازگاری با نسخه‌ی قبل)
 *      tags:
 *          -   Post
 *      security: []
 *      parameters:
 *          -   in: query
 *              name: category
 *              schema:
 *                  type: string
 *              description: اسلاگ دسته‌بندی
 *          -   in: query
 *              name: search
 *              schema:
 *                  type: string
 *      responses:
 *          200:
 *              description: success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              posts:
 *                                  type: array
 *                                  items:
 *                                      $ref: '#/components/schemas/Post'
 */

/**
 * @swagger
 *
 * /post/{id}:
 *  get:
 *      summary: جزئیات یک آگهی به همراه شماره تماس آگهی‌دهنده (بدون احراز هویت)
 *      tags:
 *          -   Post
 *      security: []
 *      parameters:
 *          -   in: path
 *              name: id
 *              required: true
 *              schema:
 *                  type: integer
 *      responses:
 *          200:
 *              description: success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              post:
 *                                  allOf:
 *                                      - $ref: '#/components/schemas/Post'
 *                                      - type: object
 *                                        properties:
 *                                            userMobile:
 *                                                type: string
 *                                                example: "09121112233"
 *          400:
 *              description: شناسه نامعتبر
 *          404:
 *              description: آگهی یافت نشد
 */

/**
 * @swagger
 *
 * /post/create:
 *  get:
 *      summary: داده‌های صفحه‌ی ثبت آگهی (دسته‌بندی‌ها و آپشن‌های هر دسته)
 *      tags:
 *          -   Post
 *      security:
 *          -   BearerAuth: []
 *      parameters:
 *          -   in: query
 *              name: slug
 *              schema:
 *                  type: string
 *              description: اگر خالی باشد دسته‌های ریشه، در غیر این صورت زیرشاخه‌ها و آپشن‌ها
 *      responses:
 *          200:
 *              description: success
 *          401:
 *              description: Unauthorized
 *          404:
 *              description: دسته‌بندی یافت نشد
 *  post:
 *      summary: ثبت آگهی جدید
 *      tags:
 *          -   Post
 *      security:
 *          -   BearerAuth: []
 *      requestBody:
 *          content:
 *              multipart/form-data:
 *                  schema:
 *                      type: object
 *                      required:
 *                          -   title_post
 *                          -   category
 *                      properties:
 *                          title_post:
 *                              type: string
 *                              example: پراید ۱۳۹۰
 *                          description:
 *                              type: string
 *                              example: در حد صفر
 *                          amount:
 *                              type: number
 *                              example: 250000000
 *                          category:
 *                              type: integer
 *                              description: شناسه‌ی دسته‌بندی
 *                              example: 6
 *                          lat:
 *                              type: number
 *                              example: 35.7
 *                          lng:
 *                              type: number
 *                              example: 51.4
 *                          images:
 *                              type: array
 *                              description: حداکثر ۱۰ عکس، هرکدام تا ۳ مگابایت
 *                              items:
 *                                  type: string
 *                                  format: binary
 *      responses:
 *          200:
 *              description: آگهی ساخته شد
 *          400:
 *              description: درخواست نامعتبر
 *          401:
 *              description: Unauthorized
 */

/**
 * @swagger
 *
 * /post/my:
 *  get:
 *      summary: آگهی‌های کاربر لاگین‌شده (پنل کاربر)
 *      tags:
 *          -   Post
 *      security:
 *          -   BearerAuth: []
 *      responses:
 *          200:
 *              description: success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              posts:
 *                                  type: array
 *                                  items:
 *                                      $ref: '#/components/schemas/Post'
 *                              count:
 *                                  type: integer
 *          401:
 *              description: Unauthorized
 */

/**
 * @swagger
 *
 * /post/delete/{id}:
 *  delete:
 *      summary: حذف آگهی
 *      tags:
 *          -   Post
 *      security:
 *          -   BearerAuth: []
 *      parameters:
 *          -   in: path
 *              name: id
 *              required: true
 *              schema:
 *                  type: integer
 *      responses:
 *          200:
 *              description: آگهی حذف شد
 *          401:
 *              description: Unauthorized
 *          404:
 *              description: آگهی یافت نشد
 */
