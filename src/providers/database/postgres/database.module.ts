import { Module } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Users } from "src/users/entity/user.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const options: TypeOrmModuleOptions = {
          type: "postgres",
          ssl: JSON.parse(configService.get("database.postgres.enableSSL")),
          host: configService.get<string>("database.host"),
          port: configService.get<number>("database.port"),
          username: configService.get<string>("database.user"),
          password: configService.get<string>("database.password"),
          database: configService.get<string>("database.name"),
          entities: [Users],
          synchronize: true,
          logging: true,
        };
        return options;
      },
    }),
    // TypeOrmModule.forFeature(entities, 'user-db'),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
