import { IsInt, IsString, Min } from 'class-validator';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsString()
  isbn: string;

  @IsInt()
  @Min(1, { message: 'totalCopies must be at least 1' })
  totalCopies: number;
}
