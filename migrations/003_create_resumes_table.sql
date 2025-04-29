-- Create resumes Table
CREATE TABLE resumes (
    id SERIAL PRIMARY KEY, -- ID of the resume
    clerk_id VARCHAR(255) NOT NULL, -- Link to the user via Clerk ID
    category_id INT NULL, -- Link to the category (optional)
    name VARCHAR(100) NOT NULL, -- Describes this version of the resume
    link TEXT NOT NULL, -- Store the link to the resume
    date DATE NOT NULL, -- User-specified date
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date this resume was added to the database
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Date this resume was updated in the database
    FOREIGN KEY (clerk_id) REFERENCES users (clerk_id) ON DELETE CASCADE, -- When a user is deleted, delete their resumes
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL -- When a category is deleted from the account, nullify relevant resumes' categories
);