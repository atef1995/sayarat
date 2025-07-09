/**
 * Create Sample Blog Post Script
 * Creates a sample blog post for testing the frontend
 */

require('@dotenvx/dotenvx').config({ path: '../.env.development' });
const knex = require('./config/database');

async function createSamplePost() {
  try {
    console.log('🔄 Creating sample blog post...');

    // Get a seller to use as author (first seller in the database)
    const seller = await knex('sellers').select('id', 'username', 'first_name', 'last_name').first();

    if (!seller) {
      console.error('❌ No sellers found in database. Please create a seller first.');
      return;
    }

    // Get a category to use (first category)
    const category = await knex('blog_categories').select('id', 'name').first();

    if (!category) {
      console.error('❌ No blog categories found. Please run migrations first.');
      return;
    }

    // Check if post already exists
    const existingPost = await knex('blog_posts').where('slug', 'used-car-buying-guide-2025').first();

    if (existingPost) {
      console.log('✅ Sample blog post already exists!');
      console.log('📋 Post details:');
      console.log(`   - ID: ${existingPost.id}`);
      console.log(`   - Title: ${existingPost.title}`);
      console.log(`   - Status: ${existingPost.status}`);
      console.log(`   - Featured: ${existingPost.is_featured ? 'Yes' : 'No'}`);
      return;
    }

    // Create a sample blog post
    const samplePost = {
      title: 'دليل شراء سيارة مستعملة: نصائح مهمة لاختيار السيارة المناسبة',
      slug: 'used-car-buying-guide-2025',
      content: `
# دليل شراء سيارة مستعملة: نصائح مهمة لاختيار السيارة المناسبة

شراء سيارة مستعملة يمكن أن يكون خياراً ممتازاً لتوفير المال والحصول على سيارة جيدة. ولكن يتطلب الأمر بعض الحذر والتخطيط لضمان اتخاذ القرار الصحيح.

## النصائح الأساسية قبل الشراء

### 1. تحديد الميزانية
- حدد المبلغ الذي يمكنك دفعه
- احسب التكاليف الإضافية مثل التأمين والصيانة
- اترك مبلغاً احتياطياً للإصلاحات المحتملة

### 2. البحث عن السيارة المناسبة
- ابحث عن موديلات معروفة بالموثوقية
- راجع تقييمات المالكين السابقين
- قارن الأسعار في السوق المحلي

### 3. فحص السيارة
- افحص المحرك والمكابح
- تأكد من حالة الإطارات
- اطلب تقرير الفحص الفني

## المراحل النهائية للشراء

### التأكد من الأوراق
- تأكد من صحة وثائق الملكية
- راجع تاريخ الصيانة
- تحقق من عدم وجود مخالفات مرورية

### التفاوض على السعر
- ابحث عن أسعار مماثلة في السوق
- لا تتردد في التفاوض
- فكر في التكاليف الإضافية

## الخلاصة

شراء سيارة مستعملة يتطلب صبراً وبحثاً جيداً. اتبع هذه النصائح لضمان اتخاذ القرار الأمثل والحصول على سيارة تخدمك لسنوات قادمة.

تذكر أن الاستعانة بخبير أو ميكانيكي موثوق يمكن أن يوفر عليك الكثير من المشاكل والتكاليف المستقبلية.
      `,
      excerpt: 'دليل شامل لشراء سيارة مستعملة يتضمن أهم النصائح والخطوات اللازمة لاتخاذ القرار الصحيح وتجنب المشاكل الشائعة.',
      featured_image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80',
      author_id: seller.id,
      category_id: category.id,
      status: 'published',
      is_featured: true,
      meta_title: 'دليل شراء سيارة مستعملة - نصائح مهمة 2025',
      meta_description: 'تعلم كيفية شراء سيارة مستعملة بأفضل الطرق. دليل شامل يتضمن نصائح الخبراء لاختيار السيارة المناسبة وتجنب المشاكل.',
      reading_time: 5,
      views_count: 127,
      likes_count: 23,
      comments_count: 0,
      published_at: knex.fn.now(),

      // Car-specific fields
      car_make: 'Toyota',
      car_model: 'Camry',
      car_year: 2020,
      price_range_min: 15000,
      price_range_max: 25000,
      price_currency: 'USD',
      market_trend: 'stable',
      source: 'Cars Bids Team',
      rating: 4.5,
      pros: JSON.stringify([
        'موثوقية عالية',
        'استهلاك وقود اقتصادي',
        'قطع غيار متوفرة',
        'سهولة الصيانة',
        'قيمة إعادة البيع جيدة'
      ]),
      cons: JSON.stringify([
        'سعر مرتفع نسبياً',
        'تصميم تقليدي',
        'مساحة صندوق محدودة'
      ]),
      specifications: JSON.stringify({
        engine: '2.5L 4-Cylinder',
        transmission: 'CVT',
        fuel_economy: '8.5L/100km',
        seating: '5 passengers',
        safety_rating: '5 stars'
      })
    };

    // Insert the blog post
    const [insertedPost] = await knex('blog_posts').insert(samplePost).returning('id');
    const postId = insertedPost.id || insertedPost;

    console.log('✅ Sample blog post created successfully!');
    console.log('📋 Post details:');
    console.log(`   - ID: ${postId}`);
    console.log(`   - Title: ${samplePost.title}`);
    console.log(`   - Author: ${seller.first_name} ${seller.last_name} (${seller.username})`);
    console.log(`   - Category: ${category.name}`);
    console.log(`   - Status: ${samplePost.status}`);
    console.log(`   - Featured: ${samplePost.is_featured ? 'Yes' : 'No'}`);

    // Add some tags to the post
    const tags = await knex('blog_tags').select('id', 'name').whereIn('slug', ['used-cars', 'tips', 'reviews']).limit(3);

    if (tags.length > 0) {
      const tagRelations = tags.map(tag => ({
        post_id: postId,
        tag_id: tag.id
      }));

      await knex('blog_post_tags').insert(tagRelations);
      console.log('🏷️ Tags added:', tags.map(t => t.name).join(', '));
    }

  } catch (error) {
    console.error('❌ Failed to create sample blog post:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await knex.destroy();
  }
}

createSamplePost();
