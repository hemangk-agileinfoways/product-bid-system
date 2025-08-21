import { ArrayNotEmpty, IsArray, IsMongoId } from "class-validator";

export class DeleteSlotsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true, message: "One of the provided id is not valid" })
  ids: string[];
}
