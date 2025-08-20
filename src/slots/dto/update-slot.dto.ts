import { PartialType } from '@nestjs/mapped-types';
import { CreateSlotItemDto } from './create-slot.dto';

export class UpdateSlotDto extends PartialType(CreateSlotItemDto) {
}
