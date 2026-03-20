
import { generateToken } from './utils/jwt';
import * as dotenv from 'dotenv';
dotenv.config();

console.log(generateToken({ userId: 1, email: 'debug@example.com' }));
