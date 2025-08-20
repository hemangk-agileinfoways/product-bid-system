import { HttpStatus } from "@nestjs/common";

export const RESPONSE_MESSAGES = {
  SUCCESS: "Response success",
  USER_LOGIN: "User Successfully Login",
  USER_LISTED: "Users Listed",
  USER_INSERTED: "User Created",
  USER_UPDATED: "User Updated",
  USER_DELETED: "User Deleted",
  RECORD_LISTED: "Records Listed",
  RECORD_INSERTED: "Record Inserted",
  RECORD_UPDATED: "Record Updated",
  RECORD_DELETED: "Record Deleted",
  DATABASE_ERROR: "Database operation failed",
};

export const RESPONSE_CODES = {
   DATABASE_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
}