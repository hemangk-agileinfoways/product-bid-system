import { DocumentBuilder } from "@nestjs/swagger";
import { AppEnvironment } from "../common/constants/enum.constant";

export const getSwaggerConfig = (config: any) => {
  const builder = new DocumentBuilder()
    .setTitle("Product Bid System API")
    .setDescription("API documentation for Product Bid System")
    .setVersion("1.0.0")
    .addBearerAuth()
    .addTag("Products", "Product management endpoints")
    .addTag("Bids", "Bidding system endpoints")
    .addTag("Slots", "Slot management endpoints")
    .addTag("Auth", "Authentication endpoints")
    .addTag("Users", "User management endpoints");

  // Add environment-specific server
  if (config.environment === AppEnvironment.PRODUCTION) {
    builder.addServer("https://api.example.com");
  } else if (config.environment === AppEnvironment.DEVELOPMENT) {
    builder.addServer(`http://localhost:${config.port}`);
  }

  return builder.build();
};

export const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "none",
    filter: true,
    displayRequestDuration: true,
  },
};
