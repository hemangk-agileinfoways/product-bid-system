import { Module, OnModuleInit } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { LoggerModule } from "src/common/logger/logger.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Users } from "src/users/entity/user.entity";

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([Users])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule implements OnModuleInit {
  constructor(private readonly userService: UsersService) {}

  async onModuleInit(): Promise<void> {
    await this.userService.seedUsers();
  }
}
