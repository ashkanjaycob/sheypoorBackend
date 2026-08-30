/**
 * @swagger
 * tags:
 *  name: Category
 *  description: Category and Hierarchy Management Module
 */

/**
 * @swagger
 *  components:
 *      schemas:
 *          CreateCategory:
 *              type: object
 *              required:
 *                  -   name
 *                  -   icon
 *              properties:
 *                  name:
 *                      type: string
 *                      description: Category display name
 *                      example: "Vehicles"
 *                  slug:
 *                      type: string
 *                      description: Category URL slug (auto-generated if omitted)
 *                      example: "vehicles"
 *                  icon:
 *                      type: string
 *                      description: Icon name or class identifier
 *                      example: "car"
 *                  parent:
 *                      type: string
 *                      description: Parent category ID (leave empty for root categories)
 *                      example: "1"
 *          CategoryItem:
 *              type: object
 *              properties:
 *                  id:
 *                      type: integer
 *                      example: 1
 *                  name:
 *                      type: string
 *                      example: "Vehicles"
 *                  slug:
 *                      type: string
 *                      example: "vehicles"
 *                  icon:
 *                      type: string
 *                      example: "car"
 *                  parentId:
 *                      type: integer
 *                      nullable: true
 *                      example: null
 *                  children:
 *                      type: array
 *                      items:
 *                          $ref: '#/components/schemas/CategoryItem'
 */

/**
 * @swagger
 * /category:
 *  post:
 *      summary: Create a new category
 *      description: Creates a new root category or subcategory and updates the closure ancestor table. Requires Admin access.
 *      tags:
 *          -   Category
 *      security:
 *          -   BearerAuth: []
 *      requestBody:
 *          required: true
 *          content:
 *              application/x-www-form-urlencoded:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateCategory'
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/CreateCategory'
 *      responses:
 *          201: 
 *              description: Category created successfully
 *          400:
 *              description: Bad request - Missing required fields or invalid parent ID
 *          401:
 *              description: Unauthorized
 *          403:
 *              description: Forbidden - Admin privileges required
 *          409:
 *              description: Category already exists
 */

/**
 * @swagger
 * /category:
 *  get:
 *      summary: Get full hierarchical category tree
 *      description: Retrieves all categories organized as a nested tree with child categories and dynamic options.
 *      tags:
 *          -   Category
 *      security: []
 *      responses:
 *          200: 
 *              description: Category tree retrieved successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              $ref: '#/components/schemas/CategoryItem'
 */

/**
 * @swagger
 * /category/{id}:
 *  delete:
 *      summary: Delete category by ID
 *      description: Deletes a category along with all its descendants and associated options. Requires Admin access.
 *      tags:
 *          -   Category
 *      security:
 *          -   BearerAuth: []
 *      parameters:
 *          -   in: path
 *              name: id
 *              required: true
 *              schema:
 *                  type: integer
 *              description: Category ID to delete
 *      responses:
 *          200: 
 *              description: Category deleted successfully
 *          401:
 *              description: Unauthorized
 *          403:
 *              description: Forbidden - Admin privileges required
 *          404:
 *              description: Category not found
 */