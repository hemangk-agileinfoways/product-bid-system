import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ResultsController } from "./results.controller";
import { ResultsService } from "./results.service";
import { Result } from "./entity/result.entity";
import { Bid } from "../bids/entity/bid.entity";
import { Product } from "../products/entity/product.entity";
import { LoggerModule } from "../../common/logger/logger.module";
import { ProductsService } from "../products/products.service";
import { BidsService } from "../bids/bids.service";
import { SlotsService } from "../slots/slots.service";
import { Slot } from "../slots/entity/slot.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Result, Bid, Product, Slot]),
    LoggerModule,
  ],
  controllers: [ResultsController],
  providers: [ResultsService, ProductsService, BidsService, SlotsService],
  exports: [ResultsService],
})
export class ResultsModule {}
