-- Create categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY, -- ID of the category
    clerk_id VARCHAR(255) NOT NULL, -- Link to the user via Clerk ID
    name VARCHAR(50) NOT NULL, -- Name of the category
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date this category was created
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date this category was updated
    FOREIGN KEY (clerk_id) REFERENCES users (clerk_id) ON DELETE CASCADE, -- When a user is deleted, delete their categories
    UNIQUE (clerk_id, name) -- Ensure unique category names per user
);