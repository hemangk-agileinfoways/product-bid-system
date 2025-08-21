import { IsNotEmpty, IsString } from "class-validator";

export class DeclareResultDto {
  @IsNotEmpty()
  @IsString()
  productId: string;
}
