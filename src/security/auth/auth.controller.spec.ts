import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersService } from "../../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { LoggerService } from "../../common/logger/logger.service";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserModel } from "../../common/test/entity.model";
import { Users } from "../../users/entity/user.entity";

describe("AuthController", () => {
  let controller: AuthController,
    service: AuthService,
    userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        UsersService,
        JwtService,
        LoggerService,
        ConfigService,
        {
          provide: getRepositoryToken(Users),
          useClass: UserModel,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    userService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(userService).toBeDefined();
  });
});
