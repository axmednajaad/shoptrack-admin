-- Tenant Admin Database Setup - Run this in Supabase SQL Editor
-- This creates the customers table and related functionality

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization
    customer_since DATE DEFAULT CURRENT_DATE,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_order_date DATE,
    preferred_contact_method TEXT DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms')),
    marketing_consent BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON public.customers(last_name);
CREATE INDEX IF NOT EXISTS idx_customers_customer_since ON public.customers(customer_since);

-- Create updated_at trigger for customers
CREATE OR REPLACE FUNCTION public.update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_customers_updated_at();

-- Create customer statistics view
CREATE OR REPLACE VIEW public.customer_stats AS
SELECT 
    tenant_id,
    COUNT(*) as total_customers,
    COUNT(*) FILTER (WHERE status = 'active') as active_customers,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_customers,
    COUNT(*) FILTER (WHERE status = 'suspended') as suspended_customers,
    COUNT(*) FILTER (WHERE customer_since >= CURRENT_DATE - INTERVAL '30 days') as new_customers_30d,
    COUNT(*) FILTER (WHERE customer_since >= CURRENT_DATE - INTERVAL '7 days') as new_customers_7d,
    AVG(total_spent) as avg_customer_value,
    SUM(total_spent) as total_customer_value,
    COUNT(*) FILTER (WHERE marketing_consent = true) as marketing_subscribers
FROM public.customers
GROUP BY tenant_id;

-- Row Level Security (RLS) for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see customers from their own tenant
CREATE POLICY "Users can view customers from their tenant" ON public.customers
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can insert customers for their tenant
CREATE POLICY "Users can insert customers for their tenant" ON public.customers
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can update customers from their tenant
CREATE POLICY "Users can update customers from their tenant" ON public.customers
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Policy: Users can delete customers from their tenant
CREATE POLICY "Users can delete customers from their tenant" ON public.customers
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.user_profiles 
            WHERE id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.customers TO authenticated;
GRANT SELECT ON public.customer_stats TO authenticated;

-- Insert sample customers for testing (optional)
-- You can uncomment this section if you want sample data
/*
INSERT INTO public.customers (tenant_id, first_name, last_name, email, phone, address, city, state, postal_code, status, total_orders, total_spent, marketing_consent)
SELECT 
    t.id as tenant_id,
    'John' as first_name,
    'Doe' as last_name,
    'john.doe@example.com' as email,
    '+1-555-0123' as phone,
    '123 Main St' as address,
    'Anytown' as city,
    'CA' as state,
    '12345' as postal_code,
    'active' as status,
    5 as total_orders,
    299.99 as total_spent,
    true as marketing_consent
FROM public.tenants t
WHERE t.status = 'active'
LIMIT 1;
*/

SELECT 'Tenant Admin database setup completed successfully!' as message;
