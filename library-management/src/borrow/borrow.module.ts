import { Module } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowController } from './borrow.controller';

@Module({
  providers: [BorrowService],
  controllers: [BorrowController],
})
export class BorrowModule {}
