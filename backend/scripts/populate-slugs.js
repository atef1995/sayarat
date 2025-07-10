/**
 * Script to populate slug fields for existing records
 * 
 * This script will generate SEO-friendly slugs for all existing records
 * that don't have slugs yet, optimized for Arabic content
 * 
 * Usage: node scripts/populate-slugs.js
 */

const knex = require('../config/database');
const { generateCarSlug, generateCompanySlug, generateBlogSlug } = require('../utils/slugGenerator');
const logger = require('../utils/logger');

/**
 * Populate slugs for listed_cars table
 */
async function populateCarSlugs() {
  try {
    logger.info('Starting to populate car slugs...');

    const cars = await knex('listed_cars')
      .select('*')
      .whereNull('slug');

    logger.info(`Found ${cars.length} cars without slugs`);

    for (const car of cars) {
      const slug = generateCarSlug(car);

      await knex('listed_cars')
        .where('id', car.id)
        .update({
          slug,
          meta_description: generateCarMetaDescription(car),
          meta_keywords: generateCarKeywords(car)
        });

      logger.info(`Generated slug for car ${car.id}: ${slug}`);
    }

    logger.info('Car slugs population completed');
  } catch (error) {
    logger.error('Error populating car slugs:', error);
    throw error;
  }
}

/**
 * Populate slugs for companies table
 */
async function populateCompanySlugs() {
  try {
    logger.info('Starting to populate company slugs...');

    const companies = await knex('companies')
      .select('*')
      .whereNull('slug');

    logger.info(`Found ${companies.length} companies without slugs`);

    for (const company of companies) {
      const slug = generateCompanySlug(company);

      await knex('companies')
        .where('id', company.id)
        .update({
          slug,
          meta_description: generateCompanyMetaDescription(company),
          meta_keywords: generateCompanyKeywords(company)
        });

      logger.info(`Generated slug for company ${company.id}: ${slug}`);
    }

    logger.info('Company slugs population completed');
  } catch (error) {
    logger.error('Error populating company slugs:', error);
    throw error;
  }
}

/**
 * Populate slugs for blog_posts table
 */
async function populateBlogSlugs() {
  try {
    const tableExists = await knex.schema.hasTable('blog_posts');
    if (!tableExists) {
      logger.info('Blog posts table does not exist, skipping...');
      return;
    }

    logger.info('Starting to populate blog post slugs...');

    const posts = await knex('blog_posts')
      .select('*')
      .whereNull('slug');

    logger.info(`Found ${posts.length} blog posts without slugs`);

    for (const post of posts) {
      const slug = generateBlogSlug(post);

      await knex('blog_posts')
        .where('id', post.id)
        .update({
          slug,
          meta_description: generateBlogMetaDescription(post),
          meta_keywords: generateBlogKeywords(post)
        });

      logger.info(`Generated slug for blog post ${post.id}: ${slug}`);
    }

    logger.info('Blog post slugs population completed');
  } catch (error) {
    logger.error('Error populating blog post slugs:', error);
    throw error;
  }
}

/**
 * Generate meta description for car
 */
function generateCarMetaDescription(car) {
  const { make, model, year, city, title } = car;

  if (make && model) {
    return `${make} ${model} ${year || ''} للبيع في ${city || 'سوريا'} - أفضل الأسعار والعروض على موقع سيارات`.trim();
  }

  if (title) {
    return `${title} - سيارة للبيع في ${city || 'سوريا'} بأفضل الأسعار`;
  }

  return `سيارة للبيع في ${city || 'سوريا'} - موقع سيارات`;
}

/**
 * Generate keywords for car
 */
function generateCarKeywords(car) {
  const keywords = ['سيارات للبيع', 'سيارات سوريا'];

  if (car.make) keywords.push(`${car.make} للبيع`);
  if (car.model) keywords.push(`${car.model} للبيع`);
  if (car.year) keywords.push(`سيارات ${car.year}`);
  if (car.location) keywords.push(`سيارات ${car.location}`);

  return keywords.join(', ');
}

/**
 * Generate meta description for company
 */
function generateCompanyMetaDescription(company) {
  const { name, location } = company;

  if (name) {
    return `${name} - معرض سيارات في ${location || 'سوريا'} | أفضل العروض والأسعار`;
  }

  return `معرض سيارات في ${location || 'سوريا'} - أفضل الأسعار والخدمات`;
}

/**
 * Generate keywords for company
 */
function generateCompanyKeywords(company) {
  const keywords = ['معارض سيارات', 'سيارات سوريا', 'بيع سيارات'];

  if (company.name) keywords.push(company.name);
  if (company.location) keywords.push(`معارض ${company.location}`);

  return keywords.join(', ');
}

/**
 * Generate meta description for blog post
 */
function generateBlogMetaDescription(post) {
  const { title } = post;

  if (title) {
    return `${title} - مدونة السيارات | نصائح وأخبار السيارات في سوريا`;
  }

  return 'مدونة السيارات - نصائح وأخبار السيارات في سوريا';
}

/**
 * Generate keywords for blog post
 */
function generateBlogKeywords(post) {
  const keywords = ['مدونة السيارات', 'أخبار السيارات', 'نصائح السيارات'];

  if (post.title) {
    // Extract keywords from title
    const titleWords = post.title.split(' ').filter(word => word.length > 3);
    keywords.push(...titleWords.slice(0, 3));
  }

  return keywords.join(', ');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🚀 Starting slug population for SEO optimization...');

    await populateCarSlugs();
    await populateCompanySlugs();
    await populateBlogSlugs();

    console.log('✅ All slugs populated successfully!');
    console.log('📊 You can now run the sitemap generation to see SEO-friendly URLs');

  } catch (error) {
    console.error('❌ Error populating slugs:', error.message);
    process.exit(1);
  } finally {
    await knex.destroy();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  populateCarSlugs,
  populateCompanySlugs,
  populateBlogSlugs
};
