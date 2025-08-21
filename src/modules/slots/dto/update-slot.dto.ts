import { PartialType } from "@nestjs/mapped-types";
import { CreateSlotItemDto } from "./create-slot.dto";
import { IsArray, IsMongoId, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class UpdateSlotItemDto extends PartialType(CreateSlotItemDto) {
  @IsMongoId()
  slotId: string;
}

export class UpdateSlotsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSlotItemDto)
  slots: UpdateSlotItemDto[];
}
