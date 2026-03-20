import { Router } from 'express';

import { authRoutes } from './authRoutes';
import { brandRoutes } from './brandRoutes';
import { cartRoutes } from './cartRoutes';
import { categoryRoutes } from './categoryRoutes';
import { filterRoutes } from './filterRoutes';
import { homeScreenRoutes } from './homeScreenRoutes';
import { locationRoutes } from './locationRoutes';
import { productRoutes } from './productRoutes';
import { userRoutes } from './userRoutes';

export const routes = Router();

routes.use('/api/auth', authRoutes);
routes.use('/api/categories', categoryRoutes);
routes.use('/api/brands', brandRoutes);
routes.use('/api/filters', filterRoutes);
routes.use('/api/home-screen', homeScreenRoutes);
routes.use('/api/home', homeScreenRoutes);
routes.use('/api/products', productRoutes);
routes.use('/api/cart', cartRoutes);
routes.use('/api/locations', locationRoutes);
routes.use('/api/user', userRoutes);
