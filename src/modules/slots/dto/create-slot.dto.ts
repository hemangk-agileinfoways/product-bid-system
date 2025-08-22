import { Type } from "class-transformer";
import {
  IsNumber,
  IsPositive,
  Min,
  ValidateNested,
  ArrayNotEmpty,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateSlotItemDto {
  @ApiProperty({
    description: "Number of slots to create",
    minimum: 1,
    example: 5,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  slotCount: number;

  @ApiProperty({
    description: "Price for each bid in the slot",
    minimum: 0,
    example: 10.99,
  })
  @IsNumber()
  @IsPositive()
  bidPrice: number;
}

export class CreateSlotsDto {
  @ApiProperty({
    description: "Array of slot configurations",
    type: [CreateSlotItemDto],
    example: [
      { slotCount: 5, bidPrice: 10.99 },
      { slotCount: 3, bidPrice: 15.99 },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateSlotItemDto)
  @ArrayNotEmpty()
  slots: CreateSlotItemDto[];
}
