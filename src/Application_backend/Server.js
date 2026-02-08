/*
* Name: Server.js
* Description: Backend server setup using Express.js and PostgreSQL.
* Author: Tumelo George
* Date: November 22, 2025
*/
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./DB.js');
const Pool = db.pool;
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config({path: '.env'});

const app = express();
const port = process.env.PORT || 4000;

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Admin Authorization Middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Test DB connection
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await Pool.query('SELECT NOW()');
        res.json({ message: 'Database connected successfully', time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// =====================================================
// AUTHENTICATION ENDPOINTS
// =====================================================

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { email, password, first_name, last_name, phone } = req.body;

    try {
        // Validate email format
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate phone format (flexible for international formats)
        const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Phone must be 7-20 characters, can include +, spaces, dashes, parentheses' });
        }

        // Check if user exists
        const userExists = await Pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const result = await Pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone, role) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING user_id, email, first_name, last_name, phone, role, created_at`,
            [email, password_hash, first_name, last_name, phone, 'customer']
        );

        const user = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user,
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user
        const result = await Pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await Pool.query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1',
            [user.user_id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Don't send password hash to client
        delete user.password_hash;

        res.json({
            message: 'Login successful',
            user,
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get current user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await Pool.query(
            'SELECT user_id, email, first_name, last_name, phone, role, is_verified, created_at FROM users WHERE user_id = $1',
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// =====================================================
// ADMIN USER MANAGEMENT ENDPOINTS
// =====================================================

// POST admin register - Create user as admin
app.post('/api/auth/admin/register', authenticateToken, /*requireAdmin,*/ async (req, res) => {
    const { email, password, first_name, last_name, phone, role } = req.body;

    try {
        // Validate email format
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Validate phone format (flexible for international formats)
        const phoneRegex = /^\+?[0-9\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Phone must be 7-20 characters, can include +, spaces, dashes, parentheses' });
        }

        // Check if user exists
        const userExists = await Pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user with specified role
        const result = await Pool.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING user_id, email, first_name, last_name, phone, role, is_active, created_at`,
            [email, password_hash, first_name, last_name, phone, role || 'customer', true]
        );

        const user = result.rows[0];

        res.status(201).json({
            message: 'User created successfully',
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during user creation' });
    }
});

// GET all users (Admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await Pool.query(
            `SELECT user_id, email, first_name, last_name, phone, role, is_active, created_at, last_login_at
             FROM users
             ORDER BY created_at DESC`
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

// GET single user (Admin only)
app.get('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
    const { userId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const result = await Pool.query(
            `SELECT user_id, email, first_name, last_name, phone, role, is_active, created_at, last_login_at
             FROM users
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to fetch user' });
    }
});

// PUT update user role (Admin only)
app.put('/api/admin/users/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const validRoles = ['customer', 'moderator', 'admin', 'staff'];
    
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const result = await Pool.query(
            `UPDATE users
             SET role = $1
             WHERE user_id = $2
             RETURNING user_id, email, first_name, last_name, phone, role, is_active, created_at`,
            [role, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'User role updated successfully',
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update user role' });
    }
});

// PUT update user status (Admin only)
app.put('/api/admin/users/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { is_active } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const result = await Pool.query(
            `UPDATE users
             SET is_active = $1
             WHERE user_id = $2
             RETURNING user_id, email, first_name, last_name, phone, role, is_active, created_at`,
            [is_active, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update user status' });
    }
});

// POST reset user password (Admin only)
app.post('/api/admin/users/:userId/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    const { userId } = req.params;
    const { new_password } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (!new_password || new_password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    try {
        // Hash new password
        const password_hash = await bcrypt.hash(new_password, 10);

        const result = await Pool.query(
            `UPDATE users
             SET password_hash = $1
             WHERE user_id = $2
             RETURNING user_id, email, first_name, last_name, phone, role, is_active, created_at`,
            [password_hash, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            message: 'Password reset successfully',
            user: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

// DELETE user (Admin only)
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
    const { userId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const client = await Pool.connect();

    try {
        await client.query('BEGIN');

        // Check if user exists
        const userResult = await client.query(
            'SELECT * FROM users WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user's cart items
        await client.query(
            'DELETE FROM cart_items WHERE user_id = $1',
            [userId]
        );

        // Delete user's addresses
        await client.query(
            'DELETE FROM addresses WHERE user_id = $1',
            [userId]
        );

        // Delete user's orders (cascade will handle order_items)
        await client.query(
            'DELETE FROM orders WHERE user_id = $1',
            [userId]
        );

        // Delete user
        await client.query(
            'DELETE FROM users WHERE user_id = $1',
            [userId]
        );

        await client.query('COMMIT');

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Failed to delete user' });
    } finally {
        client.release();
    }
});

// POST send promotions to users (Admin only)
app.post('/api/admin/users/send-promotions', authenticateToken, requireAdmin, async (req, res) => {
    const { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({ message: 'user_ids must be a non-empty array' });
    }

    try {
        // Fetch users
        const placeholders = user_ids.map((_, i) => `$${i + 1}`).join(',');
        const result = await Pool.query(
            `SELECT user_id, email, first_name
             FROM users
             WHERE user_id = ANY($1::text[])`,
            [user_ids]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        // In a real application, you would send emails here
        // For now, just log the action
        console.log(`Promotions sent to ${result.rows.length} users:`, result.rows.map(u => u.email));

        res.json({
            message: `Promotions sent to ${result.rows.length} users`,
            users_count: result.rows.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to send promotions' });
    }
});

// =====================================================
// PRODUCT ENDPOINTS
// =====================================================

// GET all products with filters
app.get('/api/products', async (req, res) => {
    const { category, featured, search, sort = 'created_at', order = 'DESC', limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT p.*, c.name as category_name, c.slug as category_slug,
                   (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_primary = TRUE LIMIT 1) as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            WHERE p.is_active = TRUE
        `;
        const params = [];
        let paramCount = 1;

        // Add filters
        if (category) {
            query += ` AND c.slug = $${paramCount}`;
            params.push(category);
            paramCount++;
        }

        if (featured === 'true') {
            query += ` AND p.is_featured = TRUE`;
        }

        if (search) {
            query += ` AND (p.name ILIKE $${paramCount} OR p.short_description ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        // Add sorting
        const validSortColumns = ['created_at', 'price', 'name', 'rating'];
        const validOrders = ['ASC', 'DESC'];
        const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
        const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

        query += ` ORDER BY p.${sortColumn} ${sortOrder}`;

        // Add pagination
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await Pool.query(query, params);

        // Get total count
        const countResult = await Pool.query(
            'SELECT COUNT(*) FROM products WHERE is_active = TRUE'
        );

        res.json({
            products: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching products' });
    }
});

// GET single product by slug
app.get('/api/products/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await Pool.query(
            `SELECT p.*, c.name as category_name, c.slug as category_slug,
                    array_agg(DISTINCT pi.image_url) FILTER (WHERE pi.image_url IS NOT NULL) as images,
                    array_agg(DISTINCT jsonb_build_object('key', ps.spec_key, 'value', ps.spec_value)) FILTER (WHERE ps.spec_key IS NOT NULL) as specifications,
                    array_agg(DISTINCT pb.benefit_text) FILTER (WHERE pb.benefit_text IS NOT NULL) as benefits
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.category_id
             LEFT JOIN product_images pi ON p.product_id = pi.product_id
             LEFT JOIN product_specifications ps ON p.product_id = ps.product_id
             LEFT JOIN product_benefits pb ON p.product_id = pb.product_id
             WHERE p.slug = $1 AND p.is_active = TRUE
             GROUP BY p.product_id, c.name, c.slug`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Increment view count
        await Pool.query(
            'UPDATE products SET views_count = views_count + 1 WHERE product_id = $1',
            [result.rows[0].product_id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching product' });
    }
});

// POST create product (Admin only)
app.post('/api/products', authenticateToken, requireAdmin, async (req, res) => {
    const {
        category_id, name, slug, short_description, full_description,
        price, compare_at_price, unit, sku, stock_quantity,
        is_featured, emoji, gradient_class, benefits, specifications
    } = req.body;

    const client = await Pool.connect();

    try {
        await client.query('BEGIN');

        // Insert product
        const productResult = await client.query(
            `INSERT INTO products (
                category_id, name, slug, short_description, full_description,
                price, compare_at_price, unit, sku, stock_quantity,
                is_featured, emoji, gradient_class
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                category_id, name, slug, short_description, full_description,
                price, compare_at_price, unit, sku, stock_quantity,
                is_featured || false, emoji, gradient_class
            ]
        );

        const product = productResult.rows[0];

        // Insert benefits
        if (benefits && Array.isArray(benefits)) {
            for (let i = 0; i < benefits.length; i++) {
                await client.query(
                    'INSERT INTO product_benefits (product_id, benefit_text, display_order) VALUES ($1, $2, $3)',
                    [product.product_id, benefits[i], i]
                );
            }
        }

        // Insert specifications
        if (specifications && typeof specifications === 'object') {
            let i = 0;
            for (const [key, value] of Object.entries(specifications)) {
                await client.query(
                    'INSERT INTO product_specifications (product_id, spec_key, spec_value, display_order) VALUES ($1, $2, $3, $4)',
                    [product.product_id, key, value, i]
                );
                i++;
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Product created successfully',
            product
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error creating product' });
    } finally {
        client.release();
    }
});

// PUT update product (Admin only)
app.put('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const {
        name, slug, short_description, full_description, price,
        compare_at_price, unit, stock_quantity, is_active, is_featured
    } = req.body;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Invalid product ID format' });
    }

    try {
        const result = await Pool.query(
            `UPDATE products 
             SET name = COALESCE($1, name),
                 slug = COALESCE($2, slug),
                 short_description = COALESCE($3, short_description),
                 full_description = COALESCE($4, full_description),
                 price = COALESCE($5, price),
                 compare_at_price = COALESCE($6, compare_at_price),
                 unit = COALESCE($7, unit),
                 stock_quantity = COALESCE($8, stock_quantity),
                 is_active = COALESCE($9, is_active),
                 is_featured = COALESCE($10, is_featured)
             WHERE product_id = $11
             RETURNING *`,
            [name, slug, short_description, full_description, price, compare_at_price, unit, stock_quantity, is_active, is_featured, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            message: 'Product updated successfully',
            product: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating product' });
    }
});

// DELETE product (Admin only)
app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Invalid product ID format' });
    }

    try {
        // Soft delete by setting is_active to false
        const result = await Pool.query(
            'UPDATE products SET is_active = FALSE WHERE product_id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting product' });
    }
});

// =====================================================
// CATEGORY ENDPOINTS
// =====================================================

// GET all categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await Pool.query(
            `SELECT c.*, 
                    (SELECT COUNT(*) FROM products WHERE category_id = c.category_id AND is_active = TRUE) as product_count
             FROM categories c
             WHERE c.is_active = TRUE
             ORDER BY c.display_order, c.name`
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching categories' });
    }
});

// =====================================================
// CART ENDPOINTS
// =====================================================

// GET user cart
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const result = await Pool.query(
            `SELECT ci.*, p.name, p.price, p.slug, p.emoji, p.gradient_class, p.stock_quantity, p.unit
             FROM cart_items ci
             JOIN products p ON ci.product_id = p.product_id
             WHERE ci.user_id = $1`,
            [req.user.user_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching cart' });
    }
});

// POST add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    const { product_id, quantity } = req.body;

    try {
        // Check if product exists and is in stock
        const productResult = await Pool.query(
            'SELECT * FROM products WHERE product_id = $1 AND is_active = TRUE',
            [product_id]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = productResult.rows[0];

        if (product.stock_quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Check if item already in cart
        const existingItem = await Pool.query(
            'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
            [req.user.user_id, product_id]
        );

        let result;
        if (existingItem.rows.length > 0) {
            // Update quantity
            result = await Pool.query(
                'UPDATE cart_items SET quantity = quantity + $1 WHERE cart_item_id = $2 RETURNING *',
                [quantity, existingItem.rows[0].cart_item_id]
            );
        } else {
            // Insert new item
            result = await Pool.query(
                'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
                [req.user.user_id, product_id, quantity]
            );
        }

        res.status(201).json({
            message: 'Item added to cart',
            cart_item: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding to cart' });
    }
});

// PUT update cart item quantity
app.put('/api/cart/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    try {
        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            await Pool.query(
                'DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2',
                [id, req.user.user_id]
            );
            return res.json({ message: 'Item removed from cart' });
        }

        const result = await Pool.query(
            'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3 RETURNING *',
            [quantity, id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.json({
            message: 'Cart updated',
            cart_item: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating cart' });
    }
});

// DELETE remove from cart
app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Pool.query(
            'DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cart item not found' });
        }

        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error removing from cart' });
    }
});

// DELETE clear cart
app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        await Pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.user_id]);
        res.json({ message: 'Cart cleared successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error clearing cart' });
    }
});

// =====================================================
// ORDER ENDPOINTS
// =====================================================

// POST create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    const {
        items, delivery_address, payment_method,
        subtotal, delivery_fee, total_amount, notes
    } = req.body;

    const client = await Pool.connect();

    try {
        await client.query('BEGIN');

        // Create order
        const orderResult = await client.query(
            `INSERT INTO orders (
                user_id, customer_name, customer_email, customer_phone,
                delivery_address_line1, delivery_city,
                subtotal, delivery_fee, total_amount,
                payment_method, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                req.user.user_id,
                delivery_address.full_name,
                req.user.email,
                delivery_address.phone,
                delivery_address.address_line1,
                delivery_address.city,
                subtotal,
                delivery_fee,
                total_amount,
                payment_method,
                notes
            ]
        );

        const order = orderResult.rows[0];

        // Insert order items and update inventory
        for (const item of items) {
            // Check stock
            const productResult = await client.query(
                'SELECT * FROM products WHERE product_id = $1',
                [item.product_id]
            );

            if (productResult.rows.length === 0) {
                throw new Error(`Product ${item.product_id} not found`);
            }

            const product = productResult.rows[0];

            if (product.stock_quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }

            // Insert order item
            await client.query(
                `INSERT INTO order_items (
                    order_id, product_id, product_name, product_sku,
                    unit_price, quantity, subtotal
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    order.order_id,
                    item.product_id,
                    product.name,
                    product.sku,
                    product.price,
                    item.quantity,
                    product.price * item.quantity
                ]
            );

            // Update inventory
            const newQuantity = product.stock_quantity - item.quantity;
            await client.query(
                'UPDATE products SET stock_quantity = $1 WHERE product_id = $2',
                [newQuantity, item.product_id]
            );

            // Log inventory transaction
            await client.query(
                `INSERT INTO inventory_transactions (
                    product_id, transaction_type, quantity,
                    previous_quantity, new_quantity, reference_id, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    item.product_id,
                    'sale',
                    item.quantity,
                    product.stock_quantity,
                    newQuantity,
                    order.order_id,
                    req.user.user_id
                ]
            );
        }

        // Clear user's cart
        await client.query(
            'DELETE FROM cart_items WHERE user_id = $1',
            [req.user.user_id]
        );

        await client.query('COMMIT');

        // Fetch complete order with items
        const completeOrder = await Pool.query(
            `SELECT o.*, 
                    json_agg(
                        json_build_object(
                            'product_name', oi.product_name,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'subtotal', oi.subtotal
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.order_id = oi.order_id
             WHERE o.order_id = $1
             GROUP BY o.order_id`,
            [order.order_id]
        );

        res.status(201).json({
            message: 'Order created successfully',
            order: completeOrder.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: err.message || 'Server error creating order' });
    } finally {
        client.release();
    }
});

// GET user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const result = await Pool.query(
            `SELECT o.*, 
                    COUNT(oi.order_item_id) as item_count
             FROM orders o
             LEFT JOIN order_items oi ON o.order_id = oi.order_id
             WHERE o.user_id = $1
             GROUP BY o.order_id
             ORDER BY o.created_at DESC`,
            [req.user.user_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
});

// GET single order details
app.get('/api/orders/:order_number', authenticateToken, async (req, res) => {
    const { order_number } = req.params;

    try {
        const result = await Pool.query(
            `SELECT o.*, 
                    json_agg(
                        json_build_object(
                            'product_name', oi.product_name,
                            'product_sku', oi.product_sku,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'subtotal', oi.subtotal
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.order_id = oi.order_id
             WHERE o.order_number = $1 AND o.user_id = $2
             GROUP BY o.order_id`,
            [order_number, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching order' });
    }
});

// =====================================================
// ADMIN ORDER MANAGEMENT
// =====================================================

// GET all orders (Admin only)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT o.*, 
                   u.email as user_email,
                   COUNT(oi.order_item_id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.user_id
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
        `;
        const params = [];
        let paramCount = 1;

        if (status) {
            query += ` WHERE o.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        query += ` GROUP BY o.order_id, u.email ORDER BY o.created_at DESC`;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await Pool.query(query, params);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
});

// PUT update order status (Admin only)
app.put('/api/admin/orders/:order_number/status', authenticateToken, requireAdmin, async (req, res) => {
    const { order_number } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await Pool.query(
            'UPDATE orders SET status = $1 WHERE order_number = $2 RETURNING *',
            [status, order_number]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            message: 'Order status updated',
            order: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating order' });
    }
});

// =====================================================
// ADDRESS ENDPOINTS
// =====================================================

// GET user addresses
app.get('/api/addresses', authenticateToken, async (req, res) => {
    try {
        const result = await Pool.query(
            'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
            [req.user.user_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching addresses' });
    }
});

// POST create address
app.post('/api/addresses', authenticateToken, async (req, res) => {
    const {
        full_name, phone, address_line1, address_line2,
        city, postal_code, is_default
    } = req.body;

    const client = await Pool.connect();

    try {
        await client.query('BEGIN');

        // If this is set as default, unset other defaults
        if (is_default) {
            await client.query(
                'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
                [req.user.user_id]
            );
        }

        const result = await client.query(
            `INSERT INTO addresses (
                user_id, full_name, phone, address_line1, address_line2,
                city, postal_code, is_default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
                        [req.user.user_id, full_name, phone, address_line1, address_line2, city, postal_code, is_default || false]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Address added successfully',
            address: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error creating address' });
    } finally {
        client.release();
    }
});

// PUT update address
app.put('/api/addresses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        full_name, phone, address_line1, address_line2,
        city, postal_code, is_default
    } = req.body;

    const client = await Pool.connect();

    try {
        await client.query('BEGIN');

        // If user sets as default, unset others
        if (is_default) {
            await client.query(
                'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
                [req.user.user_id]
            );
        }

        const result = await client.query(
            `UPDATE addresses 
             SET full_name = COALESCE($1, full_name),
                 phone = COALESCE($2, phone),
                 address_line1 = COALESCE($3, address_line1),
                 address_line2 = COALESCE($4, address_line2),
                 city = COALESCE($5, city),
                 postal_code = COALESCE($6, postal_code),
                 is_default = COALESCE($7, is_default)
             WHERE address_id = $8 AND user_id = $9
             RETURNING *`,
            [full_name, phone, address_line1, address_line2, city, postal_code, is_default, id, req.user.user_id]
        );

        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json({
            message: 'Address updated successfully',
            address: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Server error updating address' });
    } finally {
        client.release();
    }
});

// DELETE address
app.delete('/api/addresses/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Pool.query(
            'DELETE FROM addresses WHERE address_id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error deleting address' });
    }
});

// =====================================================
// ROOT & SERVER STARTUP
// =====================================================

app.get('/', (req, res) => {
    res.send('🟢 E-Commerce API Server is running successfully.');
});

// Start the server
app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
});
