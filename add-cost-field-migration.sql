-- Migration: Add cost field to products table
-- This adds a cost field to track the cost price of products
-- Cost must be less than or equal to the selling price

-- Add cost column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost NUMERIC;

-- Add a check constraint to ensure cost is less than or equal to price
ALTER TABLE products ADD CONSTRAINT check_cost_less_than_price 
    CHECK (cost IS NULL OR cost <= price);

-- Add comment to the cost column
COMMENT ON COLUMN products.cost IS 'Cost price of the product (must be less than or equal to selling price)';

-- Update existing products to have a default cost of 0 if needed
UPDATE products SET cost = 0 WHERE cost IS NULL;

-- Make cost NOT NULL after setting default values
ALTER TABLE products ALTER COLUMN cost SET NOT NULL;
ALTER TABLE products ALTER COLUMN cost SET DEFAULT 0;
