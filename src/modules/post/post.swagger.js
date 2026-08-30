/**
 * @swagger
 * tags:
 *  name: Post
 *  description: Classified Ads Module — Public Listings, Search, Creation, Updates, and Management
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
 *           description: Unique post ID
 *           example: 12
 *         _id:
 *           type: integer
 *           description: Alias of id for backward compatibility with frontend clients
 *           example: 12
 *         title:
 *           type: string
 *           description: Ad title
 *           example: "Toyota Camry 2020"
 *         content:
 *           type: string
 *           description: Ad detailed description
 *           example: "Well maintained, low mileage, excellent condition."
 *         amount:
 *           type: number
 *           description: Ad price in Tomans / Rials (0 for negotiable)
 *           example: 250000000
 *         userId:
 *           type: integer
 *           description: Author user ID
 *           example: 3
 *         categoryId:
 *           type: integer
 *           description: Category ID
 *           example: 6
 *         province:
 *           type: string
 *           nullable: true
 *           description: Province name (resolved via Map.ir reverse geocoding)
 *           example: "Tehran"
 *         city:
 *           type: string
 *           nullable: true
 *           description: City name
 *           example: "Tehran"
 *         district:
 *           type: string
 *           nullable: true
 *           description: District / Neighborhood name
 *           example: "Saadat Abad"
 *         address:
 *           type: string
 *           nullable: true
 *           description: Formatted street address
 *           example: "Kaj Square, Tehran"
 *         coordinate:
 *           type: array
 *           description: Geographical coordinates [latitude, longitude]
 *           items:
 *             type: number
 *           example: [35.78, 51.37]
 *         images:
 *           type: array
 *           description: List of uploaded image URLs / paths
 *           items:
 *             type: string
 *           example: ["upload/1700290342224.webp"]
 *         options:
 *           type: object
 *           description: Key-value map of dynamic category options
 *           example: { mileage: "45000", color: "White" }
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
 *               description: Name of the assigned category
 *               example: "Sedan Cars"
 *             categorySlug:
 *               type: string
 *               description: Slug of the assigned category
 *               example: "cars"
 *             categoryIcon:
 *               type: string
 *               description: Category icon name
 *               example: "car-side"
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Items per page
 *           example: 20
 *         total:
 *           type: integer
 *           description: Total number of matching items
 *           example: 137
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *           example: 7
 */

/**
 * @swagger
 *
 * /post:
 *  get:
 *      summary: Get paginated public ads listing for Landing / Feed (Public)
 *      description: >
 *          Returns a paginated list of classified ads with optional category and keyword search filters.
 *          Filtering by a parent category automatically includes ads from all of its descendant subcategories.
 *      tags:
 *          -   Post
 *      security: []
 *      parameters:
 *          -   in: query
 *              name: page
 *              schema:
 *                  type: integer
 *                  default: 1
 *              description: Page number for pagination
 *          -   in: query
 *              name: limit
 *              schema:
 *                  type: integer
 *                  default: 20
 *                  maximum: 50
 *              description: Number of items per page
 *          -   in: query
 *              name: category
 *              schema:
 *                  type: string
 *              description: Category slug filter (e.g. cars, real-estate)
 *          -   in: query
 *              name: search
 *              schema:
 *                  type: string
 *              description: Search query matching post title and content
 *      responses:
 *          200:
 *              description: Successfully retrieved posts list
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
 *      summary: Root endpoint ads listing (Legacy non-paginated format)
 *      description: Returns classified ads list on the root path for backward compatibility.
 *      tags:
 *          -   Post
 *      security: []
 *      parameters:
 *          -   in: query
 *              name: category
 *              schema:
 *                  type: string
 *              description: Category slug filter
 *          -   in: query
 *              name: search
 *              schema:
 *                  type: string
 *              description: Search keyword
 *      responses:
 *          200:
 *              description: Successfully retrieved posts list
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
 *      summary: Get ad details by ID with publisher contact information (Public)
 *      description: Retrieves full details of a specific ad including the publisher's mobile phone number and all category dynamic attributes.
 *      tags:
 *          -   Post
 *      security: []
 *      parameters:
 *          -   in: path
 *              name: id
 *              required: true
 *              schema:
 *                  type: integer
 *              description: Post ID
 *      responses:
 *          200:
 *              description: Post details retrieved successfully
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
 *              description: Invalid post ID
 *          404:
 *              description: Post not found
 */

/**
 * @swagger
 *
 * /post/create:
 *  get:
 *      summary: Get form metadata for post creation (Categories and Dynamic Options)
 *      description: Fetches category tree and dynamic field options needed by the frontend form wizard when creating a post.
 *      tags:
 *          -   Post
 *      security:
 *          -   BearerAuth: []
 *      parameters:
 *          -   in: query
 *              name: slug
 *              schema:
 *                  type: string
 *              description: Category slug. If omitted, returns root categories. If provided, returns child categories and dynamic options.
 *      responses:
 *          200:
 *              description: Category metadata and form options retrieved successfully
 *          401:
 *              description: Unauthorized
 *          404:
 *              description: Category not found
 *  post:
 *      summary: Create a new classified ad
 *      description: Submits a new ad with multipart/form-data, uploaded images (up to 10 images, max 3MB each), location coordinates (with automatic reverse geocoding via Map.ir), and dynamic category options.
 *      tags:
 *          -   Post
 *      security:
 *          -   BearerAuth: []
 *      requestBody:
 *          required: true
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
 *                              description: Title of the ad
 *                              example: "Toyota Camry 2020"
 *                          description:
 *                              type: string
 *                              description: Content / description of the ad
 *                              example: "Well maintained, single owner."
 *                          amount:
 *                              type: number
 *                              description: Price in Tomans
 *                              example: 250000000
 *                          category:
 *                              type: integer
 *                              description: Target Category ID
 *                              example: 6
 *                          lat:
 *                              type: number
 *                              description: Latitude coordinate
 *                              example: 35.78
 *                          lng:
 *                              type: number
 *                              description: Longitude coordinate
 *                              example: 51.37
 *                          images:
 *                              type: array
 *                              description: Up to 10 image files (JPEG, PNG, WEBP, max 3MB each)
 *                              items:
 *                                  type: string
 *                                  format: binary
 *      responses:
 *          200:
 *              description: Ad created successfully
 *          400:
 *              description: Invalid request data
 *          401:
 *              description: Unauthorized
 */

/**
 * @swagger
 *
 * /post/update/{id}:
 *  put:
 *      summary: Update an existing classified ad
 *      description: Updates an existing ad owned by the authenticated user. Supports updating images, location, price, description, and custom category fields.
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
 *              description: Post ID to update
 *      requestBody:
 *          content:
 *              multipart/form-data:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          title_post:
 *                              type: string
 *                              example: "Toyota Camry 2020"
 *                          description:
 *                              type: string
 *                              example: "Updated description text"
 *                          amount:
 *                              type: number
 *                              example: 260000000
 *                          category:
 *                              type: integer
 *                              example: 6
 *                          lat:
 *                              type: number
 *                              example: 35.78
 *                          lng:
 *                              type: number
 *                              example: 51.37
 *                          images:
 *                              type: array
 *                              items:
 *                                  type: string
 *                                  format: binary
 *      responses:
 *          200:
 *              description: Ad updated successfully
 *          400:
 *              description: Invalid request data
 *          401:
 *              description: Unauthorized
 *          403:
 *              description: Forbidden - User is not the owner of this ad
 *          404:
 *              description: Ad not found
 */

/**
 * @swagger
 *
 * /post/my:
 *  get:
 *      summary: Get logged-in user's ads (User Dashboard)
 *      description: Returns a list of all ads posted by the currently authenticated user.
 *      tags:
 *          -   Post
 *      security:
 *          -   BearerAuth: []
 *      responses:
 *          200:
 *              description: Successfully retrieved user's posts
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
 *                                  example: 5
 *          401:
 *              description: Unauthorized
 */

/**
 * @swagger
 *
 * /post/delete/{id}:
 *  delete:
 *      summary: Delete a classified ad by ID
 *      description: Deletes an ad by its ID.
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
 *              description: Ad ID to delete
 *      responses:
 *          200:
 *              description: Ad deleted successfully
 *          401:
 *              description: Unauthorized
 *          404:
 *              description: Ad not found
 */

/**
 * @swagger
 *
 * /post/scrape:
 *  post:
 *      summary: Scrape and import listings from an external Sheypoor URL
 *      description: Crawls ads from an external Sheypoor URL and imports them directly into the database under the selected category.
 *      tags:
 *          -   Post
 *      security:
 *          -   BearerAuth: []
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      required:
 *                          -   url
 *                          -   categoryId
 *                      properties:
 *                          url:
 *                              type: string
 *                              description: Sheypoor category URL to scrape
 *                              example: "https://www.sheypoor.com/iran/vehicles"
 *                          categoryId:
 *                              type: integer
 *                              description: Target Category ID
 *                              example: 6
 *      responses:
 *          200:
 *              description: Scraping and post import completed
 *          400:
 *              description: Bad request - Missing URL or category ID
 *          401:
 *              description: Unauthorized
 *          500:
 *              description: Scraping error
 */
