# PostgreSQL Migration Roadmap for Support Desk Application

## Overview

This roadmap outlines the step-by-step process for migrating the Support Desk application from mock data to a PostgreSQL database. The migration will follow the database schema defined in the migration.md document and will be implemented in phases to ensure a smooth transition with minimal disruption to the application.

## Phase 1: Database Setup and Configuration

### Step 1: Set Up Database Connection
- Create a database connection utility
- Implement connection pooling for efficient database access
- Configure environment variables for database connection (already done)

```javascript
// Example implementation in lib/db.ts
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
});

export default {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
};
```

### Step 2: Create Database Models
- Implement model classes for each entity (users, tickets, categories, etc.)
- Create data access layer for each model
- Implement CRUD operations for each model

## Phase 2: Data Migration

### Step 1: Create Migration Scripts
- Develop scripts to migrate mock data to PostgreSQL tables
- Implement data validation and transformation logic
- Create unique IDs for all entities and maintain relationships

### Step 2: Execute Migration
- Run migration scripts in a specific order to maintain data integrity:
  1. Users
  2. Parent Companies
  3. Companies
  4. Contacts
  5. Categories
  6. Subcategories
  7. Groups
  8. Tags
  9. Tickets
  10. Ticket Comments
  11. Ticket Tags
  12. Attachments
  13. Departments
  14. Audit Logs

### Step 3: Verify Migration
- Implement verification scripts to ensure data integrity
- Compare record counts between mock data and database
- Validate relationships and constraints

## Phase 3: API Layer Refactoring

### Step 1: Create Database Service Layer
- Implement service classes for each entity
- Refactor the Dataset class to use PostgreSQL instead of mock data
- Create query builders for complex queries

### Step 2: Update API Endpoints
- Refactor API endpoints to use the new database service layer
- Implement pagination, filtering, and sorting
- Add error handling and validation

### Step 3: Implement Transaction Support
- Add transaction support for operations that modify multiple tables
- Ensure ACID compliance for critical operations

## Phase 4: UI Integration and Testing

### Step 1: Update UI Components
- Modify UI components to work with the new data structure
- Update data fetching logic in components
- Implement optimistic UI updates

### Step 2: Comprehensive Testing
- Develop unit tests for database models and services
- Implement integration tests for API endpoints
- Conduct end-to-end testing of the entire application

### Step 3: Performance Optimization
- Analyze query performance and optimize slow queries
- Implement caching for frequently accessed data
- Add indexes for common query patterns

## Phase 5: Deployment and Monitoring

### Step 1: Deployment Strategy
- Create a deployment plan with rollback options
- Implement database migration scripts for production
- Set up a staging environment for final testing

### Step 2: Monitoring and Logging
- Implement database monitoring tools
- Set up logging for database operations
- Create alerts for critical errors

### Step 3: Documentation
- Update API documentation
- Document database schema and relationships
- Create maintenance guides for the development team

## Detailed Implementation Plan

### 1. Database Connection Setup

1. Install required packages:
```bash
npm install pg
npm install --save-dev @types/pg
```

2. Create database connection utility in `lib/db.ts`
3. Implement connection pooling
4. Add error handling and retry logic

### 2. Model Implementation

For each entity in the database schema:

1. Create a model class with properties matching the database schema
2. Implement data access methods (findById, findAll, create, update, delete)
3. Add validation logic

Example for Users model:

```javascript
// models/user.ts
import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: 'admin' | 'manager' | 'agent';
  department?: string;
  status: 'active' | 'inactive';
  last_login?: Date;
  profile_image_url?: string;
  created_at: Date;
  created_by?: string;
  updated_at: Date;
  updated_by?: string;
  is_deleted: boolean;
}

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_deleted = false',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll(options = {}): Promise<User[]> {
    const result = await db.query(
      'SELECT * FROM users WHERE is_deleted = false ORDER BY name'
    );
    return result.rows;
  }

  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const id = uuidv4();
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO users (
        id, name, email, password_hash, role, department, status, 
        profile_image_url, created_at, created_by, updated_at, updated_by, is_deleted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        id, userData.name, userData.email, userData.password_hash, 
        userData.role, userData.department, userData.status,
        userData.profile_image_url, now, userData.created_by, 
        now, userData.updated_by, false
      ]
    );
    
    return result.rows[0];
  }

  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    // Implementation for update
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    // Soft delete implementation
  }
}
```

### 3. API Layer Refactoring

1. Create service classes for each entity
2. Refactor API endpoints to use the new service classes
3. Implement pagination, filtering, and sorting

Example for Tickets API:

```javascript
// pages/api/tickets/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { TicketModel } from '@/models/ticket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      try {
        const { page = '1', limit = '10', status, priority, assignedTo } = req.query;
        
        const options = {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          filters: {
            status,
            priority,
            assignedTo
          }
        };
        
        const tickets = await TicketModel.findAll(options);
        const total = await TicketModel.count(options.filters);
        
        res.status(200).json({
          data: tickets,
          pagination: {
            total,
            page: options.page,
            limit: options.limit,
            pages: Math.ceil(total / options.limit)
          }
        });
      } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Failed to fetch tickets' });
      }
      break;
      
    case 'POST':
      try {
        const ticket = await TicketModel.create(req.body);
        res.status(201).json(ticket);
      } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Failed to create ticket' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

### 4. Migration Scripts

Create migration scripts for each entity:

```javascript
// scripts/migrate-users.js
import { mockUsers } from '../app/[tenantId]/(main)/settings/data/mock-users';
import { UserModel } from '../models/user';

async function migrateUsers() {
  console.log('Starting user migration...');
  
  for (const user of mockUsers) {
    try {
      // Transform mock data to match database schema
      const userData = {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        profile_image_url: user.profileImageUrl,
        created_by: user.createdBy,
        updated_by: user.updatedBy,
        is_deleted: user.isDeleted || false
      };
      
      await UserModel.create(userData);
      console.log(`Migrated user: ${user.name}`);
    } catch (error) {
      console.error(`Error migrating user ${user.name}:`, error);
    }
  }
  
  console.log('User migration completed');
}

migrateUsers();
```

## Timeline and Milestones

### Week 1: Setup and Planning
- Set up database connection
- Create initial models for core entities
- Develop migration strategy

### Week 2-3: Core Entity Migration
- Implement models for all entities
- Create and test migration scripts
- Migrate core data (users, companies, categories)

### Week 4-5: API Refactoring
- Refactor API endpoints to use database
- Implement service layer
- Add transaction support

### Week 6-7: UI Integration and Testing
- Update UI components
- Implement comprehensive testing
- Optimize performance

### Week 8: Deployment and Documentation
- Deploy to staging environment
- Conduct final testing
- Create documentation
- Deploy to production

## Risks and Mitigation

### Risk: Data Integrity Issues
- **Mitigation**: Implement thorough validation during migration
- Create verification scripts to ensure data consistency

### Risk: Performance Degradation
- **Mitigation**: Optimize database queries
- Implement caching for frequently accessed data
- Add appropriate indexes

### Risk: Application Downtime
- **Mitigation**: Implement feature flags to gradually roll out changes
- Use blue-green deployment strategy
- Schedule migration during low-traffic periods

### Risk: Unforeseen Schema Changes
- **Mitigation**: Create flexible models that can adapt to schema changes
- Implement database migration tools for schema evolution

## Conclusion

This roadmap provides a comprehensive plan for migrating the Support Desk application from mock data to PostgreSQL. By following this phased approach, the migration can be completed with minimal disruption to the application while ensuring data integrity and performance.

The migration will result in a more robust, scalable, and maintainable application that can handle larger datasets and more complex queries.
