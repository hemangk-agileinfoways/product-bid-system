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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from "@nestjs/swagger";

@ApiTags("Bids")
@ApiBearerAuth()
@Controller("bids")
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: "Place a new bid",
    description: "Place a bid on one or more slots for a product",
  })
  @ApiBody({ type: PlaceBidDto })
  @ApiResponse({ status: 201, description: "Bid successfully placed" })
  @ApiResponse({ status: 400, description: "Bad Request - Invalid input data" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - User not authenticated",
  })
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
    return this.bidsService.withdrawBid(dto);
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
