-- Create database
CREATE DATABASE IF NOT EXISTS payroll_management;
USE payroll_management;

-- Create departments table
CREATE TABLE departments (
    department_code VARCHAR(10) PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    gross_salary DECIMAL(10, 2) NOT NULL,
    total_deduction DECIMAL(10, 2) NOT NULL
);

-- Create employees table
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    department_code VARCHAR(10) NOT NULL,
    position VARCHAR(100) NOT NULL,
    net_salary DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (department_code) REFERENCES departments(department_code)
);

-- Create users table for authentication
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
);

-- Insert initial department data
INSERT INTO departments (department_code, department_name, gross_salary, total_deduction) VALUES
('CW', 'Carwash', 300000.00, 20000.00),
('ST', 'Stock', 300000.00, 5000.00),
('MC', 'Mechanic', 450000.00, 40000.00),
('ADMIS', 'Administration Staff', 600000.00, 70000.00);

-- Insert sample users (password is 'password123' hashed)
INSERT INTO users (username, password, role) VALUES
('admin', '$2b$10$YourHashedPasswordHere', 'admin'),
('user1', '$2b$10$YourHashedPasswordHere', 'user'),
('user2', '$2b$10$YourHashedPasswordHere', 'user');

-- Insert sample employees
INSERT INTO employees (first_name, last_name, department_code, position, net_salary) VALUES
('John', 'Doe', 'CW', 'Senior Washer', 280000.00),
('Jane', 'Smith', 'ST', 'Stock Manager', 295000.00),
('Mike', 'Johnson', 'MC', 'Head Mechanic', 410000.00),
('Sarah', 'Williams', 'ADMIS', 'Administrative Officer', 530000.00); 