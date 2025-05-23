const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database connection with connection pooling
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'payroll_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Convert pool query to promise
const query = (sql, values) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, values, (error, results) => {
            if (error) reject(error);
            resolve(results);
        });
    });
};

// Database initialization
const initializeDatabase = async () => {
    try {
        // Create users table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Users table ready');

        // Create or update default admin user
        const adminExists = await query('SELECT id FROM users WHERE username = ?', ['admin']);
        const hashedPassword = await bcrypt.hash('123@', 10);
        
        if (adminExists.length === 0) {
            // Create new admin user
            await query(
                'INSERT INTO users (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
                ['admin', hashedPassword, 'System Administrator', 'admin@epms.com', 'admin']
            );
            console.log('Default admin user created');
        } else {
            // Update existing admin password
            await query(
                'UPDATE users SET password = ? WHERE username = ?',
                [hashedPassword, 'admin']
            );
            console.log('Admin password updated to 123@');
        }

        // Create departments table
        await query(`
            CREATE TABLE IF NOT EXISTS departments (
                department_code VARCHAR(50) PRIMARY KEY,
                department_name VARCHAR(100) NOT NULL,
                gross_salary DECIMAL(10, 2) DEFAULT 0,
                total_deduction DECIMAL(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Departments table ready');

        // Create employees table
        await query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                department_code VARCHAR(50) NOT NULL,
                position VARCHAR(100) NOT NULL,
                net_salary DECIMAL(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_code) REFERENCES departments(department_code)
            )
        `);
        console.log('Employees table ready');

        // Create salary_transactions table
        await query(`
            CREATE TABLE IF NOT EXISTS salary_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                transaction_date DATE NOT NULL,
                basic_salary DECIMAL(10, 2) NOT NULL,
                allowances DECIMAL(10, 2) DEFAULT 0,
                deductions DECIMAL(10, 2) DEFAULT 0,
                net_amount DECIMAL(10, 2) NOT NULL,
                payment_status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
                payment_date TIMESTAMP NULL,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            )
        `);
        console.log('Salary transactions table ready');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
};

// Initialize database and start server
const startServer = async () => {
    try {
        await initializeDatabase();
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Please try a different port.`);
                process.exit(1);
            } else {
                console.error('Server error:', err);
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Authentication Routes
app.post('/api/register', [
    body('username').notEmpty().trim(),
    body('password').isLength({ min: 6 }),
    body('full_name').notEmpty().trim(),
    body('email').isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password, full_name, email } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if username or email already exists
        const results = await query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (results.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Insert new user
        const result = await query(
            'INSERT INTO users (username, password, full_name, email) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, full_name, email]
        );

        // Get the newly created user
        const newUser = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        const user = newUser[0];

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                role: user.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;

        res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Error during registration' });
    }
});

app.post('/api/login', [
    body('username').notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password } = req.body;

        const results = await query('SELECT * FROM users WHERE username = ?', [username]);
        if (results.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                role: user.role 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;

        res.json({ 
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Error during login' });
    }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Department CRUD Operations
app.get('/api/departments', verifyToken, async (req, res) => {
    try {
        const results = await query('SELECT * FROM departments');
        res.json(results);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/departments/:code', verifyToken, async (req, res) => {
    try {
        const results = await query('SELECT * FROM departments WHERE department_code = ?', [req.params.code]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/departments', [
    verifyToken,
    body('department_code').notEmpty(),
    body('department_name').notEmpty(),
    body('gross_salary').isNumeric(),
    body('total_deduction').isNumeric()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { department_code, department_name, gross_salary, total_deduction } = req.body;

    try {
        await query(
            'INSERT INTO departments (department_code, department_name, gross_salary, total_deduction) VALUES (?, ?, ?, ?)',
            [department_code, department_name, gross_salary, total_deduction]
        );
        res.status(201).json({ message: 'Department created successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/departments/:code', [
    verifyToken,
    body('department_name').notEmpty(),
    body('gross_salary').isNumeric(),
    body('total_deduction').isNumeric()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { department_name, gross_salary, total_deduction } = req.body;

    try {
        const result = await query(
            'UPDATE departments SET department_name = ?, gross_salary = ?, total_deduction = ? WHERE department_code = ?',
            [department_name, gross_salary, total_deduction, req.params.code]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.json({ message: 'Department updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/departments/:code', verifyToken, async (req, res) => {
    try {
        const result = await query(
            'DELETE FROM departments WHERE department_code = ?',
            [req.params.code]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Employee CRUD Operations
app.get('/api/employees', verifyToken, async (req, res) => {
    try {
        const results = await query(`
            SELECT e.*, d.department_name 
            FROM employees e 
            JOIN departments d ON e.department_code = d.department_code
        `);
        res.json(results);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/employees/:id', verifyToken, async (req, res) => {
    try {
        const results = await query(`
            SELECT e.*, d.department_name 
            FROM employees e 
            JOIN departments d ON e.department_code = d.department_code 
            WHERE e.id = ?
        `, [req.params.id]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(results[0]);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/employees', verifyToken, [
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('department_code').notEmpty().trim(),
    body('position').notEmpty().trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, department_code, position } = req.body;

    try {
        // First get the department's salary details
        const results = await query('SELECT gross_salary, total_deduction FROM departments WHERE department_code = ?', [department_code]);
        if (results.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        const { gross_salary, total_deduction } = results[0];
        const net_salary = gross_salary - total_deduction;

        // Then create the employee
        const result = await query(
            'INSERT INTO employees (first_name, last_name, department_code, position, net_salary) VALUES (?, ?, ?, ?, ?)',
            [first_name, last_name, department_code, position, net_salary]
        );
        res.status(201).json({
            message: 'Employee created successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ error: 'Error creating employee' });
    }
});

app.put('/api/employees/:id', [
    verifyToken,
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('department_code').notEmpty(),
    body('position').notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { first_name, last_name, department_code, position } = req.body;

    // First get the department's salary details
    const results = await query('SELECT gross_salary, total_deduction FROM departments WHERE department_code = ?', [department_code]);
    if (results.length === 0) {
        return res.status(404).json({ error: 'Department not found' });
    }

    const { gross_salary, total_deduction } = results[0];
    const net_salary = gross_salary - total_deduction;

    // Then update the employee
    const result = await query(
        'UPDATE employees SET first_name = ?, last_name = ?, department_code = ?, position = ?, net_salary = ? WHERE id = ?',
        [first_name, last_name, department_code, position, net_salary, req.params.id]
    );
    if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee updated successfully' });
});

app.delete('/api/employees/:id', verifyToken, async (req, res) => {
    try {
        const result = await query(
            'DELETE FROM employees WHERE id = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Salary Management Routes
app.post('/api/salary/transactions', [
    verifyToken,
    body('employee_id').isNumeric(),
    body('transaction_date').isDate(),
    body('basic_salary').isNumeric(),
    body('allowances').isNumeric().optional(),
    body('deductions').isNumeric().optional(),
    body('remarks').optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { 
            employee_id, 
            transaction_date, 
            basic_salary, 
            allowances = 0, 
            deductions = 0, 
            remarks 
        } = req.body;

        const net_amount = basic_salary + allowances - deductions;

        const result = await query(
            `INSERT INTO salary_transactions 
            (employee_id, transaction_date, basic_salary, allowances, deductions, net_amount, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [employee_id, transaction_date, basic_salary, allowances, deductions, net_amount, remarks]
        );

        res.status(201).json({
            message: 'Salary transaction created successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating salary transaction:', error);
        res.status(500).json({ error: 'Error creating salary transaction' });
    }
});

app.get('/api/salary/transactions', verifyToken, async (req, res) => {
    try {
        const results = await query(`
            SELECT 
                st.*,
                CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                e.department_code,
                d.department_name
            FROM salary_transactions st
            JOIN employees e ON st.employee_id = e.id
            JOIN departments d ON e.department_code = d.department_code
            ORDER BY st.transaction_date DESC
        `);
        res.json(results);
    } catch (error) {
        console.error('Error fetching salary transactions:', error);
        res.status(500).json({ error: 'Error fetching salary transactions' });
    }
});

app.get('/api/salary/report', verifyToken, async (req, res) => {
    try {
        const { start_date, end_date, department_code } = req.query;
        let query_str = `
            SELECT 
                d.department_name,
                COUNT(DISTINCT st.employee_id) as employee_count,
                SUM(st.basic_salary) as total_basic_salary,
                SUM(st.allowances) as total_allowances,
                SUM(st.deductions) as total_deductions,
                SUM(st.net_amount) as total_net_amount
            FROM salary_transactions st
            JOIN employees e ON st.employee_id = e.id
            JOIN departments d ON e.department_code = d.department_code
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            query_str += ` AND st.transaction_date >= ?`;
            params.push(start_date);
        }
        if (end_date) {
            query_str += ` AND st.transaction_date <= ?`;
            params.push(end_date);
        }
        if (department_code) {
            query_str += ` AND e.department_code = ?`;
            params.push(department_code);
        }

        query_str += ` GROUP BY d.department_code, d.department_name`;

        const results = await query(query_str, params);
        res.json(results);
    } catch (error) {
        console.error('Error generating salary report:', error);
        res.status(500).json({ error: 'Error generating salary report' });
    }
});

app.put('/api/salary/transactions/:id/status', [
    verifyToken,
    body('status').isIn(['pending', 'paid', 'cancelled']),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { status } = req.body;
        const payment_date = status === 'paid' ? new Date() : null;

        const result = await query(
            'UPDATE salary_transactions SET payment_status = ?, payment_date = ? WHERE id = ?',
            [status, payment_date, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Salary transaction not found' });
        }

        res.json({ message: 'Salary transaction status updated successfully' });
    } catch (error) {
        console.error('Error updating salary transaction:', error);
        res.status(500).json({ error: 'Error updating salary transaction' });
    }
}); 