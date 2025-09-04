# Setup Super Admin User

## Step 1: Run Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `database_roles_setup.sql`

## Step 2: Create Your First Super Admin
1. Sign up normally through the app at `/signup`
2. After signing up, go to your Supabase dashboard
3. Navigate to Authentication > Users
4. Find your user and copy the User ID
5. Go to SQL Editor and run this query (replace with your actual user ID and email):

```sql
-- Update your user to be a super admin
UPDATE user_profiles 
SET role = 'super_admin' 
WHERE id = 'your-user-id-here';

-- Or if the profile doesn't exist yet, insert it:
INSERT INTO user_profiles (id, email, role, full_name)
VALUES (
    'your-user-id-here',
    'your-email@example.com',
    'super_admin',
    'Super Admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
```

## Step 3: Test Role-Based Access
1. Sign out and sign back in
2. You should be redirected to `/super-admin` dashboard
3. You can now create tenants and manage users

## User Roles:
- **super_admin**: Access to `/super-admin` - can manage all tenants and users
- **tenant_admin**: Access to `/tenant-admin` - can manage their tenant's users and data
- **tenant_user**: Access to `/dashboard` - read-only access to tenant data

## Creating Other Users:
- Super admins can create users and assign them to tenants
- Tenant admins can create tenant_user accounts within their tenant
- Regular signup creates tenant_user accounts by default (they need to be assigned to a tenant by an admin)
