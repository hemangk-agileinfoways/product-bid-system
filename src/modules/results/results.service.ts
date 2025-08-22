import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MongoRepository } from "typeorm";
import { MongoError } from "mongodb";
import { Result } from "./entity/result.entity";
import { Bid, BidStatus } from "../bids/entity/bid.entity";
import { DeclareResultDto } from "./dto/declare-result.dto";
import { ProductsService } from "../products/products.service";
import { ProductStatus } from "../products/constants/enum.constant";
import { TypeExceptions } from "../../common/helpers/exceptions";
import { LoggerService } from "../../common/logger/logger.service";
import { RESPONSE_MESSAGES } from "../../common/constants/response.constant";
import { RESULT_ERROR_MESSAGES } from "./constants/messages.constant";

interface WeightedUser {
  userId: string;
  bidId: string;
  baseTickets: number;
  newbieBoost: number;
  performanceBonus: number;
  decayPenalty: number;
  finalWeight: number;
  cumulativeWeight: number;
}

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Result)
    private readonly resultRepository: MongoRepository<Result>,
    @InjectRepository(Bid)
    private readonly bidRepository: MongoRepository<Bid>,
    private readonly productsService: ProductsService,
    private myLogger: LoggerService
  ) {
    this.myLogger.setContext(ResultsService.name);
  }

  async declareResult(dto: DeclareResultDto): Promise<Result> {
    try {
      // Check if result already exists
      const existingResult = await this.resultRepository.findOne({
        where: { productId: dto.productId },
      });

      if (existingResult) {
        throw TypeExceptions.InvalidOperation(
          RESULT_ERROR_MESSAGES.ALREADY_DECLARED
        );
      }

      // Validate product and its status
      const product = await this.productsService.findOne(dto.productId);
      if (!product) {
        throw TypeExceptions.NotFound(RESULT_ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      if (product.status !== ProductStatus.BID_ENDED) {
        throw TypeExceptions.InvalidOperation(
          RESULT_ERROR_MESSAGES.INVALID_PRODUCT_STATUS
        );
      }

      // Get all active bids for this product
      const activeBids = await this.bidRepository.find({
        where: {
          prodId: dto.productId,
          status: BidStatus.ACTIVE,
        },
      });

      if (activeBids.length === 0) {
        throw TypeExceptions.NotFound(RESULT_ERROR_MESSAGES.NO_BIDS);
      }

      // Calculate weights for each user's bids
      const weightedUsers = await this.calculateWeights(activeBids);

      // Select winner using weighted random selection
      const winner = this.selectWinner(weightedUsers);

      // Create result record
      const result = this.resultRepository.create({
        productId: dto.productId,
        winnerId: winner.userId,
        winningBidId: winner.bidId,
        weightCalculation: this.createWeightCalculationMap(weightedUsers),
        totalTickets: weightedUsers.reduce((sum, u) => sum + u.finalWeight, 0),
      });

      await this.resultRepository.save(result);

      // Update product status to SOLD
      await this.productsService.updateStatus(
        dto.productId,
        ProductStatus.SOLD
      );

      this.myLogger.log(
        `Result declared for product ${dto.productId}. Winner: ${winner.userId}`
      );

      return result;
    } catch (error) {
      this.myLogger.error(
        `Failed to declare result for product ${dto.productId}`,
        error.stack
      );
      if (error instanceof MongoError) {
        throw TypeExceptions.InvalidOperation(error.message);
      }
      if (error.response?.statusCode) {
        throw error;
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async getResult(productId: string): Promise<Result> {
    try {
      const result = await this.resultRepository.findOne({
        where: { productId },
      });

      if (!result) {
        throw TypeExceptions.NotFound(RESULT_ERROR_MESSAGES.NOT_FOUND);
      }

      return result;
    } catch (error) {
      this.myLogger.error(
        `Failed to get result for product ${productId}`,
        error.stack
      );
      if (error.response?.statusCode) {
        throw error;
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  private async calculateWeights(bids: Bid[]): Promise<WeightedUser[]> {
    const userBidsMap = new Map<string, Bid[]>();

    // Group bids by user
    bids.forEach((bid) => {
      if (!userBidsMap.has(bid.userId)) {
        userBidsMap.set(bid.userId, []);
      }
      userBidsMap.get(bid.userId).push(bid);
    });

    const weightedUsers: WeightedUser[] = [];
    let cumulativeWeight = 0;

    // Calculate weights for each user
    for (const [userId, userBids] of userBidsMap.entries()) {
      const baseTickets = userBids.reduce(
        (sum, bid) =>
          sum + bid.slots.reduce((slotSum, slot) => slotSum + slot.count, 0),
        0
      );

      // Calculate newbie boost
      const userBidHistory = await this.bidRepository.count({
        where: { userId },
      });
      const newbieBoost = userBidHistory < 2 ? 1 : 0;

      // Calculate performance bonus (5% of total bid amount)
      const totalBidAmount = userBids.reduce(
        (sum, bid) => sum + bid.totalAmount,
        0
      );
      const performanceBonus = Math.floor(totalBidAmount * 0.05);

      // Calculate decay penalty for previous winners
      const previousWins = await this.resultRepository.count({
        where: { winnerId: userId },
      });
      const decayPenalty = Math.floor(
        (baseTickets + performanceBonus) * (previousWins * 0.1)
      );

      // Calculate final weight
      const finalWeight =
        baseTickets + newbieBoost + performanceBonus - decayPenalty;

      cumulativeWeight += finalWeight;

      weightedUsers.push({
        userId,
        bidId: userBids[0]._id.toString(), // Use the first bid's ID
        baseTickets,
        newbieBoost,
        performanceBonus,
        decayPenalty,
        finalWeight,
        cumulativeWeight,
      });
    }

    return weightedUsers;
  }

  private selectWinner(weightedUsers: WeightedUser[]): WeightedUser {
    const totalWeight =
      weightedUsers[weightedUsers.length - 1].cumulativeWeight;
    const randomNum = Math.random() * totalWeight;

    // Binary search for the winner
    return weightedUsers.find((user) => user.cumulativeWeight > randomNum);
  }

  private createWeightCalculationMap(
    weightedUsers: WeightedUser[]
  ): Record<string, any> {
    const calcMap = {};
    weightedUsers.forEach((user) => {
      calcMap[user.userId] = {
        baseTickets: user.baseTickets,
        newbieBoost: user.newbieBoost,
        performanceBonus: user.performanceBonus,
        decayPenalty: user.decayPenalty,
        finalWeight: user.finalWeight,
      };
    });
    return calcMap;
  }
}
