import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BidsController } from "./bids.controller";
import { BidsService } from "./bids.service";
import { Bid } from "./entity/bid.entity";
import { LoggerModule } from "../../common/logger/logger.module";
import { ProductsService } from "../products/products.service";
import { Product } from "../products/entity/product.entity";
import { SlotsService } from "../slots/slots.service";
import { Slot } from "../slots/entity/slot.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Bid, Product, Slot]), LoggerModule],
  controllers: [BidsController],
  providers: [BidsService, ProductsService, SlotsService],
  exports: [BidsService],
})
export class BidsModule {}
