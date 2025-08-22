import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MongoRepository } from "typeorm";
import { MongoError, ObjectId } from "mongodb";
import { Bid, BidStatus } from "./entity/bid.entity";
import { PlaceBidDto } from "./dto/place-bid.dto";
import { WithdrawBidDto } from "./dto/withdraw-bid.dto";
import { Slot } from "../slots/entity/slot.entity";
import { TypeExceptions } from "../../common/helpers/exceptions";
import { LoggerService } from "../../common/logger/logger.service";
import { RESPONSE_MESSAGES } from "../../common/constants/response.constant";
import { BID_ERROR_MESSAGES } from "./constants/error.constant";
import { ProductsService } from "../products/products.service";
import { ProductStatus } from "../products/constants/enum.constant";
import { SlotsService } from "../slots/slots.service";
import { JwtPayload } from "src/common/interfaces/jwt.interface";
import { PRODUCT_ERROR_MESSAGES } from "../products/constants/error.constant";

interface SlotAvailability {
  slotId: string;
  bidPrice: number;
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
}

interface LeaderboardEntry {
  userId: string;
  totalAmount: number;
  totalSlots: number;
  averageBidPrice: number;
  bidCount: number;
  createdAt: Date;
}

@Injectable()
export class BidsService {
  constructor(
    @InjectRepository(Bid)
    private readonly bidRepository: MongoRepository<Bid>,
    private readonly productsService: ProductsService,
    private readonly slotsService: SlotsService,
    private myLogger: LoggerService
  ) {
    this.myLogger.setContext(BidsService.name);
  }

  async placeBid(dto: PlaceBidDto, user: JwtPayload): Promise<Bid> {
    try {
      let bid: Bid;

      if (!user.id) {
        throw TypeExceptions.InvalidOperation(
          BID_ERROR_MESSAGES.USER_NOT_AUTHORIZED
        );
      }

      // Validate product
      const product = await this.productsService.findOne(dto.prodId);
      if (!product) {
        throw TypeExceptions.NotFound(BID_ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      if (product.status === ProductStatus.BID_ENDED) {
        throw TypeExceptions.InvalidOperation(PRODUCT_ERROR_MESSAGES.BID_ENDED);
      }

      if (
        product.status !== ProductStatus.READY_FOR_BID &&
        product.status !== ProductStatus.BID_STARTED
      ) {
        throw TypeExceptions.InvalidOperation(
          BID_ERROR_MESSAGES.PRODUCT_NOT_READY
        );
      }

      // Get all slots for this product
      const productSlots = await this.slotsService.getProductSlots(dto.prodId);

      if (productSlots.length === 0) {
        throw TypeExceptions.NotFound(BID_ERROR_MESSAGES.NO_SLOTS_CONFIGURED);
      }

      // Get current slot availability
      const slotAvailabilityMap = await this.getSlotAvailability(
        dto.prodId,
        productSlots
      );

      // Validate each slot bid request
      for (const slotBid of dto.slots) {
        const slotAvailability = slotAvailabilityMap.get(slotBid.slotId);

        if (!slotAvailability) {
          throw TypeExceptions.NotFound(
            BID_ERROR_MESSAGES.SLOT_NOT_FOUND(slotBid.slotId)
          );
        }

        if (slotBid.count > slotAvailability.availableSlots) {
          throw TypeExceptions.InvalidOperation(
            BID_ERROR_MESSAGES.INSUFFICIENT_SLOT_AVAILABILITY(
              slotBid.slotId,
              slotAvailability.bidPrice,
              slotAvailability.availableSlots,
              slotBid.count
            )
          );
        }

        // Validate bid price matches slot's bid price
        if (slotBid.bidPrice !== slotAvailability.bidPrice) {
          throw TypeExceptions.InvalidOperation(
            BID_ERROR_MESSAGES.INVALID_BID_PRICE(
              slotBid.bidPrice,
              slotBid.slotId,
              slotAvailability.bidPrice
            )
          );
        }
      }

      // Check for existing active bid from same user
      const existingBid = await this.bidRepository.findOne({
        where: {
          prodId: dto.prodId,
          userId: user.id.toString(),
          status: BidStatus.ACTIVE,
        },
      });

      if (existingBid) {
        for (const slot of dto.slots) {
          const slotId = new ObjectId(slot.slotId);

          // check if slot already exists in user's bid
          const existingSlot = existingBid.slots.find(
            (s) => s.slotId.toString() === slotId.toString()
          );

          if (existingSlot) {
            // increment count if slot already exists
            existingSlot.count += slot.count;
          } else {
            // otherwise, add new slot
            existingBid.slots.push({
              ...slot,
              slotId: slot.slotId,
            });
          }

          // always update total amount
          existingBid.totalAmount += slot.count * slot.bidPrice;
        }

        await this.bidRepository.updateOne(
          { _id: existingBid._id },
          {
            $set: {
              slots: existingBid.slots,
              totalAmount: existingBid.totalAmount,
            },
          }
        );
      } else {
        // Calculate total amount
        const totalAmount = dto.slots.reduce(
          (sum, slot) => sum + slot.count * slot.bidPrice,
          0
        );

        // Create new bid
        bid = this.bidRepository.create({
          userId: user.id.toString(),
          prodId: dto.prodId,
          slots: dto.slots,
          totalAmount,
          status: BidStatus.ACTIVE,
          isWithdrawable: true,
        });

        await this.bidRepository.save(bid);
      }

      // Check if all slots are now full and update product status
      const updatedAvailability = await this.getSlotAvailability(
        dto.prodId,
        productSlots
      );
      const allSlotsFull = Array.from(updatedAvailability.values()).every(
        (slot) => slot.availableSlots === 0
      );

      if (allSlotsFull) {
        await this.productsService.updateStatus(
          dto.prodId,
          ProductStatus.BID_ENDED
        );

        // Mark all active bids as non-withdrawable
        await this.bidRepository.updateMany(
          {
            prodId: dto.prodId,
            status: BidStatus.ACTIVE,
          },
          {
            $set: { isWithdrawable: false },
          }
        );
      }

      // Update product hasBids flag
      if (!product.hasBids) {
        await this.productsService.update(dto.prodId, { hasBids: true });
      }

      if (product.status === ProductStatus.READY_FOR_BID) {
        await this.productsService.updateStatus(
          dto.prodId,
          ProductStatus.BID_STARTED
        );
      }

      const totalSlotsBooked = dto.slots.reduce(
        (sum, slot) => sum + slot.count,
        0
      );
      this.myLogger.log(
        `Bid placed successfully for product ${dto.prodId} by user ${user.id}. Slots booked: ${totalSlotsBooked}`
      );

      return existingBid || bid;
      //   });
    } catch (error) {
      this.myLogger.error("Failed to place bid", error.stack);
      if (error instanceof MongoError) {
        throw TypeExceptions.InvalidOperation(error.message);
      }
      if (error.response?.statusCode) {
        throw error;
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async withdrawBid(dto: WithdrawBidDto): Promise<Bid> {
    try {
      const bid = await this.bidRepository.findOne({
        where: {
          _id: new ObjectId(dto.bidId),
          status: BidStatus.ACTIVE,
        },
      });

      if (!bid) {
        throw TypeExceptions.NotFound(BID_ERROR_MESSAGES.NOT_FOUND);
      }

      // Check hybrid withdrawal rule - cannot withdraw if all slots are full
      const productSlots = await this.slotsService.getProductSlots(bid.prodId);

      const slotAvailability = await this.getSlotAvailability(
        bid.prodId,
        productSlots
      );
      const allSlotsFull = Array.from(slotAvailability.values()).every(
        (slot) => slot.availableSlots === 0
      );

      if (allSlotsFull) {
        throw TypeExceptions.InvalidOperation(
          BID_ERROR_MESSAGES.SLOTS_FULL_NO_WITHDRAWAL
        );
      }

      if (!bid.isWithdrawable) {
        throw TypeExceptions.InvalidOperation(
          BID_ERROR_MESSAGES.NOT_WITHDRAWABLE
        );
      }

      // Check withdrawal time constraints based on total amount
      const now = new Date();
      const bidTime = bid.createdAt;
      const hoursSinceBid =
        (now.getTime() - bidTime.getTime()) / (1000 * 60 * 60);

      if (
        (bid.totalAmount < 1000 && hoursSinceBid > 0.5) ||
        (bid.totalAmount >= 1000 && hoursSinceBid > 24)
      ) {
        throw TypeExceptions.InvalidOperation(
          BID_ERROR_MESSAGES.WITHDRAWAL_TIME_EXCEEDED
        );
      }

      bid.status = BidStatus.WITHDRAWN;
      bid.withdrawalTime = now;
      bid.withdrawalReason = dto.reason;

      const updatedBid = await this.bidRepository.findOneAndUpdate(
        { _id: new ObjectId(dto.bidId) },
        { $set: bid },
        { returnDocument: "after" }
      );

      // Check if product status needs to be updated (slots became available)
      const product = await this.productsService.findOne(bid.prodId);
      if (product.status === ProductStatus.BID_ENDED) {
        // Recalculate availability after this withdrawal
        const newAvailability = await this.getSlotAvailability(
          bid.prodId,
          productSlots
        );
        const hasAvailableSlots = Array.from(newAvailability.values()).some(
          (slot) => slot.availableSlots > 0
        );

        if (hasAvailableSlots) {
          await this.productsService.updateStatus(
            bid.prodId,
            ProductStatus.READY_FOR_BID
          );

          // Mark all active bids as withdrawable again
          await this.bidRepository.updateMany(
            {
              prodId: bid.prodId,
              status: BidStatus.ACTIVE,
            },
            {
              $set: { isWithdrawable: true },
            }
          );
        }
      }

      this.myLogger.log(`Bid ${bid._id} withdrawn successfully`);
      return updatedBid as Bid;
      //   });
    } catch (error) {
      this.myLogger.error("Failed to withdraw bid", error.stack);
      if (error instanceof MongoError) {
        throw TypeExceptions.InvalidOperation(error.message);
      }
      if (error.response?.statusCode) {
        throw error;
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async getLeaderboard(productId: string): Promise<LeaderboardEntry[]> {
    try {
      const product = await this.productsService.findOne(productId);
      if (!product) {
        throw TypeExceptions.NotFound(BID_ERROR_MESSAGES.PRODUCT_NOT_FOUND);
      }

      const bids = await this.bidRepository.find({
        where: {
          prodId: productId,
          status: BidStatus.ACTIVE,
        },
      });

      // Group bids by user and calculate leaderboard metrics
      const userBidsMap = new Map<string, Bid[]>();

      bids.forEach((bid) => {
        if (!userBidsMap.has(bid.userId)) {
          userBidsMap.set(bid.userId, []);
        }
        userBidsMap.get(bid.userId).push(bid);
      });

      const leaderboard: LeaderboardEntry[] = [];

      userBidsMap.forEach((userBids, userId) => {
        const totalAmount = userBids.reduce(
          (sum, bid) => sum + bid.totalAmount,
          0
        );
        const totalSlots = userBids.reduce(
          (sum, bid) =>
            sum + bid.slots.reduce((slotSum, slot) => slotSum + slot.count, 0),
          0
        );
        const totalBidValue = userBids.reduce(
          (sum, bid) =>
            sum +
            bid.slots.reduce(
              (slotSum, slot) => slotSum + slot.count * slot.bidPrice,
              0
            ),
          0
        );
        const averageBidPrice = totalSlots > 0 ? totalBidValue / totalSlots : 0;
        const bidCount = userBids.length;
        const earliestBid = userBids.reduce((earliest, bid) =>
          bid.createdAt < earliest.createdAt ? bid : earliest
        );

        leaderboard.push({
          userId,
          totalAmount,
          totalSlots,
          averageBidPrice: Math.round(averageBidPrice * 100) / 100,
          bidCount,
          createdAt: earliestBid.createdAt,
        });
      });

      // Sort by total amount (descending) and then by earliest bid time (ascending)
      return leaderboard
        .sort((a, b) => {
          if (b.totalAmount !== a.totalAmount) {
            return b.totalAmount - a.totalAmount;
          }
          return a.createdAt.getTime() - b.createdAt.getTime();
        })
        .slice(0, 10); // Top 10
    } catch (error) {
      this.myLogger.error(
        `Failed to get leaderboard for product ${productId}`,
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

  async getProductSlotStatus(productId: string): Promise<SlotAvailability[]> {
    try {
      const productSlots = await this.slotsService.getProductSlots(productId);

      if (productSlots.length === 0) {
        return [];
      }

      const slotAvailabilityMap = await this.getSlotAvailability(
        productId,
        productSlots
      );
      return Array.from(slotAvailabilityMap.values());
    } catch (error) {
      this.myLogger.error(
        `Failed to get slot status for product ${productId}`,
        error.stack
      );
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  private async getSlotAvailability(
    productId: string,
    productSlots: Slot[]
  ): Promise<Map<string, SlotAvailability>> {
    // Get all active bids for this product
    const activeBids = await this.bidRepository.find({
      where: {
        prodId: productId,
        status: BidStatus.ACTIVE,
      },
    });

    // Calculate booked slots per slot ID
    const bookedSlotsMap = new Map<string, number>();

    activeBids.forEach((bid) => {
      bid.slots.forEach((slotBid) => {
        const currentCount = bookedSlotsMap.get(slotBid.slotId) || 0;
        bookedSlotsMap.set(slotBid.slotId, currentCount + slotBid.count);
      });
    });

    // Create availability map
    const availabilityMap = new Map<string, SlotAvailability>();

    productSlots.forEach((slot) => {
      const slotId = slot._id.toString();
      const bookedSlots = bookedSlotsMap.get(slotId) || 0;
      const availableSlots = Math.max(0, slot.slotCount - bookedSlots);

      availabilityMap.set(slotId, {
        slotId,
        bidPrice: slot.bidPrice,
        totalSlots: slot.slotCount,
        bookedSlots,
        availableSlots,
      });
    });

    return availabilityMap;
  }
}
