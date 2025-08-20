import { HttpException, HttpStatus } from "@nestjs/common";

export const TypeExceptions = {
  UserNotFound(): HttpException {
    return new HttpException(
      {
        message: "User not found",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  },

  NotFound(message: string): HttpException {
    return new HttpException(
      {
        message,
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      },
      HttpStatus.NOT_FOUND,
    );
  },

  InvalidOperation(message: string): HttpException {
    return new HttpException(
      {
        message,
        error: "Invalid Operation",
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  },

  UserAlreadyExists(): HttpException {
    return new HttpException(
      {
        message: "User already exists",
        error: "UserAlreadyExists",
        statusCode: HttpStatus.CONFLICT,
      },
      HttpStatus.CONFLICT,
    );
  },

  InvalidFile(): HttpException {
    return new HttpException(
      {
        message: "Uploaded file is invalid",
        error: "InvalidFile",
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  },
};
