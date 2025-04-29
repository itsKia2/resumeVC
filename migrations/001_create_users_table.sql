-- Create users Table
CREATE TABLE users (
    clerk_id VARCHAR(255) PRIMARY KEY, -- Clerk's unique user ID
    email VARCHAR(100) NOT NULL UNIQUE, -- User's email, as provided by Clerk
    name VARCHAR(50) NOT NULL UNIQUE, -- User's full name, as provided by Clerk
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date this user was created
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Date this user was updated
);