/**
 * Migration: Add SEO fields with column existence checks
 * 
 * Safely adds slug and meta fields only if they don't already exist
 * Optimized for Arabic content and Syria market
 */

exports.up = async function (knex) {
  // Helper function to check if column exists
  const columnExists = async (tableName, columnName) => {
    const exists = await knex.schema.hasColumn(tableName, columnName);
    return exists;
  };

  // Add fields to listed_cars table
  const listedCarsColumns = [];
  if (!(await columnExists('listed_cars', 'slug'))) {
    listedCarsColumns.push(table => table.string('slug', 255).nullable().index());
  }
  if (!(await columnExists('listed_cars', 'meta_description'))) {
    listedCarsColumns.push(table => table.text('meta_description').nullable());
  }
  if (!(await columnExists('listed_cars', 'meta_keywords'))) {
    listedCarsColumns.push(table => table.text('meta_keywords').nullable());
  }

  if (listedCarsColumns.length > 0) {
    await knex.schema.table('listed_cars', table => {
      listedCarsColumns.forEach(columnFn => columnFn(table));
    });
  }

  // Add fields to companies table
  const companiesColumns = [];
  if (!(await columnExists('companies', 'slug'))) {
    companiesColumns.push(table => table.string('slug', 255).nullable().index());
  }
  if (!(await columnExists('companies', 'meta_description'))) {
    companiesColumns.push(table => table.text('meta_description').nullable());
  }
  if (!(await columnExists('companies', 'meta_keywords'))) {
    companiesColumns.push(table => table.text('meta_keywords').nullable());
  }

  if (companiesColumns.length > 0) {
    await knex.schema.table('companies', table => {
      companiesColumns.forEach(columnFn => columnFn(table));
    });
  }

  // Add meta fields to blog_posts table (slug should already exist)
  const hasTable = await knex.schema.hasTable('blog_posts');
  if (hasTable) {
    const blogColumns = [];
    if (!(await columnExists('blog_posts', 'meta_description'))) {
      blogColumns.push(table => table.text('meta_description').nullable());
    }
    if (!(await columnExists('blog_posts', 'meta_keywords'))) {
      blogColumns.push(table => table.text('meta_keywords').nullable());
    }

    if (blogColumns.length > 0) {
      await knex.schema.table('blog_posts', table => {
        blogColumns.forEach(columnFn => columnFn(table));
      });
    }
  }

  console.log('✅ SEO fields migration completed successfully');
};

exports.down = async function (knex) {
  // Helper function to check if column exists before dropping
  const safeDropColumn = async (tableName, columnName) => {
    const exists = await knex.schema.hasColumn(tableName, columnName);
    if (exists) {
      await knex.schema.table(tableName, table => {
        table.dropColumn(columnName);
      });
    }
  };

  // Remove fields from listed_cars
  await safeDropColumn('listed_cars', 'slug');
  await safeDropColumn('listed_cars', 'meta_description');
  await safeDropColumn('listed_cars', 'meta_keywords');

  // Remove fields from companies
  await safeDropColumn('companies', 'slug');
  await safeDropColumn('companies', 'meta_description');
  await safeDropColumn('companies', 'meta_keywords');

  // Remove meta fields from blog_posts (keep slug)
  const hasTable = await knex.schema.hasTable('blog_posts');
  if (hasTable) {
    await safeDropColumn('blog_posts', 'meta_description');
    await safeDropColumn('blog_posts', 'meta_keywords');
  }

  console.log('✅ SEO fields rollback completed successfully');
};
