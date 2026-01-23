import { z } from 'zod';

export const ProductCategorySchema = z.enum([
  'apparel',
  'drinkware',
  'accessories',
  'tech',
  'bags',
  'home',
  'office',
  'outdoor',
]);

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const ProductCategoryLabels: Record<ProductCategory, string> = {
  apparel: 'Apparel & Clothing',
  drinkware: 'Drinkware',
  accessories: 'Accessories',
  tech: 'Tech & Electronics',
  bags: 'Bags & Luggage',
  home: 'Home & Living',
  office: 'Office Supplies',
  outdoor: 'Outdoor & Sports',
};


