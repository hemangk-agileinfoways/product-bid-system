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

class BidSlotDto {
  @IsNotEmpty()
  @IsString()
  slotId: string;

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
