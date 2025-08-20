import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { Slot } from './entity/slot.entity';
import { CreateSlotsDto, CreateSlotItemDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { TypeExceptions } from '../common/helpers/exceptions';
import { LoggerService } from '../common/logger/logger.service';
import { SLOT_ERROR_MESSAGES, SLOT_SUCCESS_MESSAGES } from './constants/messages.constant';
import { ProductStatus } from 'src/modules/products/constants/enum.constant';
import { PRODUCT_ERROR_MESSAGES } from 'src/modules/products/constants/error.constant';
import { RESPONSE_MESSAGES } from 'src/common/constants/response.constant';
import { ProductsService } from 'src/modules/products/products.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private readonly slotRepository: MongoRepository<Slot>,
    private readonly productsService: ProductsService,
    private myLogger: LoggerService,
  ) {
    this.myLogger.setContext(SlotsService.name);
  }

  async createSlots(productId: string, createSlotsDto: CreateSlotsDto): Promise<{ message: string; slots: Slot[] }> {
    try {

      const product = await this.productsService.findOne(productId);
      if (!product) {
        throw TypeExceptions.NotFound(PRODUCT_ERROR_MESSAGES.NOT_FOUND);
      }

      if (product.status === ProductStatus.BID_STARTED) {
        throw TypeExceptions.InvalidOperation(PRODUCT_ERROR_MESSAGES.BID_STARTED);
      }

      if(product.status === ProductStatus.SOLD) {
        throw TypeExceptions.InvalidOperation(PRODUCT_ERROR_MESSAGES.ALREADY_SOLD);
      }

      console.log("🚀 ~ SlotsService ~ createSlots ~ productId", productId)

      // Calculate existing slots total if any
      const existingSlots = await this.slotRepository.find({ where: { productId: new ObjectId(productId) } });
      const existingTotal = existingSlots.reduce((sum, slot) => sum + (slot.slotCount * slot.bidPrice), 0);
      
      console.log("🚀 ~ SlotsService ~ createSlots ~ existingSlots:", existingSlots)
      console.log("🚀 ~ SlotsService ~ createSlots ~ existingTotal:", existingTotal)

      // Calculate new slots total
      const newTotal = createSlotsDto.slots.reduce((sum, slot) => sum + (slot.slotCount * slot.bidPrice), 0);
      console.log("🚀 ~ SlotsService ~ createSlots ~ newTotal:", newTotal)

      // Validate total amount
      const finalTotal = existingTotal + newTotal;
      console.log("🚀 ~ SlotsService ~ createSlots ~ finalTotal:", finalTotal)
      if (finalTotal > product.amount) {
        throw TypeExceptions.InvalidOperation(SLOT_ERROR_MESSAGES.AMOUNT_MISMATCH);
      }

      console.log("🚀 ~ SlotsService ~ createSlots ~ productId:11111", productId)

      // Process slots
      const createdSlots: Slot[] = [];
      for (const slotDto of createSlotsDto.slots) {
        const slot = await this.processSlot(productId, slotDto, existingSlots);
        console.log("🚀 ~ SlotsService ~ createSlots ~ slot:", slot)
        if (slot) {
          createdSlots.push(slot);
        }
      }

      // Update product status if total matches
      if (finalTotal === product.amount) {
        await this.productsService.updateStatus(product._id.toString(), ProductStatus.READY_FOR_BID, true);
        return { message: SLOT_SUCCESS_MESSAGES.PRODUCT_READY, slots: createdSlots };
      }

      if(!product.hasSlots) {
        await this.productsService.update(product._id.toString(), { hasSlots: true });
      }

      return { message: SLOT_SUCCESS_MESSAGES.CREATED, slots: createdSlots };
    } catch (error) {
      this.myLogger.error(`Failed to create slots for product ${productId}`, error.stack);
      if (error.response?.statusCode) {
        throw error;
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  private async processSlot(productId: string, slotDto: CreateSlotItemDto, existingSlots: Slot[]): Promise<Slot> {
    console.log("🚀 ~ SlotsService ~ processSlot ~ productId:", productId)
    // Check if slot with same bid price exists
    const existingSlot = existingSlots.find(slot => slot.bidPrice === slotDto.bidPrice);
    console.log("🚀 ~ SlotsService ~ processSlot ~ existingSlot:", existingSlot)

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
    
     console.log("🚀 ~ SlotsService ~ processSlot ~ newSlot:", newSlot);

     return this.slotRepository.save(newSlot);
  }

  async getProductSlots(productId: string): Promise<Slot[]> {
    try {
      return await this.slotRepository.find({
        where: { productId: new ObjectId(productId) },
        order: { bidPrice: 'ASC' }
      });
    } catch (error) {
      this.myLogger.error(`Failed to fetch slots for product ${productId}`, error.stack);
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async updateSlot(productId: string, slotId: string, updateSlotDto: UpdateSlotDto): Promise<Slot> {
    try {
      // Get product and validate its existence and status
      const product = await this.productsService.findOne(productId);
      if (!product) {
        throw TypeExceptions.NotFound(PRODUCT_ERROR_MESSAGES.NOT_FOUND);
      }

      if (product.status === ProductStatus.BID_STARTED) {
        throw TypeExceptions.InvalidOperation(PRODUCT_ERROR_MESSAGES.BID_STARTED);
      }

      if(product.status === ProductStatus.SOLD) {
        throw TypeExceptions.InvalidOperation(PRODUCT_ERROR_MESSAGES.ALREADY_SOLD);
      }

      // Get the slot and validate
      const slot = await this.slotRepository.findOne({ where: { _id: new ObjectId(slotId) } });
      if (!slot) {
        throw TypeExceptions.NotFound(SLOT_ERROR_MESSAGES.NOT_FOUND);
      }

      // Calculate new total amount after update
      const allSlots = await this.getProductSlots(productId);
      const currentTotal = allSlots.reduce((sum, s) => {
        if (s._id.toString() === slotId) {
          return sum + (updateSlotDto.slotCount * (updateSlotDto.bidPrice || s.bidPrice));
        }
        return sum + (s.slotCount * s.bidPrice);
      }, 0);

      if (currentTotal > product.amount) {
        throw TypeExceptions.InvalidOperation(SLOT_ERROR_MESSAGES.AMOUNT_MISMATCH);
      }

      // Update slot
      const updatedSlot = await this.slotRepository.save({
        ...slot,
        bidPrice: updateSlotDto.bidPrice || slot.bidPrice,
        slotCount: updateSlotDto.slotCount
      });

      // Update product status based on total
      if (currentTotal === product.amount) {
        await this.productsService.updateStatus(product._id.toString(), ProductStatus.READY_FOR_BID, true);

      } else if (currentTotal < product.amount && product.status === ProductStatus.READY_FOR_BID) {
        await this.productsService.updateStatus(product._id.toString(), ProductStatus.READY_FOR_SLOT, !!currentTotal);
      }

      return updatedSlot;
    } catch (error) {
      this.myLogger.error(`Failed to update slot ${slotId} for product ${productId}`, error.stack);
      if (error.response?.statusCode) {
        throw error;
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async deleteSlot(productId: string, slotId: string): Promise<void> {
    try {
      // Get product and validate its existence and status
      const product = await this.productsService.findOne(productId);
      if (!product) {
        throw TypeExceptions.NotFound(PRODUCT_ERROR_MESSAGES.NOT_FOUND);
      }

      if (product.status === ProductStatus.BID_STARTED) {
        throw TypeExceptions.InvalidOperation(PRODUCT_ERROR_MESSAGES.BID_STARTED);
      }

      if(product.status === ProductStatus.SOLD) {
        throw TypeExceptions.InvalidOperation(PRODUCT_ERROR_MESSAGES.ALREADY_SOLD);
      }

      // Get the slot and validate
      const slot = await this.slotRepository.findOne({ where: { _id: new ObjectId(slotId) } });
      if (!slot) {
        throw TypeExceptions.NotFound(SLOT_ERROR_MESSAGES.NOT_FOUND);
      }

      // Delete the slot
      await this.slotRepository.delete(slotId);

      // Update product status as total will be less than product amount
      if (product.status === ProductStatus.READY_FOR_BID) {
        await this.productsService.updateStatus(product._id.toString(), ProductStatus.READY_FOR_SLOT);
      }
    } catch (error) {
      this.myLogger.error(`Failed to delete slot ${slotId} for product ${productId}`, error.stack);
      if (error.response?.statusCode) {
        throw error;
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }
}