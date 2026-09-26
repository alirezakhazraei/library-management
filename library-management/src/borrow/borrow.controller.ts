import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowBookDto } from './dto/borrow-book.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Controller('borrow')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BorrowController {
  constructor(private borrowService: BorrowService) {}

  // Any authenticated user can borrow: members borrow for themselves,
  // librarians/admins may issue on behalf of a member via dto.userId
  @Post()
  borrowBook(@CurrentUser() user: CurrentUserPayload, @Body() dto: BorrowBookDto) {
    return this.borrowService.borrowBook(user.userId, user.role, dto);
  }

  @Patch(':id/return')
  returnBook(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.borrowService.returnBook(user.userId, user.role, id);
  }

  // A member's own borrow history
  @Get('my-history')
  myHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.borrowService.myHistory(user.userId);
  }

  // Full history - admins and librarians only
  @Get()
  @Roles(Role.ADMIN, Role.LIBRARIAN)
  findAll() {
    return this.borrowService.findAll();
  }
}
