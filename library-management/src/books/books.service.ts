import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    const existing = await this.prisma.book.findUnique({ where: { isbn: dto.isbn } });
    if (existing) {
      throw new ConflictException('A book with this ISBN already exists');
    }

    return this.prisma.book.create({
      data: {
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn,
        totalCopies: dto.totalCopies,
        availableCopies: dto.totalCopies,
      },
    });
  }

  findAll() {
    return this.prisma.book.findMany({ orderBy: { title: 'asc' } });
  }

  async findOne(id: number) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    await this.findOne(id); // throws 404 if missing

    // If totalCopies changes, keep availableCopies consistent by
    // shifting it by the same delta (simple rule for a beginner project).
    if (dto.totalCopies !== undefined) {
      const current = await this.prisma.book.findUniqueOrThrow({ where: { id } });
      const delta = dto.totalCopies - current.totalCopies;
      return this.prisma.book.update({
        where: { id },
        data: {
          ...dto,
          availableCopies: current.availableCopies + delta,
        },
      });
    }

    return this.prisma.book.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id); // throws 404 if missing
    return this.prisma.book.delete({ where: { id } });
  }
}
