import { connectMongoDB, getDB } from '../database/mongodb';
import { Product } from '@repo/domain';

const mockProducts = [
  {
    id: 'prod_001',
    name: 'Unstructured Baseball Cap - 100% Cotton',
    description: 'Classic 6-panel baseball cap with adjustable strap. Perfect for embroidery or screen printing.',
    category: 'apparel' as const,
    priceFrom: { amount: 5.77, currency: 'USD' as const },
    minQuantity: 20,
    imageUrl: 'https://via.placeholder.com/400x400/6366F1/FFFFFF?text=Baseball+Cap',
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Navy', hex: '#000080' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Red', hex: '#FF0000' },
    ],
    specs: {
      material: '100% Cotton',
      printArea: '3" x 3"',
      sizes: ['One Size Fits All'],
    },
    printMethods: ['embroidery', 'screen-print'],
    leadTimeDays: 14,
  },
  {
    id: 'prod_002',
    name: 'Premium Hoodie - Heavyweight Fleece',
    description: 'Comfortable heavyweight fleece hoodie with kangaroo pocket. Ideal for screen printing and embroidery.',
    category: 'apparel' as const,
    priceFrom: { amount: 12.85, currency: 'USD' as const },
    minQuantity: 50,
    imageUrl: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Hoodie',
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Navy', hex: '#000080' },
      { name: 'Gray', hex: '#808080' },
      { name: 'Purple', hex: '#6366F1' },
    ],
    specs: {
      material: '80% Cotton, 20% Polyester',
      printArea: '12" x 14"',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
    },
    printMethods: ['screen-print', 'dtg'],
    leadTimeDays: 14,
  },
  {
    id: 'prod_003',
    name: 'Stainless Steel Water Bottle - 20oz',
    description: 'Double-wall vacuum insulated stainless steel bottle. Keeps drinks cold for 24 hours.',
    category: 'drinkware' as const,
    priceFrom: { amount: 8.99, currency: 'USD' as const },
    minQuantity: 100,
    imageUrl: 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Water+Bottle',
    colors: [
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Black', hex: '#000000' },
      { name: 'Blue', hex: '#0000FF' },
      { name: 'Red', hex: '#FF0000' },
    ],
    specs: {
      capacity: '20oz',
      material: 'Stainless Steel',
      printArea: '3" x 4"',
    },
    printMethods: ['laser-engraving', 'screen-print'],
    leadTimeDays: 21,
  },
  {
    id: 'prod_004',
    name: 'Ceramic Coffee Mug - 11oz',
    description: 'Classic white ceramic mug perfect for custom printing. Microwave and dishwasher safe.',
    category: 'drinkware' as const,
    priceFrom: { amount: 3.45, currency: 'USD' as const },
    minQuantity: 48,
    imageUrl: 'https://via.placeholder.com/400x400/F59E0B/FFFFFF?text=Coffee+Mug',
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
      { name: 'Red', hex: '#FF0000' },
    ],
    specs: {
      capacity: '11oz',
      material: 'Ceramic',
      printArea: '3.5" x 2.5"',
    },
    printMethods: ['sublimation', 'screen-print'],
    leadTimeDays: 10,
  },
  {
    id: 'prod_005',
    name: 'USB Flash Drive - 16GB',
    description: 'Custom USB flash drive with full-color printing. USB 3.0 high-speed transfer.',
    category: 'tech' as const,
    priceFrom: { amount: 4.99, currency: 'USD' as const },
    minQuantity: 200,
    imageUrl: 'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=USB+Drive',
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Silver', hex: '#C0C0C0' },
    ],
    specs: {
      capacity: '16GB',
      interface: 'USB 3.0',
      printArea: '1" x 0.5"',
    },
    printMethods: ['full-color-print', 'laser-engraving'],
    leadTimeDays: 14,
  },
  {
    id: 'prod_006',
    name: 'Tote Bag - Canvas',
    description: 'Heavy-duty canvas tote bag with reinforced handles. Great for screen printing.',
    category: 'bags' as const,
    priceFrom: { amount: 5.67, currency: 'USD' as const },
    minQuantity: 50,
    imageUrl: 'https://via.placeholder.com/400x400/EF4444/FFFFFF?text=Tote+Bag',
    colors: [
      { name: 'Natural', hex: '#F5F5DC' },
      { name: 'Black', hex: '#000000' },
      { name: 'Navy', hex: '#000080' },
    ],
    specs: {
      material: '100% Cotton Canvas',
      size: '15" x 16"',
      printArea: '10" x 10"',
    },
    printMethods: ['screen-print', 'heat-transfer'],
    leadTimeDays: 10,
  },
];

async function seed() {
  try {
    console.log('🌱 Starting database seed...');
    
    await connectMongoDB();
    const db = getDB();

    // Clear existing data
    console.log('🗑️  Clearing existing products...');
    await db.collection('products').deleteMany({});

    // Insert mock products
    console.log('📦 Inserting mock products...');
    const products = mockProducts.map(p => Product.fromData(p).toJSON());
    await db.collection('products').insertMany(products);

    console.log(`✅ Successfully seeded ${products.length} products`);
    
    // Log summary
    const categories = [...new Set(mockProducts.map(p => p.category))];
    console.log(`\n📊 Summary:`);
    console.log(`   Total products: ${products.length}`);
    console.log(`   Categories: ${categories.join(', ')}`);
    console.log(`   Price range: $${Math.min(...mockProducts.map(p => p.priceFrom.amount))} - $${Math.max(...mockProducts.map(p => p.priceFrom.amount))}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();


