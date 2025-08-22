import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  MinLength,
  Min,
  IsOptional,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProductDto {
  @ApiProperty({
    description: "The name of the product",
    minLength: 3,
    example: "iPhone 13",
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: "Detailed description of the product",
    minLength: 10,
    example: "Latest iPhone model with A15 Bionic chip and Pro camera system",
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({
    description: "Price of the product",
    minimum: 0,
    example: 999.99,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    description: "Image file for the product",
    type: "string",
    format: "binary",
  })
  @IsOptional()
  @IsString()
  image?: string;
}
