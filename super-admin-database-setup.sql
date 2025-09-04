-- Super Admin Features Database Setup
-- Run this after the basic setup is complete

-- Update tenants table with more fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_created_by ON tenants(created_by);

-- Update user_profiles with more fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_by ON user_profiles(created_by);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login);

-- Enhanced RLS Policies for tenants table

-- Enable RLS on tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Super admins can see all tenants
DROP POLICY IF EXISTS "Super admins can view all tenants" ON tenants;
CREATE POLICY "Super admins can view all tenants" ON tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'super_admin'
        )
    );

-- Super admins can manage all tenants
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON tenants;
CREATE POLICY "Super admins can manage all tenants" ON tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'super_admin'
        )
    );

-- Tenant admins can see their own tenant
DROP POLICY IF EXISTS "Tenant admins can view their tenant" ON tenants;
CREATE POLICY "Tenant admins can view their tenant" ON tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'tenant_admin' 
            AND up.tenant_id = tenants.id
        )
    );

-- Enhanced RLS Policies for user_profiles

-- Super admins can manage all user profiles
DROP POLICY IF EXISTS "Super admins can manage all user profiles" ON user_profiles;
CREATE POLICY "Super admins can manage all user profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'super_admin'
        )
    );

-- Tenant admins can manage users in their tenant (except other admins)
DROP POLICY IF EXISTS "Tenant admins can manage their tenant users" ON user_profiles;
CREATE POLICY "Tenant admins can manage their tenant users" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'tenant_admin' 
            AND up.tenant_id = user_profiles.tenant_id
        )
        AND user_profiles.role = 'tenant_user'
    );

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

-- Function to track user login
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles 
    SET last_login = NOW() 
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login on auth
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW 
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION public.update_last_login();

-- Grant permissions
GRANT ALL ON tenants TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'super_admin') as super_admins,
    COUNT(*) FILTER (WHERE role = 'tenant_admin') as tenant_admins,
    COUNT(*) FILTER (WHERE role = 'tenant_user') as tenant_users,
    COUNT(*) FILTER (WHERE status = 'active') as active_users,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
    COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as recent_logins
FROM user_profiles;

-- Create view for tenant statistics
CREATE OR REPLACE VIEW tenant_stats AS
SELECT 
    COUNT(*) as total_tenants,
    COUNT(*) FILTER (WHERE status = 'active') as active_tenants,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_tenants,
    COUNT(*) FILTER (WHERE status = 'suspended') as suspended_tenants
FROM tenants;

-- Grant access to views
GRANT SELECT ON user_stats TO authenticated;
GRANT SELECT ON tenant_stats TO authenticated;

SELECT 'Super Admin database setup completed successfully!' as message;
