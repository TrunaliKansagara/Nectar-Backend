import { getAllCategoriesRepo } from '../repositories/categoryRepository';

export const getCategories = async () => {
  return getAllCategoriesRepo();
};

