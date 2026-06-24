import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { users, refresh_tokens, password_resets } from '../database/schema';
import { EmailService } from '../email/email.service';
import { SignupDto, LoginDto, GoogleAuthDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;
  private readonly RESET_TOKEN_EXPIRY_HOURS = 1;

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const password_hash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email,
        password_hash,
        first_name: dto.first_name,
        last_name: dto.last_name,
      })
      .returning();

    return this.generateTokens(user);
  }

  async getProfile(user_id: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, user_id))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async login(dto: LoginDto) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async googleAuth(dto: GoogleAuthDto) {
    const payload = await this.verifyGoogleToken(dto.id_token);

    let [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.google_id, payload.sub))
      .limit(1);

    if (!user) {
      [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, payload.email))
        .limit(1);

      if (user) {
        await this.db
          .update(users)
          .set({ google_id: payload.sub, avatar_url: payload.picture })
          .where(eq(users.id, user.id));
      } else {
        [user] = await this.db
          .insert(users)
          .values({
            email: payload.email,
            google_id: payload.sub,
            first_name: payload.given_name,
            last_name: payload.family_name,
            avatar_url: payload.picture,
          })
          .returning();
      }
    }

    return this.generateTokens(user);
  }

  async refreshTokens(token: string) {
    const token_hash = this.hashToken(token);

    const [stored] = await this.db
      .select()
      .from(refresh_tokens)
      .where(
        and(
          eq(refresh_tokens.token_hash, token_hash),
          eq(refresh_tokens.revoked, false),
        ),
      )
      .limit(1);

    if (!stored || stored.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.db
      .update(refresh_tokens)
      .set({ revoked: true })
      .where(eq(refresh_tokens.id, stored.id));

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, stored.user_id))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateTokens(user);
  }

  async requestResetPassword(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return;

    const token = randomBytes(32).toString('hex');
    const token_hash = this.hashToken(token);
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + this.RESET_TOKEN_EXPIRY_HOURS);

    await this.db.insert(password_resets).values({
      user_id: user.id,
      token_hash,
      expires_at,
    });

    await this.email.sendPasswordResetEmail(email, token);
  }

  async resetPassword(token: string, new_password: string) {
    const token_hash = this.hashToken(token);

    const [reset] = await this.db
      .select()
      .from(password_resets)
      .where(
        and(
          eq(password_resets.token_hash, token_hash),
          eq(password_resets.used, false),
        ),
      )
      .limit(1);

    if (!reset || reset.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const password_hash = await bcrypt.hash(new_password, this.BCRYPT_ROUNDS);

    await this.db
      .update(users)
      .set({ password_hash, updated_at: new Date() })
      .where(eq(users.id, reset.user_id));

    await this.db
      .update(password_resets)
      .set({ used: true })
      .where(eq(password_resets.id, reset.id));

    await this.db
      .update(refresh_tokens)
      .set({ revoked: true })
      .where(eq(refresh_tokens.user_id, reset.user_id));
  }

  async logout(token: string) {
    const token_hash = this.hashToken(token);

    await this.db
      .update(refresh_tokens)
      .set({ revoked: true })
      .where(eq(refresh_tokens.token_hash, token_hash));
  }

  private safeUser(user: { id: string; email: string; first_name: string | null; last_name: string | null; avatar_url: string | null; created_at: Date }) {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    };
  }

  private async generateTokens(user: { id: string; email: string; first_name: string | null; last_name: string | null; avatar_url: string | null; created_at: Date }) {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const access_token = this.jwt.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    const raw_refresh_token = randomBytes(32).toString('hex');
    const token_hash = this.hashToken(raw_refresh_token);
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    await this.db.insert(refresh_tokens).values({
      user_id: user.id,
      token_hash,
      expires_at,
    });

    return {
      access_token,
      refresh_token: raw_refresh_token,
      user: this.safeUser(user),
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async verifyGoogleToken(id_token: string) {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`,
    );

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = await response.json();
    const client_id = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');

    if (payload.aud !== client_id) {
      throw new UnauthorizedException('Invalid Google token audience');
    }

    return payload as {
      sub: string;
      email: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };
  }
}
