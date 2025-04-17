import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expirationTime: process.env.JWT_EXPIRATION,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpirationTime: process.env.JWT_REFRESH_EXPIRATION,
}));
