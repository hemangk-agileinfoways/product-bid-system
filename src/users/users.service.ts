import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { LoginDto } from "../common/dto/common.dto";
import { AuthExceptions, TypeExceptions } from "../common/helpers/exceptions";
import { LoggerService } from "../common/logger/logger.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Users } from "./entity/user.entity";
import { ObjectId, Repository } from "typeorm";

@Injectable()
export class UsersService {
  constructor(
    private myLogger: LoggerService,
    private configService: ConfigService,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
  ) {
    // Due to transient scope, UsersService has its own unique instance of MyLogger,
    // so setting context here will not affect other instances in other services
    this.myLogger.setContext(UsersService.name);
  }

  async seedUsers() {
    const seedUsers = this.configService.get('database.seedUsers');
    
    for (const userData of seedUsers) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await this.userRepository.save({
          ...userData,
          password: hashedPassword,
          is_active: true
        });
        this.myLogger.log(`Seeded user: ${userData.email}`);
      }
    }
  }

  async create(createUserDto: CreateUserDto) {
    // Check duplicate user
    if (await this.getUserByEmail(createUserDto.email)) {
      throw TypeExceptions.UserAlreadyExists();
    }
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(userId: ObjectId) {
    return await this.userRepository.findOneBy({ _id: userId });
  }

  async update(userId: ObjectId, updateUserDto: UpdateUserDto) {
    return await this.userRepository.update({ _id: userId }, updateUserDto);
  }

  async remove(userId: ObjectId) {
    return await this.userRepository.delete({ _id: userId });
  }

  async createInitialUser(): Promise<void> {
    const user = await this.getUserByEmail(
      this.configService.get("database.initialUser.email"),
    );

    if (user) {
      this.myLogger.customLog("Initial user already loaded.");
    } else {
      const params: CreateUserDto = {
        first_name: this.configService.get("database.initialUser.first_name"),
        last_name: this.configService.get("database.initialUser.last_name"),
        gender: this.configService.get("database.initialUser.gender"),
        email: this.configService.get("database.initialUser.email"),
        password: "",
        is_active: true,
      };

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(
        this.configService.get("database.initialUser.password"),
        salt,
      );

      params.password = hash;

      const user = await this.userRepository.create(params);
      await this.userRepository.save(user);
      this.myLogger.log("Initial user loaded successfully.");
    }
  }

  async login(params: LoginDto) {
    const user = await this.userRepository.findOneBy({
      email: params.email,
    });
    if (!user) {
      throw AuthExceptions.AccountNotExist();
    }

    if (!user.is_active) {
      throw AuthExceptions.AccountNotActive();
    }

    if (!bcrypt.compareSync(params.password, user.password)) {
      throw AuthExceptions.InvalidIdPassword();
    }
    delete user.password;

    return user;
  }

  async getUserByEmail(email: string) {
    return await this.userRepository.findOneBy({ email });
  }
}
