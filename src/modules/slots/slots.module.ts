import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SlotsService } from "./slots.service";
import { SlotsController } from "./slots.controller";
import { Slot } from "./entity/slot.entity";
import { Product } from "../products/entity/product.entity";
import { LoggerModule } from "../../common/logger/logger.module";
import { ProductsService } from "src/modules/products/products.service";

@Module({
  imports: [TypeOrmModule.forFeature([Slot, Product]), LoggerModule],
  controllers: [SlotsController],
  providers: [SlotsService, ProductsService],
  exports: [SlotsService],
})
export class SlotsModule {}
