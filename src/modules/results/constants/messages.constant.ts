export const RESULT_ERROR_MESSAGES = {
  NOT_FOUND: "Result not found",
  PRODUCT_NOT_FOUND: "Product not found",
  SLOTS_NOT_FULL: "Cannot declare result until all slots are booked",
  NO_BIDS: "No bids found for this product",
  ALREADY_DECLARED: "Result already declared for this product",
  INVALID_PRODUCT_STATUS:
    "Cannot declare result - product is not in BID_ENDED status",
} as const;

export const RESULT_SUCCESS_MESSAGES = {
  CREATED: "Result declared successfully",
  RETRIEVED: "Result retrieved successfully",
} as const;
