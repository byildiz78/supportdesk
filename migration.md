# PostgreSQL Migration Plan for Support Desk Application

## Overview

This document outlines the migration plan for moving the Support Desk application's mock data to a PostgreSQL database. The plan includes table structures, relationships, and standard fields required for each table.

## Standard Fields for All Tables

All tables will include the following standard fields:

- `id`: Primary key, UUID or SERIAL depending on table requirements
- `created_at`: TIMESTAMP WITH TIME ZONE, when the record was created
- `created_by`: VARCHAR(255), user ID who created the record
- `updated_at`: TIMESTAMP WITH TIME ZONE, when the record was last updated
- `updated_by`: VARCHAR(255), user ID who last updated the record
- `is_deleted`: BOOLEAN, soft delete flag (default false)

## Database Schema

### 1. Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'agent')),
    department VARCHAR(100),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive')),
    last_login TIMESTAMP WITH TIME ZONE,
    profile_image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
```

### 2. Parent Companies Table

```sql
CREATE TABLE parent_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    tax_id VARCHAR(50),
    tax_office VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    industry VARCHAR(100),
    company_type VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_parent_companies_name ON parent_companies(name);
CREATE INDEX idx_parent_companies_tax_id ON parent_companies(tax_id);
CREATE INDEX idx_parent_companies_city ON parent_companies(city);
CREATE INDEX idx_parent_companies_is_active ON parent_companies(is_active);
```

### 3. Companies Table

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_company_id UUID REFERENCES parent_companies(id),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    tax_office VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    industry VARCHAR(100),
    company_type VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_companies_parent_company_id ON companies(parent_company_id);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_tax_id ON companies(tax_id);
CREATE INDEX idx_companies_city ON companies(city);
CREATE INDEX idx_companies_is_active ON companies(is_active);
```

### 4. Contacts Table

```sql
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    notes TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_name ON contacts(first_name, last_name);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_is_primary ON contacts(is_primary);
CREATE INDEX idx_contacts_is_active ON contacts(is_active);
```

### 5. Categories Table

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);
```

### 6. Subcategories Table

```sql
CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    UNIQUE(category_id, name)
);

CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
```

### 7. Groups Table

```sql
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID REFERENCES subcategories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    UNIQUE(subcategory_id, name)
);

CREATE INDEX idx_groups_subcategory_id ON groups(subcategory_id);
```

### 8. Tickets Table

```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
    priority VARCHAR(50) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    source VARCHAR(50) NOT NULL CHECK (source IN ('email', 'phone', 'web', 'chat')),
    category_id UUID REFERENCES categories(id),
    subcategory_id UUID REFERENCES subcategories(id),
    group_id UUID REFERENCES groups(id),
    assigned_to UUID REFERENCES users(id),
    parent_company_id UUID REFERENCES parent_companies(id),
    company_id UUID REFERENCES companies(id),
    contact_id UUID REFERENCES contacts(id),
    due_date TIMESTAMP WITH TIME ZONE,
    resolution_time INTEGER, -- in minutes
    sla_breach BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_category_id ON tickets(category_id);
CREATE INDEX idx_tickets_subcategory_id ON tickets(subcategory_id);
CREATE INDEX idx_tickets_group_id ON tickets(group_id);
CREATE INDEX idx_tickets_parent_company_id ON tickets(parent_company_id);
CREATE INDEX idx_tickets_company_id ON tickets(company_id);
CREATE INDEX idx_tickets_contact_id ON tickets(contact_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_due_date ON tickets(due_date);
```

### 9. Ticket Comments Table

```sql
CREATE TABLE ticket_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_by ON ticket_comments(created_by);
```

### 10. Tags Table

```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);
```

### 11. Ticket-Tag Relationship Table

```sql
CREATE TABLE ticket_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id),
    tag_id UUID REFERENCES tags(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    UNIQUE(ticket_id, tag_id)
);

CREATE INDEX idx_ticket_tags_ticket_id ON ticket_tags(ticket_id);
CREATE INDEX idx_ticket_tags_tag_id ON ticket_tags(tag_id);
```

### 12. Attachments Table

```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    public_url VARCHAR(255),
    entity_type VARCHAR(50) NOT NULL, -- 'ticket' or 'comment'
    entity_id UUID NOT NULL, -- ticket_id or comment_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_attachments_entity_type_id ON attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_created_by ON attachments(created_by);
```

### 13. Departments Table

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false
);
```

### 14. Audit Logs Table

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL, -- 'ticket', 'user', 'category', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', etc.
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

## Migration Strategy

1. **Create Database Schema**:
   - Execute the SQL scripts to create all tables with proper relationships and constraints.

2. **Data Migration**:
   - Migrate users from mock data to the users table.
   - Migrate parent companies and companies from mock data.
   - Migrate contacts from mock data.
   - Migrate categories, subcategories, and groups from mock data.
   - Migrate tickets and related data (comments, tags, attachments).

3. **Data Validation**:
   - Verify that all data has been migrated correctly.
   - Check referential integrity.
   - Validate business rules and constraints.

4. **Application Updates**:
   - Update the application code to use the PostgreSQL database instead of mock data.
   - Implement proper database connection handling.
   - Update API endpoints to use the database.

5. **Testing**:
   - Test all functionality with the new database.
   - Perform load testing to ensure performance.
   - Validate all business processes.

## Additional Considerations

1. **Indexing Strategy**:
   - Indexes have been created for frequently queried columns.
   - Additional indexes may be needed based on query patterns.

2. **Soft Delete**:
   - All tables implement soft delete via the is_deleted flag.
   - Application logic should filter out deleted records.

3. **Audit Trail**:
   - The audit_logs table captures all changes to entities.
   - Consider implementing database triggers for automatic audit logging.

4. **Performance Considerations**:
   - Consider partitioning large tables (e.g., tickets, comments) by date for better performance.
   - Implement proper connection pooling.
   - Use prepared statements for frequently executed queries.

5. **Security**:
   - Store sensitive data (passwords) using proper hashing algorithms.
   - Use parameterized queries to prevent SQL injection.

6. **Company Hierarchy Management**:
   - The parent_companies and companies tables provide a hierarchical structure for managing corporate relationships.
   - Parent companies can have multiple subsidiary companies.
   - Both parent companies and individual companies can be associated with tickets.
   - This structure allows for reporting and analytics at both the parent company and subsidiary level.
