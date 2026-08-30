/**
 * @swagger
 * tags:
 *  name: Option
 *  description: Category Dynamic Field Options Module
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *          CreateOption: 
 *              type: object
 *              required:
 *                  -   title
 *                  -   key
 *                  -   type
 *                  -   category
 *              properties:
 *                  title:
 *                      type: string
 *                      description: Field display title (e.g. Mileage, Color, Area)
 *                      example: "Mileage"
 *                  key:
 *                      type: string
 *                      description: Field identifier key
 *                      example: "mileage"
 *                  category:
 *                      type: string
 *                      description: Category ID this option belongs to
 *                      example: "1"
 *                  guid:
 *                      type: string
 *                      description: Optional user-friendly guidance or hint for the field
 *                      example: "Enter vehicle mileage in kilometers"
 *                  required:
 *                      type: boolean
 *                      description: Whether filling this field is mandatory when creating a post
 *                      default: false
 *                      example: true
 *                  type:
 *                      type: string
 *                      description: Data type of the field value
 *                      enum:
 *                          -   number
 *                          -   string
 *                          -   boolean
 *                          -   array
 *                      example: "number"
 *                  enum:
 *                      type: array
 *                      description: Allowed values list (for select dropdown fields)
 *                      items:
 *                          type: string
 *                      example: ["White", "Black", "Silver", "Gray"]
 *          UpdateOption: 
 *              type: object
 *              properties:
 *                  title:
 *                      type: string
 *                      description: Field display title
 *                      example: "Mileage"
 *                  key:
 *                      type: string
 *                      description: Field identifier key
 *                      example: "mileage"
 *                  category:
 *                      type: string
 *                      description: Category ID
 *                      example: "1"
 *                  guid:
 *                      type: string
 *                      description: Field guidance hint
 *                      example: "Enter vehicle mileage in kilometers"
 *                  required:
 *                      type: boolean
 *                      description: Is field required
 *                      example: false
 *                  type:
 *                      type: string
 *                      enum:
 *                          -   number
 *                          -   string
 *                          -   boolean
 *                          -   array
 *                      example: "number"
 *                  enum:
 *                      type: array
 *                      items:
 *                          type: string
 *                      example: ["White", "Black", "Silver"]
 */

/**
 * @swagger
 * /option:
 *  post:
 *      summary: Create a dynamic field option for a category
 *      description: Adds a new custom field attribute definition to a category. Requires Admin access.
 *      tags:
 *          -   Option
 *      security:
 *          -   BearerAuth: []
 *      requestBody:
 *          required: true
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateOption'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateOption'
 *      responses:
 *          201: 
 *              description: Option created successfully
 *          400:
 *              description: Bad request - Missing or invalid fields
 *          401:
 *              description: Unauthorized
 *          403:
 *              description: Forbidden - Admin access required
 *          409:
 *              description: Option with this key already exists in this category
 */

/**
 * @swagger
 * /option/{id}:
 *  put:
 *      summary: Update option by ID
 *      description: Updates an existing dynamic field option definition. Requires Admin access.
 *      tags:
 *          -   Option
 *      security:
 *          -   BearerAuth: []
 *      parameters:
 *          -   in: path
 *              name: id
 *              required: true
 *              schema:
 *                  type: integer
 *              description: Option ID
 *      requestBody:
 *          required: true
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/UpdateOption'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/UpdateOption'
 *      responses:
 *          200: 
 *              description: Option updated successfully
 *          400:
 *              description: Bad request
 *          401:
 *              description: Unauthorized
 *          403:
 *              description: Forbidden - Admin access required
 *          404:
 *              description: Option not found
 */

/**
 * @swagger
 * /option/by-category/{categoryId}:
 *  get:
 *      summary: Get all options for a specific category by Category ID
 *      description: Retrieves all dynamic field definitions associated with the category and inherited from parent categories.
 *      tags:
 *          -   Option
 *      security: []
 *      parameters:
 *          -   in: path        
 *              name: categoryId
 *              required: true
 *              schema:
 *                  type: integer
 *              description: Category ID
 *      responses:
 *          200: 
 *              description: Options list retrieved successfully
 */

/**
 * @swagger
 * /option/by-category-slug/{slug}:
 *  get:
 *      summary: Get all options for a category by Category Slug
 *      description: Retrieves all dynamic field definitions for a category matching the slug.
 *      tags:
 *          -   Option
 *      security: []
 *      parameters:
 *          -   in: path        
 *              name: slug
 *              required: true
 *              schema:
 *                  type: string
 *              description: Category slug (e.g. cars, real-estate)
 *      responses:
 *          200: 
 *              description: Options list retrieved successfully
 *          404:
 *              description: Category not found
 */

/**
 * @swagger
 * /option/{id}:
 *  get:
 *      summary: Get option by ID
 *      description: Retrieves details of a specific option definition.
 *      tags:
 *          -   Option
 *      security: []
 *      parameters:
 *          -   in: path        
 *              name: id
 *              required: true
 *              schema:
 *                  type: integer
 *              description: Option ID
 *      responses:
 *          200: 
 *              description: Option details retrieved successfully
 *          404:
 *              description: Option not found
 */

/**
 * @swagger
 * /option:
 *  get:
 *      summary: Get all options list
 *      description: Retrieves a list of all dynamic options across all categories.
 *      tags:
 *          -   Option
 *      security: []
 *      responses:
 *          200: 
 *              description: All options retrieved successfully
 */

/**
 * @swagger
 * /option/{id}:
 *  delete:
 *      summary: Delete option by ID
 *      description: Deletes an option definition by ID. Requires Admin access.
 *      tags:
 *          -   Option
 *      security:
 *          -   BearerAuth: []
 *      parameters:
 *          -   in: path        
 *              name: id
 *              required: true
 *              schema:
 *                  type: integer
 *              description: Option ID
 *      responses:
 *          200: 
 *              description: Option deleted successfully
 *          401:
 *              description: Unauthorized
 *          403:
 *              description: Forbidden - Admin access required
 *          404:
 *              description: Option not found
 */