import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

class BidSlotDto {
  @ApiProperty({
    description: "The ID of the slot to bid on",
    example: "507f1f77bcf86cd799439011",
  })
  @IsNotEmpty()
  @IsString()
  slotId: string;

  @ApiProperty({
    description: "Number of slots to bid for",
    minimum: 1,
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  count: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  bidPrice: number;
}

export class PlaceBidDto {
  @IsNotEmpty()
  @IsString()
  prodId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BidSlotDto)
  slots: BidSlotDto[];
}
