-- Fix password_hash column to allow NULL for Firebase users
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;
