import { getAllBrandsRepo } from '../repositories/brandRepository';

export const getBrands = async () => {
  return getAllBrandsRepo();
};

