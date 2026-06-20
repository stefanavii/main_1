-- schema.sql
-- This is just a reference copy of the database structure.
-- You don't need to run this manually — server.js creates this
-- automatically the first time it runs. This file is here so you
-- can see the structure in MySQL Workbench if you want to.

CREATE DATABASE IF NOT EXISTS agent_vacancy_db CHARACTER SET utf8mb4;

USE agent_vacancy_db;

CREATE TABLE IF NOT EXISTS applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  nic_number VARCHAR(20) NOT NULL,
  submitted_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  nic_number VARCHAR(20) NOT NULL,
  submitted_at DATETIME NOT NULL
);

-- To view all submitted applicants in MySQL Workbench, run:
-- SELECT * FROM applicants ORDER BY id DESC;

-- To view all AI course enrollments, run:
-- SELECT * FROM enrollments ORDER BY id DESC;
