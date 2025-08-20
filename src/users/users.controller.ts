import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RESPONSE_MESSAGES } from "../common/constants/response.constant";
import { ResponseMessage } from "../common/decorators/response.decorator";
import { Public } from "../security/auth/auth.decorator";
import { ObjectId } from "typeorm";

@Controller("users")
@ApiTags("users")
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("create")
  @ResponseMessage(RESPONSE_MESSAGES.USER_INSERTED)
  @Public()
  @ApiOperation({
    description: `
    This API will be used for creating new user using the admin panel.

    Figma Screen Reference: AP - User 1.0 To 1.6
        
    Below is the flow:

    1). Check email is exist OR not in tbl_user table if the user is already exist then give the error response with **This email is already registered with us.** Otherwise we have to insert the new user into the tbl_user table also we need to create a JWT token for the user and returning to the response.

    2). Password should be encrypted while storing the user information into the database.
    `,
  })
  @ApiOkResponse({
    schema: {
      example: {
        statusCode: HttpStatus.OK,
        message: RESPONSE_MESSAGES.USER_INSERTED,
        data: {
          firstName: "string",
          lastName: "string",
          gender: "string",
          email: "string",
          accessToken: "string",
        },
      },
    },
  })
  @ApiBadRequestResponse({
    schema: {
      example: {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "This email is already registered with us.",
        data: {},
      },
    },
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get("getAll")
  @ResponseMessage(RESPONSE_MESSAGES.USER_LISTED)
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get("get/:id")
  @ResponseMessage(RESPONSE_MESSAGES.USER_LISTED)
  @Public()
  findOne(@Param("id") id: ObjectId) {
    return this.usersService.findOne(id);
  }

  @Patch("update/:id")
  @ResponseMessage(RESPONSE_MESSAGES.USER_UPDATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  update(@Param("id") id: ObjectId, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete("delete/:id")
  @ResponseMessage(RESPONSE_MESSAGES.USER_DELETED)
  remove(@Param("id") id: ObjectId) {
    return this.usersService.remove(id);
  }
}
