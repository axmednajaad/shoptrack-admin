-- ShopTrack Admin Panel - Role-based Access Control Setup
-- Run this SQL in your Supabase SQL Editor

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'tenant_user');

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'tenant_user',
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles table

-- Super admins can see all profiles
CREATE POLICY "Super admins can view all user profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'super_admin'
        )
    );

-- Tenant admins can see profiles in their tenant
CREATE POLICY "Tenant admins can view their tenant users" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() 
            AND up.role = 'tenant_admin' 
            AND up.tenant_id = user_profiles.tenant_id
        )
    );

-- Users can see their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Super admins can insert/update any profile
CREATE POLICY "Super admins can manage all user profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.id = auth.uid() AND up.role = 'super_admin'
        )
    );

-- Tenant admins can manage users in their tenant (except other admins)
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

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
        AND tenant_id = (SELECT tenant_id FROM user_profiles WHERE id = auth.uid())
    );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        'tenant_user', -- Default role
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create the first super admin user (replace with your email)
-- You'll need to sign up first, then run this to make yourself super admin
-- INSERT INTO user_profiles (id, email, role, full_name)
-- VALUES (
--     'your-user-id-here', -- Get this from auth.users table after signup
--     'your-email@example.com',
--     'super_admin',
--     'Super Admin'
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
