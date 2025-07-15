/**
 * Jest integration tests for Database Connection
 * Tests cloud database connectivity and table structure
 */

const db = require('../config/database');

describe('Database Connection', () => {
  afterAll(async () => {
    await db.destroy();
  });

  describe('Basic Connection', () => {
    test('should connect to database successfully', async () => {
      const result = await db.raw('SELECT 1 as test');
      expect(result).toBeDefined();
      expect(result.rows).toBeDefined();
      expect(result.rows[0].test).toBe(1);
    });

    test('should have required tables', async () => {
      const tables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      expect(tables.rows).toBeDefined();
      expect(tables.rows.length).toBeGreaterThan(0);

      const tableNames = tables.rows.map(row => row.table_name);

      // Check for essential tables
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('listed_cars');
      expect(tableNames).toContain('companies');
    });
  });

  describe('Table Structure', () => {
    test('users table should have required columns', async () => {
      const columns = await db.raw(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);

      const columnNames = columns.rows.map(row => row.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('username');
      expect(columnNames).toContain('created_at');
    });

    test('listed_cars table should have required columns', async () => {
      const columns = await db.raw(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'listed_cars'
      `);

      const columnNames = columns.rows.map(row => row.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    test('companies table should have required columns', async () => {
      const columns = await db.raw(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'companies'
      `);

      const columnNames = columns.rows.map(row => row.column_name);

      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
    });
  });

  describe('Data Integrity', () => {
    test('should be able to count records in main tables', async () => {
      const tables = ['users', 'listed_cars', 'companies'];

      for (const tableName of tables) {
        const result = await db(tableName).count('* as count').first();
        expect(result).toBeDefined();
        expect(result.count).toBeDefined();
        expect(parseInt(result.count)).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have proper foreign key relationships', async () => {
      const constraints = await db.raw(`
        SELECT 
          tc.table_name, 
          tc.constraint_name, 
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      `);

      expect(constraints.rows).toBeDefined();
      expect(constraints.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    test('should respond to queries within reasonable time', async () => {
      const startTime = Date.now();

      await db.raw('SELECT COUNT(*) FROM listed_cars WHERE status = ?', ['active']);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      // Query should complete within 5 seconds
      expect(queryTime).toBeLessThan(5000);
    });
  });

  describe('Transaction Support', () => {
    test('should support database transactions', async () => {
      const trx = await db.transaction();

      try {
        // Test transaction by doing a harmless operation
        await trx.raw('SELECT 1');
        await trx.commit();

        expect(true).toBe(true); // Transaction completed successfully
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });
  });
});
