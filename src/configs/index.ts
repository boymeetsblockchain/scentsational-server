export const CONFIGS = {
  PORT: process.env.PORT || 3000,

  // JWT Configuration
  ACCESS_TOKEN_LIFETIME_MINS: 60,
  REFRESH_TOKEN_LIFETIME_DAYS: 7,
  JWT_SECRET: process.env.JWT_SECRET || 'adsadsfa-adsfasdfa-asdfa3-ada9ad9ad',
  BCRYPT_SALT_ROUNDS: 10,
};
