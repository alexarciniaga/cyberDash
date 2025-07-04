-- Initialize cyberdash database
-- This file is executed when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The database 'cyberdash' is already created by the POSTGRES_DB environment variable
-- Tables will be created by Drizzle migrations

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'CyberDash database initialized successfully';
END $$; 