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
            # Create ENUM types for PostgreSQL
            cur.execute("""
                DO $$ BEGIN
                    CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other');
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
            """)
            
            cur.execute("""
                DO $$ BEGIN
                    CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
            """)
            
            cur.execute("""
                DO $$ BEGIN
                    CREATE TYPE payment_status AS ENUM ('success', 'failed', 'pending');
                EXCEPTION
                    WHEN duplicate_object THEN NULL;
                END $$;
            """)

            # Create tables with PostgreSQL syntax
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    userid INT PRIMARY KEY,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    gender gender_enum NULL DEFAULT 'other',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS otp (
                    id SERIAL PRIMARY KEY,
                    userid INT NOT NULL,
                    otp CHAR(6) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    is_used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE
                )
                """
            )
            
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS activity_log (
                    logid SERIAL PRIMARY KEY,
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
                    planid SERIAL PRIMARY KEY,
                    goal VARCHAR(100) NOT NULL,
                    diet VARCHAR(100) NOT NULL,
                    mealtype VARCHAR(100) NOT NULL,
                    duration_days INT NOT NULL,
                    price NUMERIC(10,2) NOT NULL
                )
                """
            )
            
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS meals (
                    mealid SERIAL PRIMARY KEY,
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
                    subscriptionid SERIAL PRIMARY KEY,
                    userid INT NOT NULL,
                    planid INT NOT NULL,
                    start_date DATE NOT NULL,
                    end_date DATE NOT NULL,
                    status subscription_status DEFAULT 'active',
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
                    amount NUMERIC(10,2) NOT NULL,
                    payment_method VARCHAR(50),
                    payment_status payment_status NOT NULL,
                    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (subscriptionid) REFERENCES subscriptions(subscriptionid)
                )
                """
            )
            
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS admin (
                    adminid SERIAL PRIMARY KEY,
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
                    id SERIAL PRIMARY KEY,
                    adminid INT NOT NULL,
                    otp CHAR(6) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    is_used BOOLEAN DEFAULT FALSE,
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
