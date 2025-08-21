import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from "@nestjs/common";
import { BidsService } from "./bids.service";
import { PlaceBidDto } from "./dto/place-bid.dto";
import { WithdrawBidDto } from "./dto/withdraw-bid.dto";
import { JwtAuthGuard } from "src/security/auth/guards/jwt-auth.guard";
import { ResponseMessage } from "src/common/decorators/response.decorator";
import { ValidationPipe } from "@nestjs/common";
import { BID_SUCCESS_MESSAGES } from "./constants/messages.constant";
import { Public } from "src/security/auth/auth.decorator";

@Controller("bids")
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ResponseMessage(BID_SUCCESS_MESSAGES.CREATED)
  async placeBid(
    @Body(new ValidationPipe({ transform: true })) dto: PlaceBidDto,
    @Request() req
  ) {
    return this.bidsService.placeBid(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("withdraw")
  @ResponseMessage(BID_SUCCESS_MESSAGES.WITHDRAWN)
  async withdrawBid(
    @Body(new ValidationPipe({ transform: true })) dto: WithdrawBidDto,
    @Request() req
  ) {
    return this.bidsService.withdrawBid(dto, req.user);
  }

  @Public()
  @Get("leaderboard/:productId")
  @ResponseMessage(BID_SUCCESS_MESSAGES.RETRIEVED)
  async getLeaderboard(@Param("productId") productId: string) {
    return this.bidsService.getLeaderboard(productId);
  }

  @Public()
  @Get("slots/:productId")
  @ResponseMessage("Slot availability retrieved successfully")
  async getProductSlotStatus(@Param("productId") productId: string) {
    return this.bidsService.getProductSlotStatus(productId);
  }
}
