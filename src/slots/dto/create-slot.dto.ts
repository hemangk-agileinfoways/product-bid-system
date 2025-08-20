import { Type } from 'class-transformer';
import { IsNumber, IsPositive, Min, ValidateNested, ArrayNotEmpty } from 'class-validator';

export class CreateSlotItemDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  slotCount: number;

  @IsNumber()
  @IsPositive()
  bidPrice: number;
}

export class CreateSlotsDto {
  @ValidateNested({ each: true })
  @Type(() => CreateSlotItemDto)
  @ArrayNotEmpty()
  slots: CreateSlotItemDto[];
}
