import { IsInt, IsOptional } from 'class-validator';

export class BorrowBookDto {
  @IsInt()
  bookId: number;

  // For a member borrowing for themselves, the service ignores this
  // and uses the logged-in user's id. Librarians/admins can pass a
  // different userId to issue a book on behalf of a member.
  @IsOptional()
  @IsInt()
  userId?: number;
}
