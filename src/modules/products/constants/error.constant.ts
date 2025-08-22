import { HttpStatus } from "@nestjs/common";

export const PRODUCT_ERROR_MESSAGES = {
  NOT_FOUND: "Product not found",
  INVALID_ID: "Invalid product ID format",
  BID_STARTED: "You cannot perform this action as bidding has started",
  BID_ENDED: "You cannot perform this action as bidding has ended",
  AMOUNT_LOCKED: "You cannot update amount as slots are created",
  ALREADY_SOLD: "You cannot perform this action as product is already sold",
  INVALID_STATUS_TRANSITION: (from: string, to: string) =>
    `Invalid status transition from ${from} to ${to}`,
} as const;

export const PRODUCT_ERROR_CODES = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  INVALID_ID: HttpStatus.BAD_REQUEST,
  BID_STARTED: HttpStatus.BAD_REQUEST,
  AMOUNT_LOCKED: HttpStatus.BAD_REQUEST,
  INVALID_STATUS_TRANSITION: HttpStatus.BAD_REQUEST,
} as const;
