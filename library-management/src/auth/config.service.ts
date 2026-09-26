import { Injectable } from '@nestjs/common';

// A minimal config service so env values are read in one place.
// (For bigger projects you'd use @nestjs/config, but this keeps
// things simple and easy to explain for an internship project.)
@Injectable()
export class ConfigService {
  get jwtSecret(): string {
    return process.env.JWT_SECRET || 'dev_secret_change_me';
  }

  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN || '7d';
  }

  get port(): number {
    return Number(process.env.PORT) || 3000;
  }
}
