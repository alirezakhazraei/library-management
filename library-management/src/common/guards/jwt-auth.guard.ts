import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Protects a route: requires a valid JWT in the Authorization header.
// Usage: @UseGuards(JwtAuthGuard)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
