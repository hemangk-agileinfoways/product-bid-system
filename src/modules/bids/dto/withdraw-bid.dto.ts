import { IsNotEmpty, IsString } from "class-validator";

export class WithdrawBidDto {
  @IsNotEmpty()
  @IsString()
  bidId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
