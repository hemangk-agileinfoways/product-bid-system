export const SLOT_ERROR_MESSAGES = {
  NOT_FOUND: "Slot not found",
  PRODUCT_LOCKED:
    "Cannot create slots for this product - bidding has already started",
  AMOUNT_MISMATCH: "Total slot amount must exactly match product amount",
  INVALID_SLOT_DATA: "Invalid slot data provided",
  UPDATE_FAILED: "Failed to update slot",
  DELETE_FAILED: "Failed to delete slot",
  NO_UPDATE_FIELDS: "At least one field must be provided for update",
  PRODUCT_MISMATCH: "One or more slots do not belong to the specified product",
} as const;

export const SLOT_SUCCESS_MESSAGES = {
  CREATED: "Slots created successfully",
  PRODUCT_READY: "All slots created - product is ready for bidding",
} as const;
