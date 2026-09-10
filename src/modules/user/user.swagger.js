/**
 * @swagger
 * tags:
 *  name: User
 *  description: User Profile and Account Management Module
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *          UserProfile:
 *              type: object
 *              properties:
 *                  id:
 *                      type: integer
 *                      example: 1
 *                  mobile:
 *                      type: string
 *                      example: "09121112233"
 *                  fullName:
 *                      type: string
 *                      nullable: true
 *                      example: "John Doe"
 *                  role:
 *                      type: string
 *                      enum: [USER, ADMIN]
 *                      example: "USER"
 *                  verifiedMobile:
 *                      type: boolean
 *                      example: true
 *                  createdAt:
 *                      type: string
 *                      format: date-time
 */

/**
 * @swagger
 * 
 * /user/whoami:
 *  get:
 *      summary: Get currently authenticated user profile
 *      description: Returns the profile data of the user identified by the Bearer JWT token in the Authorization header.
 *      tags:
 *          -   User
 *      security:
 *          -   BearerAuth: []
 *      responses:
 *          200:
 *              description: User profile retrieved successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          $ref: '#/components/schemas/UserProfile'
 *          401:
 *              description: Unauthorized - Missing or invalid token
 *          429:
 *              description: Too many requests — max 60 per minute per user
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              statusCode:
 *                                  type: integer
 *                                  example: 429
 *                              message:
 *                                  type: string
 *                                  example: "تعداد درخواست‌های پروفایل بیش از حد مجاز است. لطفاً کمی صبر کنید."
 *                              retryAfterSeconds:
 *                                  type: integer
 *                                  example: 60
 */
