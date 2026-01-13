<?php

    if (!isset($conn) || !($conn instanceof mysqli)) {
        return;
    }

    // FINAL NORMALIZED DATABASE (3NF)
    // NOTE: This creates NEW table names (users/subscriptions/transactions/etc).
    // Your existing PHP queries must be updated to match these names/columns.
    
    // 1) users
    $conn->query("CREATE TABLE IF NOT EXISTS users (
        userid INT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        gender ENUM('male','female','other') NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Gender is set later (subscription flow). Ensure column is nullable even on existing DBs.
    $conn->query("ALTER TABLE users MODIFY gender ENUM('male','female','other') NULL");

    // 2) otp (User OTPs)
    $conn->query("CREATE TABLE IF NOT EXISTS otp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userid INT NOT NULL,
        otp CHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    )");

    // 3) activity_log
    $conn->query("CREATE TABLE IF NOT EXISTS activity_log (
        logid INT AUTO_INCREMENT PRIMARY KEY,
        userid INT NOT NULL,
        event VARCHAR(255) NOT NULL,
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
    )");

    // 4) plans
    $conn->query("CREATE TABLE IF NOT EXISTS plans (
        planid INT AUTO_INCREMENT PRIMARY KEY,
        goal VARCHAR(100) NOT NULL,
        diet VARCHAR(100) NOT NULL,
        mealtype VARCHAR(100) NOT NULL,
        duration_days INT NOT NULL,
        price DECIMAL(10,2) NOT NULL
    )");

    // 5) meals
    $conn->query("CREATE TABLE IF NOT EXISTS meals (
        mealid INT AUTO_INCREMENT PRIMARY KEY,
        meal_name VARCHAR(100) NOT NULL UNIQUE
    )");

    // 6) plan_meals (Many-to-Many)
    $conn->query("CREATE TABLE IF NOT EXISTS plan_meals (
        planid INT NOT NULL,
        mealid INT NOT NULL,
        PRIMARY KEY (planid, mealid),
        FOREIGN KEY (planid) REFERENCES plans(planid) ON DELETE CASCADE,
        FOREIGN KEY (mealid) REFERENCES meals(mealid) ON DELETE CASCADE
    )");

    // 7) subscriptions
    $conn->query("CREATE TABLE IF NOT EXISTS subscriptions (
        subscriptionid INT AUTO_INCREMENT PRIMARY KEY,
        userid INT NOT NULL,
        planid INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('active','expired','cancelled') DEFAULT 'active',
        FOREIGN KEY (userid) REFERENCES users(userid),
        FOREIGN KEY (planid) REFERENCES plans(planid)
    )");

    // 8) transactions
    $conn->query("CREATE TABLE IF NOT EXISTS transactions (
        transactionid VARCHAR(100) PRIMARY KEY,
        subscriptionid INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50),
        payment_status ENUM('success','failed','pending') NOT NULL,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subscriptionid) REFERENCES subscriptions(subscriptionid)
    )");

    // 9) admin
    $conn->query("CREATE TABLE IF NOT EXISTS admin (
        adminid INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 10) admin_otp
    $conn->query("CREATE TABLE IF NOT EXISTS admin_otp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        adminid INT NOT NULL,
        otp CHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        is_used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (adminid) REFERENCES admin(adminid) ON DELETE CASCADE
    )");

?>