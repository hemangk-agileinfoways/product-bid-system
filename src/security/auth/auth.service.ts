import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "../../common/dto/common.dto";
import { LoggerService } from "../../common/logger/logger.service";
import { UsersService } from "../../users/users.service";
import { JwtPayload } from "../../common//interfaces/jwt.interface";

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private myLogger: LoggerService,
  ) {
    this.myLogger.setContext(AuthService.name);
  }

  async login(params: LoginDto) {
    const user = await this.userService.login(params);
    const access_token = this.generateAuthToken(user);
    user["access_token"] = access_token;
    return user;
  }

  generateAuthToken(user) {
    const payload: JwtPayload = {
      id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
