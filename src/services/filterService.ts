import { getCategories } from './categoryService';
import { getBrands } from './brandService';

export const getFiltersData = async () => {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return { categories, brands };
};

