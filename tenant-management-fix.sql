-- Fix for Tenant Management - Run this in Supabase SQL Editor
-- This ensures all required columns exist with proper defaults

-- Add missing columns to tenants table if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'status') THEN
        ALTER TABLE tenants ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
    END IF;

    -- Add settings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'settings') THEN
        ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{}';
    END IF;

    -- Add subscription_plan column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'subscription_plan') THEN
        ALTER TABLE tenants ADD COLUMN subscription_plan TEXT DEFAULT 'basic';
    END IF;

    -- Add max_users column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'max_users') THEN
        ALTER TABLE tenants ADD COLUMN max_users INTEGER DEFAULT 10;
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'created_by') THEN
        ALTER TABLE tenants ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'updated_at') THEN
        ALTER TABLE tenants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add missing columns to user_profiles table if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'status') THEN
        ALTER TABLE user_profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
    END IF;

    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_login') THEN
        ALTER TABLE user_profiles ADD COLUMN last_login TIMESTAMPTZ;
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'created_by') THEN
        ALTER TABLE user_profiles ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add permissions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'permissions') THEN
        ALTER TABLE user_profiles ADD COLUMN permissions JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by ON tenants(created_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_by ON user_profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login);

-- Update existing tenants to have default values
UPDATE tenants 
SET 
    status = COALESCE(status, 'active'),
    settings = COALESCE(settings, '{}'),
    subscription_plan = COALESCE(subscription_plan, 'basic'),
    max_users = COALESCE(max_users, 10),
    updated_at = COALESCE(updated_at, NOW())
WHERE status IS NULL OR settings IS NULL OR subscription_plan IS NULL OR max_users IS NULL OR updated_at IS NULL;

-- Update existing user profiles to have default values
UPDATE user_profiles 
SET 
    status = COALESCE(status, 'active'),
    permissions = COALESCE(permissions, '{}')
WHERE status IS NULL OR permissions IS NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

SELECT 'Tenant management database fix completed successfully!' as message;
