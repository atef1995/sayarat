/**
 * Test script for sitemap service functionality
 * This script tests the sitemap service with mock data to ensure it works correctly
 */

const SitemapService = require('./service/seo/sitemapService');

// Mock knex instance for testing
const mockKnex = function (tableName) {
  const chain = {
    _currentTable: tableName,
    select: () => chain,
    where: () => chain,
    whereNull: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    first: () => chain,
    max: () => chain,

    // Mock query functions that return test data
    then: (callback) => {
      // Return mock data based on table
      if (chain._currentTable === 'listed_cars') {
        return callback([
          {
            id: 1,
            slug: null,
            title: 'Toyota Camry 2020',
            updated_at: new Date(),
            created_at: new Date(),
            status: 'active',
            location: 'Damascus',
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            meta_description: null,
            meta_keywords: null
          }
        ]);
      } else if (chain._currentTable === 'companies') {
        return callback([
          {
            id: 1,
            name: 'معرض السيارات المتميز',
            slug: null,
            updated_at: new Date(),
            created_at: new Date(),
            status: 'active',
            location: 'Damascus',
            meta_description: null,
            meta_keywords: null
          }
        ]);
      } else if (chain._currentTable === 'blog_posts') {
        return callback([
          {
            id: 1,
            title: 'أفضل السيارات في سوريا',
            slug: 'best-cars-syria',
            updated_at: new Date(),
            created_at: new Date(),
            status: 'published',
            meta_description: null,
            meta_keywords: null
          }
        ]);
      }
      return callback([]);
    }
  };

  return chain;
};

// Add missing methods to main function
mockKnex.schema = {
  hasTable: () => Promise.resolve(true),
  hasColumn: () => Promise.resolve(false)
};

async function testSitemapService() {
  console.log('🧪 Testing Sitemap Service...\n');

  try {
    const sitemapService = new SitemapService(mockKnex);

    // Test static sitemap generation
    console.log('📄 Testing static sitemap generation...');
    const staticSitemap = await sitemapService.generateStaticSitemap();
    console.log('✅ Static sitemap generated successfully');
    console.log(`📊 Length: ${staticSitemap.length} characters\n`);

    // Test cars sitemap generation
    console.log('🚗 Testing cars sitemap generation...');
    const carsSitemap = await sitemapService.generateCarsSitemap();
    console.log('✅ Cars sitemap generated successfully');
    console.log(`📊 Length: ${carsSitemap.length} characters\n`);

    // Test companies sitemap generation
    console.log('🏢 Testing companies sitemap generation...');
    const companiesSitemap = await sitemapService.generateCompaniesSitemap();
    console.log('✅ Companies sitemap generated successfully');
    console.log(`📊 Length: ${companiesSitemap.length} characters\n`);

    // Test blog sitemap generation
    console.log('📝 Testing blog sitemap generation...');
    const blogSitemap = await sitemapService.generateBlogSitemap();
    console.log('✅ Blog sitemap generated successfully');
    console.log(`📊 Length: ${blogSitemap.length} characters\n`);

    // Test categories sitemap generation
    console.log('📂 Testing categories sitemap generation...');
    const categoriesSitemap = await sitemapService.generateCategoriesSitemap();
    console.log('✅ Categories sitemap generated successfully');
    console.log(`📊 Length: ${categoriesSitemap.length} characters\n`);

    // Test robots.txt generation
    console.log('🤖 Testing robots.txt generation...');
    const robotsTxt = sitemapService.generateRobotsTxt();
    console.log('✅ Robots.txt generated successfully');
    console.log(`📊 Length: ${robotsTxt.length} characters\n`);

    // Test slug generation utilities
    console.log('🔗 Testing fallback slug generation...');
    const carSlug = sitemapService.generateFallbackCarSlug({
      id: 1,
      title: 'Toyota Camry 2020',
      make: 'Toyota',
      model: 'Camry',
      year: 2020
    });
    console.log(`Car slug: ${carSlug}`);

    const companySlug = sitemapService.generateFallbackCompanySlug({
      id: 1,
      name: 'معرض السيارات المتميز'
    });
    console.log(`Company slug: ${companySlug}`);

    const postSlug = sitemapService.generateFallbackPostSlug({
      id: 1,
      title: 'أفضل السيارات في سوريا'
    });
    console.log(`Post slug: ${postSlug}\n`);

    console.log('🎉 All sitemap service tests passed successfully!');
    console.log('\nNext steps:');
    console.log('1. Fix database connection issues');
    console.log('2. Run the migration to add slug fields');
    console.log('3. Run the slug population script');
    console.log('4. Test with real database data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testSitemapService();
