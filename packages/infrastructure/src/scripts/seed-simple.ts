// Simple seed script to add sample products
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27018';
const DB_NAME = process.env.MONGODB_DB_NAME || 'oem_agent';

const sampleProducts = [
  {
    _id: 'prod-001',
    name: 'Premium Cotton T-Shirt',
    description: 'High-quality 100% cotton t-shirt perfect for custom branding',
    category: 'apparel',
    priceFrom: { amount: 8.99, currency: 'USD' },
    minQuantity: 50,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab',
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
      { name: 'Navy', hex: '#000080' },
    ],
    specs: {
      material: '100% Cotton',
      weight: '180gsm',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
    },
    printMethods: ['screen-print', 'embroidery', 'digital'],
    leadTimeDays: 14,
  },
  {
    _id: 'prod-002',
    name: 'Stainless Steel Water Bottle',
    description: 'Insulated water bottle with custom logo printing',
    category: 'drinkware',
    priceFrom: { amount: 12.50, currency: 'USD' },
    minQuantity: 100,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
    colors: [
      { name: 'Silver', hex: '#C0C0C0' },
      { name: 'Black', hex: '#000000' },
      { name: 'Blue', hex: '#0000FF' },
    ],
    specs: {
      capacity: '500ml',
      material: 'Stainless Steel',
      insulation: 'Double-walled',
    },
    printMethods: ['laser-engraving', 'screen-print'],
    leadTimeDays: 21,
  },
  {
    _id: 'prod-003',
    name: 'Canvas Tote Bag',
    description: 'Eco-friendly canvas tote bag for promotional events',
    category: 'bags',
    priceFrom: { amount: 5.99, currency: 'USD' },
    minQuantity: 100,
    imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7',
    colors: [
      { name: 'Natural', hex: '#F5F5DC' },
      { name: 'Black', hex: '#000000' },
    ],
    specs: {
      material: '100% Cotton Canvas',
      dimensions: '15" x 16"',
      handleLength: '11"',
    },
    printMethods: ['screen-print', 'heat-transfer'],
    leadTimeDays: 10,
  },
  {
    _id: 'prod-004',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with custom branding',
    category: 'tech',
    priceFrom: { amount: 15.99, currency: 'USD' },
    minQuantity: 50,
    imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db',
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'White', hex: '#FFFFFF' },
    ],
    specs: {
      connectivity: 'Wireless 2.4GHz',
      battery: 'AA Battery',
      dpi: '1600',
    },
    printMethods: ['pad-print', 'laser-engraving'],
    leadTimeDays: 28,
  },
  {
    _id: 'prod-005',
    name: 'Notebook Set',
    description: 'Premium notebook set with custom cover printing',
    category: 'office',
    priceFrom: { amount: 7.50, currency: 'USD' },
    minQuantity: 100,
    imageUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57',
    colors: [
      { name: 'Black', hex: '#000000' },
      { name: 'Brown', hex: '#8B4513' },
      { name: 'Blue', hex: '#0000FF' },
    ],
    specs: {
      pages: '80 sheets',
      size: 'A5',
      paper: '80gsm',
    },
    printMethods: ['screen-print', 'embossing', 'foil-stamping'],
    leadTimeDays: 14,
  },
];

async function seed() {
  console.log('🌱 Starting database seed...');
  console.log(`📍 Connecting to ${MONGODB_URL}`);
  
  const client = new MongoClient(MONGODB_URL);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');
    
    // Clear existing products
    await productsCollection.deleteMany({});
    console.log('🗑️  Cleared existing products');
    
    // Insert sample products
    await productsCollection.insertMany(sampleProducts as any);
    console.log(`✅ Inserted ${sampleProducts.length} sample products`);
    
    // Create indexes
    await productsCollection.createIndex({ category: 1 });
    await productsCollection.createIndex({ name: 'text', description: 'text' });
    console.log('📇 Created indexes');
    
    // Verify
    const count = await productsCollection.countDocuments();
    console.log(`📊 Total products in database: ${count}`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample products:');
    sampleProducts.forEach(p => {
      console.log(`  - ${p.name} (${p.category}) - $${p.priceFrom.amount}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seed();

