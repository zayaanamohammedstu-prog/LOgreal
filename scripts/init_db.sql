-- LogGuard Database Initialization
-- This script runs once when the PostgreSQL container first starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes will be handled by SQLAlchemy migrations
-- This file just ensures extensions are available

SELECT 'LogGuard database initialized successfully' AS status;
