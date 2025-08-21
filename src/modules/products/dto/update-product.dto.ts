import { PartialType } from "@nestjs/mapped-types";
import { CreateProductDto } from "./create-product.dto";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { ProductStatus } from "../constants/enum.constant";

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  hasSlots?: boolean;

  @IsOptional()
  @IsBoolean()
  hasBids?: boolean;
}
