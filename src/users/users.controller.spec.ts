import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Users } from "./entity/user.entity";
import { UserModel } from "../common/test/entity.model";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

describe("UsersController", () => {
  let controller: UsersController, service: UsersService, userModel: UserModel;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Users),
          useClass: UserModel,
        },
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              first_name: "Jest",
              last_name: "Test",
              gender: "male",
              email: "test@yopmail.com",
              password: "2023-02-02",
              is_active: true,
            }),
            findAll: jest.fn().mockResolvedValue([
              {
                id: 1,
                first_name: "Jest",
                last_name: "Test",
                gender: "male",
                email: "test@yopmail.com",
                password: "2023-02-02",
                is_active: true,
              },
            ]),
            findOne: jest.fn().mockResolvedValue({
              id: 1,
              first_name: "Jest",
              last_name: "Test",
              gender: "male",
              email: "test@yopmail.com",
              password: "2023-02-02",
              is_active: true,
            }),
            update: jest.fn().mockResolvedValue({
              id: 1,
              first_name: "Jest",
              last_name: "Test",
              gender: "male",
              email: "test@yopmail.com",
              password: "2023-02-02",
              is_active: true,
            }),
            remove: jest.fn().mockResolvedValue({
              id: 1,
              first_name: "Jest",
              last_name: "Test",
              gender: "male",
              email: "test@yopmail.com",
              password: "2023-02-02",
              is_active: true,
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
    userModel = module.get<UserModel>(getRepositoryToken(Users));
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(userModel).toBeDefined();
  });

  it("should be check user create api", async () => {
    const body: CreateUserDto = {
      first_name: "Jest",
      last_name: "Test",
      gender: "male",
      email: "test@yopmail.com",
      password: "2023-02-02",
      is_active: true,
    };

    //Compare the actual response with the expected response
    await expect(controller.create(body)).resolves.toEqual({
      id: 1,
      first_name: "Jest",
      last_name: "Test",
      gender: "male",
      email: "test@yopmail.com",
      password: "2023-02-02",
      is_active: true,
    });
  });

  it("should be check user find all api", async () => {
    //Compare the actual response with the expected response
    await expect(controller.findAll()).resolves.toEqual([
      {
        id: 1,
        first_name: "Jest",
        last_name: "Test",
        gender: "male",
        email: "test@yopmail.com",
        password: "2023-02-02",
        is_active: true,
      },
    ]);
  });

  it("should be check find user details api", async () => {
    //Compare the actual response with the expected response
    await expect(controller.findOne(1)).resolves.toEqual({
      id: 1,
      first_name: "Jest",
      last_name: "Test",
      gender: "male",
      email: "test@yopmail.com",
      password: "2023-02-02",
      is_active: true,
    });
  });

  it("should be check update user details api", async () => {
    const body: UpdateUserDto = {
      first_name: "Jest",
      last_name: "Test",
      gender: "male",
      email: "test@yopmail.com",
      password: "2023-02-02",
      is_active: true,
    };
    //Compare the actual response with the expected response
    await expect(controller.update(1, body)).resolves.toEqual({
      id: 1,
      first_name: "Jest",
      last_name: "Test",
      gender: "male",
      email: "test@yopmail.com",
      password: "2023-02-02",
      is_active: true,
    });
  });

  it("should be check delete user details api", async () => {
    //Compare the actual response with the expected response
    await expect(controller.remove(1)).resolves.toEqual({
      id: 1,
      first_name: "Jest",
      last_name: "Test",
      gender: "male",
      email: "test@yopmail.com",
      password: "2023-02-02",
      is_active: true,
    });
  });
});
