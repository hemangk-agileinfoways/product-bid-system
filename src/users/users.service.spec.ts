import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { UserModel } from "../common/test/entity.model";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Users } from "./entity/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { HttpStatus } from "@nestjs/common";
import { LoggerService } from "../common/logger/logger.service";
import { ConfigService } from "@nestjs/config";
import { UpdateUserDto } from "./dto/update-user.dto";
import { LoginDto } from "../common/dto/common.dto";

describe("UsersService", () => {
  let service: UsersService, userModel: UserModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        LoggerService,
        ConfigService,
        {
          provide: getRepositoryToken(Users),
          useClass: UserModel,
        },
      ],
    }).compile();

    (service = module.get<UsersService>(UsersService)),
      (userModel = module.get<UserModel>(getRepositoryToken(Users)));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(userModel).toBeDefined();
  });

  describe("create user api", () => {
    const body: CreateUserDto = {
      first_name: "Admin",
      last_name: "test",
      email: "test@yopmail.com",
      gender: "male",
      password: "123456",
      is_active: true,
    };

    it("should check create user api", async () => {
      // Mock the addModel.create method to return a ad entity
      jest.spyOn(userModel, "findOneBy").mockResolvedValue(null as never);
      jest.spyOn(userModel, "getUserByEmail").mockResolvedValue(null as never);
      jest.spyOn(userModel, "create").mockResolvedValue(body as never);
      jest.spyOn(userModel, "save").mockResolvedValue(body as never);

      const result = await service.create(body);
      // Expectations
      expect(userModel.create).toHaveBeenCalled();
      expect(userModel.save).toHaveBeenCalled();
      expect(result).toEqual(body);
    });

    it("should throw email already exist error", async () => {
      try {
        // Mock the addModel.create method to return a ad entity
        jest
          .spyOn(userModel, "getUserByEmail")
          .mockResolvedValue(body as never);
        await service.create(body);
        // Expectations
        expect(userModel.getUserByEmail).toHaveBeenCalled();
      } catch (error) {
        expect(error.response).toEqual({
          statusCode: HttpStatus.CONFLICT,
          message: "User already exists",
          error: "UserAlreadyExists",
        });
      }
    });
  });

  describe("user find all api", () => {
    it("should check user find all api", async () => {
      // Mock the addModel.create method to return a ad entity
      jest.spyOn(userModel, "find").mockResolvedValue([
        {
          id: 1,
          first_name: "Admin",
          last_name: "test",
          email: "test@yopmail.com",
          gender: "male",
          password: "123456",
          is_active: true,
        },
        {
          id: 2,
          first_name: "Admin",
          last_name: "test",
          email: "test@yopmail.com",
          gender: "male",
          password: "123456",
          is_active: true,
        },
      ] as never);

      const result = await service.findAll();
      // Expectations
      expect(userModel.find).toHaveBeenCalled();
      expect(result).toEqual([
        {
          id: 1,
          first_name: "Admin",
          last_name: "test",
          email: "test@yopmail.com",
          gender: "male",
          password: "123456",
          is_active: true,
        },
        {
          id: 2,
          first_name: "Admin",
          last_name: "test",
          email: "test@yopmail.com",
          gender: "male",
          password: "123456",
          is_active: true,
        },
      ]);
    });
  });

  describe("user details api", () => {
    it("should check user details api", async () => {
      // Mock the addModel.create method to return a ad entity
      jest.spyOn(userModel, "findOneBy").mockResolvedValue({
        id: 1,
        first_name: "Admin",
        last_name: "test",
        email: "test@yopmail.com",
        gender: "male",
        password: "123456",
        is_active: true,
      } as never);

      const result = await service.findOne(1);
      // Expectations
      expect(userModel.findOneBy).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        first_name: "Admin",
        last_name: "test",
        email: "test@yopmail.com",
        gender: "male",
        password: "123456",
        is_active: true,
      });
    });
  });

  describe("update user api", () => {
    it("should check update user api", async () => {
      const body: UpdateUserDto = {
        first_name: "Admin",
        last_name: "test",
        email: "test@yopmail.com",
        gender: "male",
        password: "123456",
        is_active: true,
      };
      // Mock the addModel.create method to return a ad entity
      jest.spyOn(userModel, "update").mockResolvedValue({
        id: 1,
        first_name: "Admin",
        last_name: "test",
        email: "test@yopmail.com",
        gender: "male",
        password: "123456",
        is_active: true,
      } as never);

      const result = await service.update(1, body);
      // Expectations
      expect(userModel.update).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        first_name: "Admin",
        last_name: "test",
        email: "test@yopmail.com",
        gender: "male",
        password: "123456",
        is_active: true,
      });
    });
  });

  describe("delete user api", () => {
    it("should check delete user api", async () => {
      // Mock the addModel.create method to return a ad entity
      jest.spyOn(userModel, "delete").mockResolvedValue({
        id: 1,
        first_name: "Admin",
        last_name: "test",
        email: "test@yopmail.com",
        gender: "male",
        password: "123456",
        is_active: true,
      } as never);

      const result = await service.remove(1);
      // Expectations
      expect(userModel.delete).toHaveBeenCalled();
      expect(result).toEqual({
        id: 1,
        first_name: "Admin",
        last_name: "test",
        email: "test@yopmail.com",
        gender: "male",
        password: "123456",
        is_active: true,
      });
    });
  });

  describe("login user api", () => {
    const body: LoginDto = {
      email: "test@yopmail.com",
      password: "123456",
    };

    it("should throw inactive user error", async () => {
      try {
        // Mock the addModel.create method to return a ad entity
        jest.spyOn(userModel, "findOneBy").mockResolvedValue({
          id: 1,
          first_name: "Admin",
          last_name: "test",
          email: "test@yopmail.com",
          gender: "male",
          password: "123456",
          is_active: false,
        } as never);

        await service.login(body);
        // Expectations
        expect(userModel.findOneBy).toHaveBeenCalled();
      } catch (error) {
        expect(error.response).toEqual({
          message: "Account not active!",
          error: "AccountNotActive",
          statusCode: HttpStatus.UNAUTHORIZED,
        });
      }
    });

    it("should throw user not found error", async () => {
      try {
        // Mock the addModel.create method to return a ad entity
        jest.spyOn(userModel, "findOneBy").mockResolvedValue(null as never);

        await service.login(body);
        // Expectations
        expect(userModel.findOneBy).toHaveBeenCalled();
      } catch (error) {
        expect(error.response).toEqual({
          message: "Account does not exist!",
          error: "AccountNotExist",
          statusCode: HttpStatus.FORBIDDEN,
        });
      }
    });
  });
});
