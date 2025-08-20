import { Controller, Post, Body, Param, Get, Put, Delete } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { CreateSlotsDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { Public } from 'src/security/auth/auth.decorator';
import { ResponseMessage } from '../common/decorators/response.decorator';
import { SUCCESS_RESPONSES } from '../common/helpers/responses/success.helper';

@Public()
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Post(':productId')
  @ResponseMessage(`Slots ${SUCCESS_RESPONSES.CREATED.MESSAGE}`)
  async createSlots(
    @Param('productId') productId: string,
    @Body() createSlotsDto: CreateSlotsDto,
  ) {
    const result = await this.slotsService.createSlots(productId, createSlotsDto);
    return result.slots;
  }

  @Get(':productId')
  @ResponseMessage(`Slots ${SUCCESS_RESPONSES.RETRIEVED.MESSAGE}`)
  async getProductSlots(@Param('productId') productId: string) {
    return await this.slotsService.getProductSlots(productId);
  }

  @Put(':productId/slot/:slotId')
  @ResponseMessage(`Slot ${SUCCESS_RESPONSES.UPDATED.MESSAGE}`)
  async updateSlot(
    @Param('productId') productId: string,
    @Param('slotId') slotId: string,
    @Body() updateSlotDto: UpdateSlotDto
  ) {
    return await this.slotsService.updateSlot(productId, slotId, updateSlotDto);
  }

  @Delete(':productId/slot/:slotId')
  @ResponseMessage(`Slot ${SUCCESS_RESPONSES.DELETED.MESSAGE}`)
  async deleteSlot(
    @Param('productId') productId: string,
    @Param('slotId') slotId: string
  ) {
    return await this.slotsService.deleteSlot(productId, slotId);
  }
}
