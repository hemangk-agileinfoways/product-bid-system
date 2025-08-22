import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { LoggerService } from "./common/logger/logger.service";
import { HttpExceptionFilter } from "./common/exceptions/http-exception.filter";
import helmet from "helmet";
import { AppEnvironment } from "./common/constants/enum.constant";
import "reflect-metadata";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get app config for cors/helmet settings and starting the app.
  const configService = app.get(ConfigService);
  const appConfig = configService.get("express");

  // Configure OpenAPI/Swagger documentation
  if (
    appConfig.environment !== AppEnvironment.PRODUCTION ||
    process.env.ENABLE_DOCS === "true"
  ) {
    const { getSwaggerConfig, swaggerOptions } = await import(
      "./config/swagger.config"
    );

    const document = SwaggerModule.createDocument(
      app,
      getSwaggerConfig(appConfig)
    );

    // Setup Swagger UI
    SwaggerModule.setup("api-docs", app, document, swaggerOptions);
  }

  // Apply custom logger
  app.useLogger(new LoggerService());

  // Use Helmet middleware for securing HTTP headers
  app.use(helmet());

  // Enable/Disable CORS
  if (appConfig.enableCors) {
    app.enableCors();
  }
  // Apply global validation pipe to handle DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  // Apply the HttpExceptionFilter globally
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(appConfig.port);
}
bootstrap();
