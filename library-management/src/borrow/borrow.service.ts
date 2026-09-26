import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BorrowBookDto } from './dto/borrow-book.dto';
import { Role } from '../common/enums/role.enum';
import { BorrowStatus } from '@prisma/client';

const LOAN_PERIOD_DAYS = 14;

@Injectable()
export class BorrowService {
  constructor(private prisma: PrismaService) {}

  async borrowBook(
    requesterId: number,
    requesterRole: string,
    dto: BorrowBookDto,
  ) {
    // Members can only borrow for themselves. Librarians/admins may
    // issue a book on behalf of a given userId.
    const targetUserId =
      requesterRole === Role.MEMBER ? requesterId : dto.userId ?? requesterId;

    const book = await this.prisma.book.findUnique({ where: { id: dto.bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (book.availableCopies < 1) {
      throw new BadRequestException('No available copies of this book right now');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

    // Run as a transaction so the copy count and the borrow record
    // stay consistent even if something fails midway.
    const [borrowRecord] = await this.prisma.$transaction([
      this.prisma.borrowRecord.create({
        data: {
          userId: targetUserId,
          bookId: dto.bookId,
          dueDate,
          status: BorrowStatus.BORROWED,
        },
      }),
      this.prisma.book.update({
        where: { id: dto.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);

    return borrowRecord;
  }

  async returnBook(requesterId: number, requesterRole: string, borrowRecordId: number) {
    const record = await this.prisma.borrowRecord.findUnique({
      where: { id: borrowRecordId },
    });
    if (!record) {
      throw new NotFoundException('Borrow record not found');
    }
    if (record.status === BorrowStatus.RETURNED) {
      throw new BadRequestException('This book has already been returned');
    }

    // Members can only return their own borrowed books
    if (requesterRole === Role.MEMBER && record.userId !== requesterId) {
      throw new BadRequestException('You can only return your own borrowed books');
    }

    const [updatedRecord] = await this.prisma.$transaction([
      this.prisma.borrowRecord.update({
        where: { id: borrowRecordId },
        data: { status: BorrowStatus.RETURNED, returnedAt: new Date() },
      }),
      this.prisma.book.update({
        where: { id: record.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);

    return updatedRecord;
  }

  // A member's own borrow history
  myHistory(userId: number) {
    return this.prisma.borrowRecord.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { borrowedAt: 'desc' },
    });
  }

  // Full history - for admins/librarians
  findAll() {
    return this.prisma.borrowRecord.findMany({
      include: { book: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { borrowedAt: 'desc' },
    });
  }
}
