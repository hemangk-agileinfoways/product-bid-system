import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Delete,
} from "@nestjs/common";
import { ResponseMessage } from "../../common/decorators/response.decorator";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { SUCCESS_RESPONSES } from "../../common/helpers/responses/success.helper";
import { Public } from "src/security/auth/auth.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { Express } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiProduces,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("Products")
@ApiBearerAuth()
@Public()
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new product",
    description: "Creates a new product with image upload capability",
  })
  @ApiConsumes("multipart/form-data")
  @ApiProduces("application/json")
  @ApiResponse({ status: 201, description: "Product successfully created" })
  @ApiResponse({ status: 400, description: "Bad Request - Invalid input data" })
  @ResponseMessage(`Product ${SUCCESS_RESPONSES.CREATED.MESSAGE}`)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "./uploads", // folder where images will be stored
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    })
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File
  ) {
    const product = await this.productsService.create({
      ...createProductDto,
      image: file.filename,
    });

    return product;
  }

  @Get()
  @ApiOperation({
    summary: "Get all products",
    description: "Retrieves a list of all available products",
  })
  @ApiResponse({
    status: 200,
    description: "List of products successfully retrieved",
  })
  @ResponseMessage(`Products ${SUCCESS_RESPONSES.RETRIEVED.MESSAGE}`)
  async findAll() {
    const products = await this.productsService.findAll();
    return products;
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a product by ID",
    description: "Retrieves a specific product by its ID",
  })
  @ApiResponse({ status: 200, description: "Product successfully retrieved" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ResponseMessage(`Product ${SUCCESS_RESPONSES.RETRIEVED.MESSAGE}`)
  async findOne(@Param("id") id: string) {
    const product = await this.productsService.findOne(id);
    return product;
  }

  @Patch(":id")
  @ResponseMessage(`Products ${SUCCESS_RESPONSES.UPDATED.MESSAGE}`)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    })
  )
  async update(
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const product = await this.productsService.update(id, {
      ...updateProductDto,
      ...(file && { image: file.filename }),
    });
    return product;
  }

  @Delete(":id")
  @ResponseMessage(`Product ${SUCCESS_RESPONSES.DELETED.MESSAGE}`)
  async remove(@Param("id") id: string) {
    return await this.productsService.remove(id);
  }
}
