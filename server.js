require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Explicit CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(express.json());

// Database pool configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

// Function to execute SQL file
async function runSqlFile(filePath) {
  try {
    const sql = fs.readFileSync(path.resolve(__dirname, filePath)).toString();
    await pool.query(sql);
    console.log('SQL file executed successfully');
  } catch (err) {
    console.error('Error executing SQL file:', err);
  }
}

// Test DB connection route
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ success: true, message: 'Database connection successful', time: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed', error: error.message });
  }
});

// Root endpoint shows ALL raw data
app.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM dry_beans');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Swagger setup
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dry Beans API',
      version: '1.0.0',
      description: 'Complete CRUD API for Dry Beans Dataset',
      contact: {
        name: "Your Name",
        email: "your.email@example.com"
      }
    },
    servers: [{ url: 'http://localhost:3001' }],
    components: {
      schemas: {
        Bean: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Unique bean identifier' },
            area: { type: 'number', example: 28395 },
            perimeter: { type: 'number', example: 610.291 },
            major_axis: { type: 'number', example: 208.178 },
            minor_axis: { type: 'number', example: 173.889 },
            aspect_ratio: { type: 'number', example: 1.197 },
            eccentricity: { type: 'number', example: 0.550 },
            convex_area: { type: 'number', example: 28715 },
            equiv_diameter: { type: 'number', example: 190.141 },
            extent: { type: 'number', example: 0.764 },
            solidity: { type: 'number', example: 0.989 },
            roundness: { type: 'number', example: 0.958 },
            compactness: { type: 'number', example: 0.913 },
            shape_factor1: { type: 'number', example: 0.007 },
            shape_factor2: { type: 'number', example: 0.003 },
            shape_factor3: { type: 'number', example: 0.834 },
            shape_factor4: { type: 'number', example: 0.999 },
            bean_class: { 
              type: 'string', 
              example: 'SEKER',
              enum: ['DERMASON', 'SIRA', 'SEKER', 'HOROZ', 'CALI', 'BARBUNYA', 'BOMBAY']
            },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        BeanInput: {
          type: 'object',
          properties: {
            area: { type: 'number', example: 28395 },
            perimeter: { type: 'number', example: 610.291 },
            major_axis: { type: 'number', example: 208.178 },
            minor_axis: { type: 'number', example: 173.889 },
            aspect_ratio: { type: 'number', example: 1.197 },
            eccentricity: { type: 'number', example: 0.550 },
            convex_area: { type: 'number', example: 28715 },
            equiv_diameter: { type: 'number', example: 190.141 },
            extent: { type: 'number', example: 0.764 },
            solidity: { type: 'number', example: 0.989 },
            roundness: { type: 'number', example: 0.958 },
            compactness: { type: 'number', example: 0.913 },
            shape_factor1: { type: 'number', example: 0.007 },
            shape_factor2: { type: 'number', example: 0.003 },
            shape_factor3: { type: 'number', example: 0.834 },
            shape_factor4: { type: 'number', example: 0.999 },
            bean_class: { 
              type: 'string', 
              example: 'SEKER',
              enum: ['DERMASON', 'SIRA', 'SEKER', 'HOROZ', 'CALI', 'BARBUNYA', 'BOMBAY']
            }
          }
        }
      }
    }
  },
  apis: ['./server.js']
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * tags:
 *   name: Beans
 *   description: Dry beans management
 */

/**
 * @swagger
 * /beans:
 *   get:
 *     tags: [Beans]
 *     summary: Get all beans
 *     description: Retrieve complete list of all beans from the database
 *     responses:
 *       200:
 *         description: Full list of all beans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Bean'
 */
app.get('/beans', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM dry_beans');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } 
});

// GET single bean
/**
 * @swagger
 * /beans/{id}:
 *   get:
 *     tags: [Beans]
 *     summary: Get a bean by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The bean ID
 *     responses:
 *       200:
 *         description: Bean details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bean'
 *       404:
 *         description: Bean not found
 */
app.get('/beans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM dry_beans WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Bean not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create new bean
/**
 * @swagger
 * /beans:
 *   post:
 *     tags: [Beans]
 *     summary: Create a new bean
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BeanInput'
 *     responses:
 *       201:
 *         description: Bean created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bean'
 *       400:
 *         description: Invalid input
 */
app.post('/beans', async (req, res) => {
  try {
    const { 
      area, 
      perimeter, 
      major_axis, 
      minor_axis, 
      bean_class,
      aspect_ratio,
      eccentricity,
      convex_area,
      equiv_diameter,
      extent,
      solidity,
      roundness,
      compactness,
      shape_factor1,
      shape_factor2,
      shape_factor3,
      shape_factor4
    } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO dry_beans (
        area, perimeter, major_axis, minor_axis, bean_class,
        aspect_ratio, eccentricity, convex_area, equiv_diameter,
        extent, solidity, roundness, compactness,
        shape_factor1, shape_factor2, shape_factor3, shape_factor4
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16, $17
      ) RETURNING *`,
      [
        area, perimeter, major_axis, minor_axis, bean_class,
        aspect_ratio, eccentricity, convex_area, equiv_diameter,
        extent, solidity, roundness, compactness,
        shape_factor1, shape_factor2, shape_factor3, shape_factor4
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update bean
/**
 * @swagger
 * /beans/{id}:
 *   put:
 *     tags: [Beans]
 *     summary: Update a bean
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The bean ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BeanInput'
 *     responses:
 *       200:
 *         description: Bean updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Bean'
 *       404:
 *         description: Bean not found
 */
app.put('/beans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      area, 
      perimeter, 
      major_axis, 
      minor_axis, 
      bean_class,
      aspect_ratio,
      eccentricity,
      convex_area,
      equiv_diameter,
      extent,
      solidity,
      roundness,
      compactness,
      shape_factor1,
      shape_factor2,
      shape_factor3,
      shape_factor4
    } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE dry_beans SET 
        area = $1, perimeter = $2, major_axis = $3, minor_axis = $4, 
        bean_class = $5, aspect_ratio = $6, eccentricity = $7, 
        convex_area = $8, equiv_diameter = $9, extent = $10, 
        solidity = $11, roundness = $12, compactness = $13,
        shape_factor1 = $14, shape_factor2 = $15, shape_factor3 = $16, shape_factor4 = $17
      WHERE id = $18 RETURNING *`,
      [
        area, perimeter, major_axis, minor_axis, bean_class,
        aspect_ratio, eccentricity, convex_area, equiv_diameter,
        extent, solidity, roundness, compactness,
        shape_factor1, shape_factor2, shape_factor3, shape_factor4,
        id
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Bean not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE bean
/**
 * @swagger
 * /beans/{id}:
 *   delete:
 *     tags: [Beans]
 *     summary: Delete a bean
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The bean ID
 *     responses:
 *       204:
 *         description: Bean deleted
 *       404:
 *         description: Bean not found
 */
app.delete('/beans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM dry_beans WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Bean not found' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /test-connection:
 *   get:
 *     tags: [System]
 *     summary: Test server connection
 *     description: Verify that the server is running and responding
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server connection test successful
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     docs:
 *                       type: string
 *                       example: /api-docs
 *                     beans:
 *                       type: string
 *                       example: /beans
 *                     testDb:
 *                       type: string
 *                       example: /test-db
 */
app.get('/test-connection', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server connection test successful',
    endpoints: {
      docs: '/api-docs',
      beans: '/beans',
      testDb: '/test-db'
    }
  });
});

// Start server and run SQL optimizations
app.listen(process.env.PORT || 3001, async () => {
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`);
  console.log(`API docs: http://localhost:${process.env.PORT || 3000}/api-docs`);
  console.log(`Test Connection: http://localhost:${process.env.PORT || 3000}/test-connection`);
  
  // Run database optimization script
  await runSqlFile('./database/database.sql');
});