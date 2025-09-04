# Database Schema Documentation

## 📋 Overview

This document describes the database schema for a **multi-tenant inventory and sales management system**. The system supports multiple businesses (tenants) with separate data isolation while maintaining a unified database structure.

---

## 🗂️ Table Structure

### 1. **Users Table** (Managed by Supabase Auth)

**Description**: Handles user authentication and authorization through Supabase. Users are associated with tenants via metadata.

**Key Features**:
- User authentication managed by Supabase
- Tenant association through user metadata (`tenant_id`)
- No manual table creation required

---

### 2. **Tenants Table**

**Description**: Stores information about each business/tenant using the system.

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,                    -- Name of the shop/business
    address TEXT,                          -- Business address (optional)
    contact_info TEXT,                     -- Contact details (optional)
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW()   -- Record update timestamp
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | TEXT | Business name (required) |
| `address` | TEXT | Physical address (optional) |
| `contact_info` | TEXT | Phone, email, or other contact methods (optional) |
| `created_at` | TIMESTAMPTZ | Automatic timestamp when record is created |
| `updated_at` | TIMESTAMPTZ | Automatic timestamp when record is updated |

---

### 3. **Customers Table**

**Description**: Stores customer information specific to each tenant.

```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,               -- Associated tenant
    name TEXT NOT NULL,                    -- Customer name
    email TEXT UNIQUE,                     -- Email address (optional, unique)
    phone TEXT,                            -- Phone number (optional)
    address TEXT,                          -- Address (optional)
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `tenant_id` | UUID | References the tenant this customer belongs to |
| `name` | TEXT | Customer's full name (required) |
| `email` | TEXT | Email address (optional, unique constraint) |
| `phone` | TEXT | Phone number (optional) |
| `address` | TEXT | Physical address (optional) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 4. **Categories Table** (Optional)

**Description**: Organizes products into categories for better inventory management.

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,               -- Associated tenant
    name TEXT NOT NULL UNIQUE,             -- Category name (unique per tenant)
    description TEXT,                      -- Category description (optional)
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `tenant_id` | UUID | References the tenant this category belongs to |
| `name` | TEXT | Category name (required, unique per tenant) |
| `description` | TEXT | Detailed description of the category (optional) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 5. **Products Table**

**Description**: Stores product information and inventory levels for each tenant.

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,               -- Associated tenant
    name TEXT NOT NULL,                    -- Product name
    price NUMERIC NOT NULL,                -- Product price
    stock_quantity INTEGER NOT NULL DEFAULT 0, -- Current stock level
    category_id INTEGER REFERENCES categories(id), -- Optional category reference
    description TEXT,                      -- Product description (optional)
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `tenant_id` | UUID | References the tenant this product belongs to |
| `name` | TEXT | Product name (required) |
| `price` | NUMERIC | Selling price (required) |
| `stock_quantity` | INTEGER | Current inventory count (default: 0) |
| `category_id` | INTEGER | Optional reference to product category |
| `description` | TEXT | Product details (optional) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 6. **Orders Table**

**Description**: Tracks customer orders and their status.

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,               -- Associated tenant
    customer_id INTEGER NOT NULL,          -- Customer placing the order
    total_amount NUMERIC NOT NULL,         -- Order total amount
    status TEXT DEFAULT 'pending',         -- Order status
    payment_method TEXT,                   -- Payment method used
    payment_status TEXT DEFAULT 'pending', -- Payment status
    order_date TIMESTAMPTZ DEFAULT NOW(),  -- Date of order placement
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `tenant_id` | UUID | References the tenant this order belongs to |
| `customer_id` | INTEGER | References the customer placing the order |
| `total_amount` | NUMERIC | Total value of the order |
| `status` | TEXT | Current status ('pending', 'completed', 'canceled') |
| `payment_method` | TEXT | Method of payment ('loan', 'cash', 'credit_card') |
| `payment_status` | TEXT | Payment status ('paid', 'pending', 'partially_paid') |
| `order_date` | TIMESTAMPTZ | When the order was placed |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 7. **Order Items Table**

**Description**: Breaks down orders into individual product line items.

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,             -- Associated order
    product_id INTEGER NOT NULL,           -- Product in this order item
    quantity INTEGER NOT NULL,             -- Quantity ordered
    unit_price NUMERIC NOT NULL,           -- Price per unit at time of order
    total_price NUMERIC NOT NULL,          -- Line item total (quantity × unit_price)
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `order_id` | INTEGER | References the parent order |
| `product_id` | INTEGER | References the product being ordered |
| `quantity` | INTEGER | Number of units ordered |
| `unit_price` | NUMERIC | Price per unit at time of order (preserves historical pricing) |
| `total_price` | NUMERIC | Calculated total for this line item |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 8. **Stock Movements Table**

**Description**: Tracks all inventory changes with reasons and timestamps.

```sql
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,               -- Associated tenant
    product_id INTEGER NOT NULL,           -- Product being adjusted
    quantity INTEGER NOT NULL,             -- Change amount (positive/negative)
    movement_type TEXT,                    -- Type of movement
    reason TEXT,                           -- Reason for movement
    movement_date TIMESTAMPTZ DEFAULT NOW(), -- Date of movement
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `tenant_id` | UUID | References the tenant this movement belongs to |
| `product_id` | INTEGER | References the product being adjusted |
| `quantity` | INTEGER | Change amount (positive for additions, negative for deductions) |
| `movement_type` | TEXT | Category of movement ('sale', 'restock', 'adjustment') |
| `reason` | TEXT | Detailed explanation for the movement |
| `movement_date` | TIMESTAMPTZ | When the movement occurred |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 9. **Loans Table**

**Description**: Tracks customer credit/loan accounts.

```sql
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,               -- Associated tenant
    customer_id INTEGER NOT NULL,          -- Customer receiving loan
    total_loan_amount NUMERIC NOT NULL,    -- Original loan amount
    loan_balance NUMERIC NOT NULL,         -- Current outstanding balance
    loan_date TIMESTAMPTZ DEFAULT NOW(),   -- Date loan was issued
    status TEXT DEFAULT 'active',          -- Loan status
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `tenant_id` | UUID | References the tenant this loan belongs to |
| `customer_id` | INTEGER | References the customer receiving the loan |
| `total_loan_amount` | NUMERIC | Original principal amount |
| `loan_balance` | NUMERIC | Current outstanding balance |
| `loan_date` | TIMESTAMPTZ | When the loan was issued |
| `status` | TEXT | Current status ('active', 'paid_off') |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 10. **Loan Payments Table**

**Description**: Records payments made toward customer loans.

```sql
CREATE TABLE loan_payments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL,              -- Associated loan
    payment_amount NUMERIC NOT NULL,       -- Payment amount
    payment_date TIMESTAMPTZ DEFAULT NOW(), -- Date of payment
    remaining_balance NUMERIC NOT NULL,    -- Balance after payment
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `loan_id` | INTEGER | References the loan being paid |
| `payment_amount` | NUMERIC | Amount paid toward the loan |
| `payment_date` | TIMESTAMPTZ | When the payment was made |
| `remaining_balance` | NUMERIC | Outstanding balance after this payment |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 11. **Sales Table**

**Description**: Tracks financial transactions from completed orders.

```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,               -- Associated tenant
    order_id INTEGER NOT NULL,             -- Associated order
    total_amount NUMERIC NOT NULL,         -- Sale amount
    payment_method TEXT,                   -- Payment method used
    payment_status TEXT,                   -- Payment status
    sale_date TIMESTAMPTZ DEFAULT NOW(),   -- Date of sale
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `tenant_id` | UUID | References the tenant this sale belongs to |
| `order_id` | INTEGER | References the completed order |
| `total_amount` | NUMERIC | Final sale amount |
| `payment_method` | TEXT | Method of payment ('cash', 'credit_card', 'mobile') |
| `payment_status` | TEXT | Final payment status ('paid', 'pending') |
| `sale_date` | TIMESTAMPTZ | When the sale was finalized |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 12. **Expenses Table**

**Description**: Tracks business operational expenses.

```sql
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,               -- Associated tenant
    expense_type TEXT,                     -- Category of expense
    amount NUMERIC NOT NULL,               -- Expense amount
    description TEXT,                      -- Expense details
    expense_date TIMESTAMPTZ DEFAULT NOW(), -- Date of expense
    created_at TIMESTAMPTZ DEFAULT NOW(),  -- Record creation timestamp
    updated_at TIMESTAMPTZ DEFAULT NOW(),  -- Record update timestamp
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing unique identifier |
| `tenant_id` | UUID | References the tenant this expense belongs to |
| `expense_type` | TEXT | Category ('rent', 'shipping', 'utilities') |
| `amount` | NUMERIC | Expense amount |
| `description` | TEXT | Detailed explanation of the expense |
| `expense_date` | TIMESTAMPTZ | When the expense occurred |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

## 🎯 Design Principles

1. **Multi-tenancy**: All tenant-specific tables include a `tenant_id` foreign key for data isolation
2. **Data Integrity**: Extensive use of foreign key constraints with `ON DELETE CASCADE`
3. **Auditability**: All tables include `created_at` and `updated_at` timestamps
4. **Historical Tracking**: Critical tables preserve historical data (e.g., order items preserve pricing)
5. **Flexibility**: Optional fields allow for gradual data collection

---

## 🔗 Relationships

- Tenants have multiple Users (managed by Supabase Auth)
- Tenants have multiple Customers, Products, Categories, Orders, etc.
- Customers can have multiple Orders and Loans
- Orders contain multiple Order Items
- Products can belong to Categories and have multiple Stock Movements
- Loans have multiple Loan Payments

---

## 📊 Indexing Recommendations

For production use, consider adding indexes on:
- Foreign key columns (`tenant_id`, `customer_id`, `product_id`, etc.)
- Frequently queried columns (`status` fields, `email`, `phone`)
- Date fields used for reporting (`order_date`, `movement_date`, `sale_date`)

---

## 💡 Conclusion

This schema provides a robust foundation for a multi-tenant inventory and sales management system with support for credit transactions and expense tracking. The design ensures data isolation between tenants while maintaining a consistent structure across all business entities.