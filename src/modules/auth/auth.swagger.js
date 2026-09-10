/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: Authentication and Authorization Module
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
 *                      description: User Iranian mobile phone number (e.g. 09121234567)
 *                      example: "09121234567"
 *          CheckOTP:
 *              type: object
 *              required:
 *                  -   mobile
 *                  -   code
 *              properties:
 *                  mobile:
 *                      type: string
 *                      description: User Iranian mobile phone number
 *                      example: "09121234567"
 *                  code:
 *                      type: string
 *                      description: 5-digit verification OTP code
 *                      example: "12345"
 *          CheckRefreshToken:
 *              type: object
 *              required:
 *                  -   refreshToken
 *              properties:
 *                  refreshToken:
 *                      type: string
 *                      description: Valid JWT refresh token
 *                      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 *
 * /auth/send-otp:
 *  post:
 *      summary: Request One-Time Password (OTP)
 *      description: >
 *          Sends a 5-digit OTP verification code to the provided mobile number.
 *          In development / MVP mode (when MELI_TOKEN is not set or OTP_DEBUG_RETURN=true),
 *          the OTP code is returned directly in the response `code` field to facilitate testing without an active SMS panel.
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
 *              description: OTP code sent successfully
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
 *                                  description: Code expiration timestamp (milliseconds)
 *                                  example: 1785669314511
 *                              code:
 *                                  type: string
 *                                  description: Present only in debug mode / when SMS panel is not configured
 *                                  example: "67756"
 *          400:
 *              description: Previous OTP code has not expired yet or invalid mobile number
 *          429:
 *              description: Too many OTP requests — max 3 per 2 minutes per IP+mobile
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
 *                                  example: "تعداد درخواست ارسال کد تایید بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید."
 *                              retryAfterSeconds:
 *                                  type: integer
 *                                  example: 120
 */

/**
 * @swagger
 *
 * /auth/check-otp:
 *  post:
 *      summary: Verify OTP code and authenticate user
 *      description: Validates the OTP code for the given mobile number. On success, returns JWT access and refresh tokens.
 *      tags:
 *          -   Auth
 *      security: []
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
 *              description: User authenticated successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: You're Logged In Successfully , Welcome .
 *                              accessToken:
 *                                  type: string
 *                                  description: JWT access token
 *                                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                              refreshToken:
 *                                  type: string
 *                                  description: JWT refresh token
 *                                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *          400:
 *              description: OTP code is invalid or expired
 *          404:
 *              description: User not found
 *          429:
 *              description: Too many OTP check attempts — max 5 per 5 minutes per IP+mobile
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
 *                                  example: "تعداد تلاش‌های بررسی کد تایید بیش از حد مجاز است. لطفاً چند دقیقه صبر کنید."
 *                              retryAfterSeconds:
 *                                  type: integer
 *                                  example: 300
 */

/**
 * @swagger
 *
 * /auth/check-refresh-token:
 *  post:
 *      summary: Refresh authentication tokens
 *      description: Validates the refresh token and issues a new pair of access and refresh tokens.
 *      tags:
 *          -   Auth
 *      security: []
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
 *              description: Tokens refreshed successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              accessToken:
 *                                  type: string
 *                                  description: New JWT access token
 *                              refreshToken:
 *                                  type: string
 *                                  description: New JWT refresh token
 *          401:
 *              description: Invalid or expired refresh token
 */

/**
 * @swagger
 *
 * /auth/logout:
 *  get:
 *      summary: Log out user and clear authentication cookies
 *      tags:
 *          -   Auth
 *      security:
 *          -   BearerAuth: []
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
 *                                  example: Successfully Logged Out, Back Here Again .
 *          401:
 *              description: Unauthorized - Valid JWT Bearer token required
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: login on your account.
 */
