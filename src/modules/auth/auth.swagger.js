/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Auth Module and Routes
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *          SendOTP:
 *              type: object
 *              required:
 *                  -   mobile
 *              properties:
 *                  mobile:
 *                      type: string
 *          CheckOTP:
 *              type: object
 *              required:
 *                  -   mobile
 *                  -   code
 *              properties:
 *                  mobile:
 *                      type: string
 *                  code:
 *                      type: string
 *          CheckRefreshToken:
 *              type: object
 *              required:
 *                  -   refreshToken
 *              properties:
 *                  refreshToken:
 *                      type: string
 */

/**
 * @swagger
 *
 * /auth/send-otp:
 *  post:
 *      summary: login with OTP in this end-point
 *      description: >
 *          در حالت MVP که پنل پیامک تنظیم نشده (MELI_TOKEN خالی) یا
 *          OTP_DEBUG_RETURN=true باشد، خود کد تایید در فیلد `code` برگردانده
 *          می‌شود تا فرانت بتواند بدون ارسال پیامک تست لاگین انجام دهد.
 *      tags:
 *          -   Auth
 *      security: []
 *      requestBody:
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/SendOTP'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/SendOTP'
 *      responses:
 *          200:
 *              description: success
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: OTP Sent Successfully.
 *                              expiresIn:
 *                                  type: integer
 *                                  description: زمان انقضای کد (timestamp میلی‌ثانیه)
 *                                  example: 1785669314511
 *                              code:
 *                                  type: string
 *                                  description: فقط در حالت تست/بدون پنل پیامک
 *                                  example: "67756"
 *          400:
 *              description: کد قبلی هنوز منقضی نشده
 */
/**
 * @swagger
 *
 * /auth/check-otp:
 *  post:
 *      summary: check otp for login user
 *      tags:
 *          -   Auth
 *      requestBody:
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/CheckOTP'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/CheckOTP'
 *      responses:
 *          200:
 *              description: success
 */
/**
 * @swagger
 *
 * /auth/check-refresh-token:
 *  post:
 *      summary: check refreshToken for login user
 *      tags:
 *          -   Auth
 *      requestBody:
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/CheckRefreshToken'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/CheckRefreshToken'
 *      responses:
 *          200:
 *              description: success
 */

/**
 * @swagger
 *
 * /auth/logout:
 *  get:
 *      summary: Logout user and clear tokens
 *      tags:
 *          -   Auth
 *      security:
 *          -   bearerAuth: []
 *      responses:
 *          200:
 *              description: Successfully logged out
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: logged out successfully
 *          401:
 *              description: Unauthorized
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: login on your account
 */
