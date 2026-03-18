export const MESSAGES = {
  HEALTH_OK: 'Nectar backend is running',
  ROUTE_NOT_FOUND: 'Route not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Unauthorized',

  LOGIN_SUCCESS: 'Login successful',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  SIGNUP_SUCCESS: 'Signup successful',
  USER_ALREADY_EXISTS: 'User already exists',

  MOBILE_NUMBER_REQUIRED: 'Mobile number is required',
  MOBILE_NUMBER_INVALID: 'Mobile number is invalid',
  EMAIL_REQUIRED: 'Email is required',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  USERNAME_REQUIRED: 'Username is required',
  EMAIL_INVALID: 'Email is invalid',
} as const;
