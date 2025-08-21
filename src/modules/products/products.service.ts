import { HttpException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MongoError } from "typeorm";
import { Product } from "./entity/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductStatus } from "./constants/enum.constant";
import { TypeExceptions } from "../../common/helpers/exceptions";
import { LoggerService } from "../../common/logger/logger.service";
import { PRODUCT_ERROR_MESSAGES } from "./constants/error.constant";
import { ObjectId } from "mongodb";
import { RESPONSE_MESSAGES } from "src/common/constants/response.constant";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private myLogger: LoggerService
  ) {
    this.myLogger.setContext(ProductsService.name);
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const product = this.productRepository.create({
        ...createProductDto,
      });

      return await this.productRepository.save(product);
    } catch (error) {
      this.myLogger.error("Failed to create product", error.stack);
      if (error instanceof MongoError) {
        throw TypeExceptions.InvalidOperation(error.message);
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.productRepository.find();
    } catch (error) {
      this.myLogger.error("Failed to fetch products", error.stack);
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async findOne(id: string): Promise<Product> {
    try {
      if (!ObjectId.isValid(id)) {
        throw TypeExceptions.InvalidOperation(
          PRODUCT_ERROR_MESSAGES.INVALID_ID
        );
      }

      const product = await this.productRepository.findOne({
        where: { _id: new ObjectId(id) },
      });
      if (!product) {
        throw TypeExceptions.NotFound(PRODUCT_ERROR_MESSAGES.NOT_FOUND);
      }
      return product;
    } catch (error) {
      this.myLogger.error(`Failed to fetch product with id ${id}`, error.stack);
      if (error.name === "ObjectIdError") {
        throw TypeExceptions.InvalidOperation(
          PRODUCT_ERROR_MESSAGES.INVALID_ID
        );
      }
      if (error.response?.statusCode === 404) {
        throw error; // Re-throw Not Found exception
      }
      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto
  ): Promise<Product> {
    try {
      const product = await this.findOne(id);

      // Check if product can be edited based on status
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

      // Check if amount can be updated
      if (product.hasSlots && updateProductDto.amount) {
        throw TypeExceptions.InvalidOperation(
          PRODUCT_ERROR_MESSAGES.AMOUNT_LOCKED
        );
      }

      const updatedProduct = await this.productRepository.save({
        ...product,
        ...updateProductDto,
      });

      return updatedProduct;
    } catch (error) {
      this.myLogger.error(
        `Failed to update product with id ${id}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const product = await this.findOne(id);

      // Check if product can be deleted based on status
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

      await this.productRepository.remove(product);
    } catch (error) {
      this.myLogger.error(
        `Failed to delete product with id ${id}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  async updateStatus(
    id: string,
    newStatus: ProductStatus,
    hasSlot?: boolean
  ): Promise<Product> {
    try {
      const product = await this.findOne(id);

      // Prevent editing if already sold
      if (product.status === ProductStatus.SOLD) {
        throw TypeExceptions.InvalidOperation(
          PRODUCT_ERROR_MESSAGES.ALREADY_SOLD
        );
      }

      // Validate transition
      await this.validateStatusTransition(product.status, newStatus);

      product.hasSlots = hasSlot ?? product.hasSlots;

      // Apply the update
      product.status = newStatus;
      return await this.productRepository.save(product);
    } catch (error) {
      this.myLogger.error(
        `Failed to update status for product ${id}`,
        error.stack
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw TypeExceptions.UnknownError(RESPONSE_MESSAGES.DATABASE_ERROR);
    }
  }

  private async validateStatusTransition(
    currentStatus: ProductStatus,
    newStatus: ProductStatus
  ): Promise<void> {
    const validTransitions = {
      [ProductStatus.READY_FOR_SLOT]: [ProductStatus.READY_FOR_BID],
      [ProductStatus.READY_FOR_BID]: [
        ProductStatus.BID_STARTED,
        ProductStatus.READY_FOR_SLOT,
      ], // <-- rollback allowed
      [ProductStatus.BID_STARTED]: [
        ProductStatus.BID_ENDED,
        ProductStatus.READY_FOR_BID,
      ],
      [ProductStatus.BID_ENDED]: [ProductStatus.SOLD],
      [ProductStatus.SOLD]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw TypeExceptions.InvalidOperation(
        PRODUCT_ERROR_MESSAGES.INVALID_STATUS_TRANSITION(
          currentStatus,
          newStatus
        )
      );
    }
  }
}
