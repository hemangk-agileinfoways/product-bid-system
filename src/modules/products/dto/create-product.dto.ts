import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, MinLength, Min, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  description: string;

  @IsNotEmpty()
  @Type(() => Number) 
  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  image?: string; 
}
