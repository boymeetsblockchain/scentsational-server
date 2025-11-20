import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as ms from 'ms';
import { CONFIGS } from 'src/configs';

@Injectable()
export class AuthUtilService {
  async hashPassword(password: string): Promise<string> {
    const hash = await bcrypt.hash(password, CONFIGS.BCRYPT_SALT_ROUNDS);
    return hash;
  }

  // Compare a plain password with a hashed password
  verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate access and refresh tokens
  generateJwtToken(
    payload: { type: 'access' | 'refresh' } & Record<string, string>,
    lifetime: number,
  ) {
    const token = jwt.sign(payload, CONFIGS.JWT_SECRET, {
      expiresIn: lifetime,
    });
    return token;
  }

  // Verify access token
  verifyToken(token: string): any {
    return jwt.verify(token, CONFIGS.JWT_SECRET);
  }
}
