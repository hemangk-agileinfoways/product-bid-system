import { HttpStatus } from "@nestjs/common";
export const SUCCESS_RESPONSES = {
  CREATED: {
    MESSAGE: "Created successfully.",
    STATUS_CODE: HttpStatus.CREATED,
  },
  UPDATED: {
    MESSAGE: "Updated successfully.",
    STATUS_CODE: HttpStatus.OK,
  },
  DELETED: {
    MESSAGE: "Deleted successfully.",
    STATUS_CODE: HttpStatus.OK,
  },
  RETRIEVED: {
    MESSAGE: "Retrieved successfully.",
    STATUS_CODE: HttpStatus.OK,
  },
};
