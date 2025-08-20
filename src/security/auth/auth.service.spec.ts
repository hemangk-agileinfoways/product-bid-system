import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { LoggerService } from "../../common/logger/logger.service";
import { ConfigService } from "@nestjs/config";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Users } from "../../users/entity/user.entity";
import { UserModel } from "../../common/test/entity.model";

describe("AuthService", () => {
  let service: AuthService, userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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

    service = module.get<AuthService>(AuthService);
    userService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(userService).toBeDefined();
  });
});
