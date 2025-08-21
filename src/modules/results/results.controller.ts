import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { ResultsService } from "./results.service";
import { DeclareResultDto } from "./dto/declare-result.dto";
import { ResponseMessage } from "../../common/decorators/response.decorator";
import { ValidationPipe } from "@nestjs/common";
import { RESULT_SUCCESS_MESSAGES } from "./constants/messages.constant";
import { Public } from "src/security/auth/auth.decorator";

@Public()
@Controller("results")
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @ResponseMessage(RESULT_SUCCESS_MESSAGES.CREATED)
  async declareResult(
    @Body(new ValidationPipe({ transform: true }))
    dto: DeclareResultDto
  ) {
    return this.resultsService.declareResult(dto);
  }

  @Get(":productId")
  @ResponseMessage(RESULT_SUCCESS_MESSAGES.RETRIEVED)
  async getResult(@Param("productId") productId: string) {
    return this.resultsService.getResult(productId);
  }
}
