import { registerAs } from "@nestjs/config";

export default registerAs("auth", () => ({
  secret: process.env.JWT_TOKEN_SECRET,
  expiresIn: process.env.JWT_TOKEN_EXPIRY_TIME
    ? process.env.JWT_TOKEN_EXPIRY_TIME
    : "24h", // '1d',
  ignoreTokenExpiration: false,
}));
