import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Public } from "./auth.decorator";
import { LoginDto } from "../../common/dto/common.dto";
import { ResponseMessage } from "../../common/decorators/response.decorator";
import { RESPONSE_MESSAGES } from "../../common/constants/response.constant";

@Controller("auth")
@ApiTags("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage(RESPONSE_MESSAGES.USER_LOGIN)
  @Post("/login")
  async login(@Body() params: LoginDto) {
    return await this.authService.login(params);
  }
}
