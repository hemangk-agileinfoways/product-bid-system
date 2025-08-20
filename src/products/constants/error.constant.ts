import { HttpStatus } from "@nestjs/common";

export const PRODUCT_ERROR_MESSAGES = {
  NOT_FOUND: "Product not found",
  INVALID_ID: "Invalid product ID format",
  BID_STARTED: "You cannot perform this action as bidding has started",
  AMOUNT_LOCKED: "You cannot update amount as slots are created",
  INVALID_STATUS_TRANSITION: (from: string, to: string) => 
    `Invalid status transition from ${from} to ${to}`,
  DATABASE_ERROR: "Database operation failed",
} as const;

export const PRODUCT_ERROR_CODES = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  INVALID_ID: HttpStatus.BAD_REQUEST,
  BID_STARTED: HttpStatus.BAD_REQUEST,
  AMOUNT_LOCKED: HttpStatus.BAD_REQUEST,
  INVALID_STATUS_TRANSITION: HttpStatus.BAD_REQUEST,
  DATABASE_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
} as const;
