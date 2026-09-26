import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password: string;

  // Optional: if omitted, defaults to MEMBER in the service layer.
  // In a real app you'd restrict who can register as ADMIN/LIBRARIAN -
  // kept open here for simplicity in an internship-level project.
  @IsOptional()
  @IsEnum(Role, { message: 'role must be one of: ADMIN, LIBRARIAN, MEMBER' })
  role?: Role;
}
