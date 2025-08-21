import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MongoRepository } from "typeorm";
import { Slot } from "./entity/slot.entity";
import { CreateSlotsDto, CreateSlotItemDto } from "./dto/create-slot.dto";
import { UpdateSlotsDto } from "./dto/update-slot.dto";
import { TypeExceptions } from "../../common/helpers/exceptions";
import { LoggerService } from "../../common/logger/logger.service";
import {
  SLOT_ERROR_MESSAGES,
  SLOT_SUCCESS_MESSAGES,
} from "./constants/messages.constant";
import { ProductStatus } from "src/modules/products/constants/enum.constant";
import { PRODUCT_ERROR_MESSAGES } from "src/modules/products/constants/error.constant";
import { RESPONSE_MESSAGES } from "src/common/constants/response.constant";
import { ProductsService } from "src/modules/products/products.service";
import { ObjectId } from "mongodb";
import { DeleteSlotsDto } from "./dto/delete-slot.dto";

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: MongoRepository<Slot>,
    private readonly productsService: ProductsService,
    private myLogger: LoggerService
  ) {
    this.myLogger.setContext(SlotsService.name);
  }

  async createSlots(
    productId: string,
    createSlotsDto: CreateSlotsDto
  ): Promise<{ message: string; slots: Slot[] }> {
    try {
      const product = await this.productsService.findOne(productId);
      if (!product) {
        throw TypeExceptions.NotFound(PRODUCT_ERROR_MESSAGES.NOT_FOUND);
      }

      if (product.status === ProductStatus.BID_STARTED) {
        throw TypeExceptions.InvalidOperation(
          PRODUCT_ERROR_MESSAGES.BID_STARTED
        );
      }

      if (product.status === ProductStatus.SOLD) {
        throw TypeExceptions.InvalidOperation(
          PRODUCT_ERROR_MESSAGES.ALREADY_SOLD
        );
      }

      // Calculate existing slots total if any
      const existingSlots = await this.slotRepository.find({
        where: { productId: new ObjectId(productId) },
      });
      const existingTotal = existingSlots.reduce(
        (sum, slot) => sum + slot.slotCount * slot.bidPrice,
        0
      );

      // Calculate new slots total
      const newTotal = createSlotsDto.slots.reduce(
        (sum, slot) => sum + slot.slotCount * slot.bidPrice,
        0
      );

      // Validate total amount
      const finalTotal = existingTotal + newTotal;
      if (finalTotal > product.amount) {
        throw TypeExceptions.InvalidOperation(
          SLOT_ERROR_MESSAGES.AMOUNT_MISMATCH
        );
      }

      // Process slots
      const createdSlots: Slot[] = [];
      for (const slotDto of createSlotsDto.slots) {
        const slot = await this.processSlot(productId, slotDto, existingSlots);
        if (slot) {
          createdSlots.push(slot);
        }
      }

      // Update product status if total matches
      if (finalTotal === product.amount) {
        await this.productsService.updateStatus(
          product._id.toString(),
          ProductStatus.READY_FOR_BID,
          true
        );
        return {
          message: SLOT_SUCCESS_MESSAGES.PRODUCT_READY,
          slots: createdSlots,
        };
      }

      if (!product.hasSlots) {
        await this.productsService.update(product._id.toString(), {
          hasSlots: true,
        });
      }

      return { message: SLOT_SUCCESS_MESSAGES.CREATED, slots: createdSlots };
    } catch (error) {
      this.myLogger.error(
        `Failed to create slots for product ${productId}`,
        error.stack
      );
      if (error.response?.statusCode) {
        throw error;
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  private async processSlot(
    productId: string,
    slotDto: CreateSlotItemDto,
    existingSlots: Slot[]
  ): Promise<Slot> {
    // Check if slot with same bid price exists
    const existingSlot = existingSlots.find(
      (slot) => slot.bidPrice === slotDto.bidPrice
    );

    if (existingSlot) {
      // Merge with existing slot
      existingSlot.slotCount += slotDto.slotCount;
      return this.slotRepository.save(existingSlot);
    }

    // Create new slot
    const newSlot = new Slot();
    newSlot.productId = new ObjectId(productId);
    newSlot.bidPrice = slotDto.bidPrice;
    newSlot.slotCount = slotDto.slotCount;

    return this.slotRepository.save(newSlot);
  }

  async getProductSlots(productId: string): Promise<Slot[]> {
    try {
      return await this.slotRepository.find({
        where: { productId: new ObjectId(productId) },
        order: { bidPrice: "ASC" },
      });
    } catch (error) {
      this.myLogger.error(
        `Failed to fetch slots for product ${productId}`,
        error.stack
      );
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async updateSlot(
    productId: string,
    updateSlotsDto: UpdateSlotsDto
  ): Promise<Slot[]> {
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw TypeExceptions.NotFound(PRODUCT_ERROR_MESSAGES.NOT_FOUND);
    }

    if (product.status === ProductStatus.BID_STARTED) {
      throw TypeExceptions.InvalidOperation(PRODUCT_ERROR_MESSAGES.BID_STARTED);
    }

    if (product.status === ProductStatus.SOLD) {
      throw TypeExceptions.InvalidOperation(
        PRODUCT_ERROR_MESSAGES.ALREADY_SOLD
      );
    }

    const allSlots = await this.getProductSlots(productId);

    // Step 1: merge updates into a temporary array
    const mergedSlots = allSlots.map((slot) => {
      const dto = updateSlotsDto.slots.find(
        (s) => s.slotId === slot._id.toString()
      );

      if (!dto) return slot; // untouched slot

      if (dto.slotCount === undefined && dto.bidPrice === undefined) {
        throw TypeExceptions.InvalidOperation(
          SLOT_ERROR_MESSAGES.NO_UPDATE_FIELDS
        );
      }

      return {
        ...slot,
        slotCount: dto.slotCount ?? slot.slotCount,
        bidPrice: dto.bidPrice ?? slot.bidPrice,
      };
    });

    // Step 2: calculate total once
    const currentTotal = mergedSlots.reduce(
      (sum, s) => sum + s.slotCount * s.bidPrice,
      0
    );

    if (currentTotal > product.amount) {
      throw TypeExceptions.InvalidOperation(
        SLOT_ERROR_MESSAGES.AMOUNT_MISMATCH
      );
    }

    // Step 3: persist updates only for touched slots
    const updatedSlots: Slot[] = [];
    for (const dto of updateSlotsDto.slots) {
      const slot = allSlots.find((s) => s._id.toString() === dto.slotId);
      if (!slot) {
        throw TypeExceptions.NotFound(SLOT_ERROR_MESSAGES.NOT_FOUND);
      }

      const updatedSlot = await this.slotRepository.save({
        ...slot,
        slotCount: dto.slotCount ?? slot.slotCount,
        bidPrice: dto.bidPrice ?? slot.bidPrice,
      });
      updatedSlots.push(updatedSlot);
    }

    // Step 4: update product status if needed
    if (
      currentTotal === product.amount &&
      product.status !== ProductStatus.READY_FOR_BID
    ) {
      await this.productsService.updateStatus(
        product._id.toString(),
        ProductStatus.READY_FOR_BID,
        true
      );
    } else if (
      currentTotal < product.amount &&
      product.status === ProductStatus.READY_FOR_BID
    ) {
      await this.productsService.updateStatus(
        product._id.toString(),
        ProductStatus.READY_FOR_SLOT,
        !!currentTotal
      );
    }

    return updatedSlots;
  }

  async deleteSlots(
    productId: string,
    deleteSlotsDto: DeleteSlotsDto
  ): Promise<void> {
    try {
      // Get product and validate its existence and status
      const product = await this.productsService.findOne(productId);
      if (!product)
        throw TypeExceptions.NotFound(PRODUCT_ERROR_MESSAGES.NOT_FOUND);

      if (product.status === ProductStatus.BID_STARTED)
        throw TypeExceptions.InvalidOperation(
          PRODUCT_ERROR_MESSAGES.BID_STARTED
        );

      if (product.status === ProductStatus.SOLD)
        throw TypeExceptions.InvalidOperation(
          PRODUCT_ERROR_MESSAGES.ALREADY_SOLD
        );

      // Bulk delete
      await this.slotRepository.deleteMany({
        _id: { $in: deleteSlotsDto.ids.map((id) => new ObjectId(id)) },
      });

      // Update product status after deletion
      const finalTotal = (await this.getProductSlots(productId)).reduce(
        (sum, s) => sum + s.slotCount * s.bidPrice,
        0
      );

      if (
        finalTotal < product.amount &&
        product.status === ProductStatus.READY_FOR_BID
      ) {
        await this.productsService.updateStatus(
          product._id.toString(),
          ProductStatus.READY_FOR_SLOT,
          !!finalTotal
        );
      }
    } catch (error) {
      this.myLogger.error(
        `Failed to bulk delete slots for product ${productId}`,
        error.stack
      );
      if (error.response?.statusCode) throw error;
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }
}
