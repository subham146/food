from typing import Optional

from db import get_connection


_schema_initialized = False


def initialize_schema(conn: Optional[object] = None) -> None:
    global _schema_initialized

    if _schema_initialized:
        return

    db_conn = conn
    owns_connection = False

    if db_conn is None:
        db_conn = get_connection()
        owns_connection = True

    try:
        with db_conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    userid INT PRIMARY KEY,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    gender ENUM('male','female','other') NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cur.execute("ALTER TABLE users MODIFY gender ENUM('male','female','other') NULL")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS otp (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    userid INT NOT NULL,
                    otp CHAR(6) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    is_used TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS activity_log (
                    logid INT AUTO_INCREMENT PRIMARY KEY,
                    userid INT NOT NULL,
                    event VARCHAR(255) NOT NULL,
                    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS plans (
                    planid INT AUTO_INCREMENT PRIMARY KEY,
                    goal VARCHAR(100) NOT NULL,
                    diet VARCHAR(100) NOT NULL,
                    mealtype VARCHAR(100) NOT NULL,
                    duration_days INT NOT NULL,
                    price DECIMAL(10,2) NOT NULL
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS meals (
                    mealid INT AUTO_INCREMENT PRIMARY KEY,
                    meal_name VARCHAR(100) NOT NULL UNIQUE
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS plan_meals (
                    planid INT NOT NULL,
                    mealid INT NOT NULL,
                    PRIMARY KEY (planid, mealid),
                    FOREIGN KEY (planid) REFERENCES plans(planid) ON DELETE CASCADE,
                    FOREIGN KEY (mealid) REFERENCES meals(mealid) ON DELETE CASCADE
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS subscriptions (
                    subscriptionid INT AUTO_INCREMENT PRIMARY KEY,
                    userid INT NOT NULL,
                    planid INT NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    status ENUM('active','expired','cancelled') DEFAULT 'active',
                    FOREIGN KEY (userid) REFERENCES users(userid),
                    FOREIGN KEY (planid) REFERENCES plans(planid)
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS transactions (
                    transactionid VARCHAR(100) PRIMARY KEY,
                    subscriptionid INT NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    payment_method VARCHAR(50),
                    payment_status ENUM('success','failed','pending') NOT NULL,
                    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (subscriptionid) REFERENCES subscriptions(subscriptionid)
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS admin (
                    adminid INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS admin_otp (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    adminid INT NOT NULL,
                    otp CHAR(6) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    is_used TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (adminid) REFERENCES admin(adminid) ON DELETE CASCADE
                )
                """
            )
        db_conn.commit()
        _schema_initialized = True
    finally:
        if owns_connection:
            db_conn.close()
