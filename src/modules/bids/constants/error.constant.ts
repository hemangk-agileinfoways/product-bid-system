import { HttpStatus } from "@nestjs/common";

export const BID_ERROR_MESSAGES = {
  NOT_FOUND: "Bid not found",
  PRODUCT_NOT_FOUND: "Product not found",
  PRODUCT_NOT_READY: "Product is not ready for bidding",
  NOT_WITHDRAWABLE: "Bid is not withdrawable",
  WITHDRAWAL_TIME_EXCEEDED: "Withdrawal time limit exceeded",
  INVALID_OPERATION: "Invalid operation on bid",
  ACTIVE_BID_EXISTS: "User already has an active bid for this product",
  SLOTS_FULL_NO_WITHDRAWAL: "Cannot withdraw bid - all slots are full",
  INSUFFICIENT_SLOTS: "Insufficient slots available",
  SLOT_NOT_AVAILABLE: "Requested slot is not available",
} as const;

export const BID_ERROR_CODES = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  ALREADY_WITHDRAWN: HttpStatus.BAD_REQUEST,
  NOT_WITHDRAWABLE: HttpStatus.BAD_REQUEST,
  WITHDRAWAL_TIME_EXCEEDED: HttpStatus.BAD_REQUEST,
  INVALID_OPERATION: HttpStatus.BAD_REQUEST,
  ACTIVE_BID_EXISTS: HttpStatus.CONFLICT,
} as const;
