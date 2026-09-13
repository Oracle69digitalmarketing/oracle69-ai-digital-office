import { Injectable, ConflictException, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service.js";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { RegisterDto } from "./dto/auth.dto.js";
import { RefreshTokenPayload } from "./token-payload.types.js";

const DEFAULT_ROLE = "employee";

const ACCESS_TOKEN_TTL = "1h";
const ACCESS_TOKEN_TTL_SECONDS = 3600;
const REFRESH_TOKEN_TTL = "7d";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const REFRESH_TOKEN_STATUS_ACTIVE = "active";
const REFRESH_TOKEN_STATUS_REVOKED = "revoked";

/** Organization ids that must never be accepted from or written for a token. */
const FORBIDDEN_ORGANIZATION_IDS = new Set(["system"]);

function hashRefreshToken(presentedToken: string): string {
  return crypto.createHash("sha256").update(presentedToken, "utf8").digest("hex");
}

function hashMatches(presentedToken: string, storedHash: string): boolean {
  if (typeof storedHash !== "string" || storedHash.length === 0) {
    return false;
  }
  const presentedHash = Buffer.from(hashRefreshToken(presentedToken), "utf8");
  const expectedHash = Buffer.from(storedHash, "utf8");
  if (presentedHash.length !== expectedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(presentedHash, expectedHash);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  private signAccessToken(user: any): string {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
      tokenType: "access",
      type: "access",
    };
    return this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL });
  }

  private signRefreshToken(user: any, jti: string): string {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
      jti,
      tokenType: "refresh",
      type: "refresh",
    };
    return this.jwtService.sign(payload, { expiresIn: REFRESH_TOKEN_TTL });
  }

  private toAuthResponse(user: any, access_token: string, refresh_token: string) {
    return {
      access_token,
      refresh_token,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      token_type: "Bearer",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async login(user: any) {
    const jti = randomUUID();
    const access_token = this.signAccessToken(user);
    const refresh_token = this.signRefreshToken(user, jti);
    const now = new Date();

    // Persist only a one-way hash of the refresh token, never the raw bearer value.
    await this.prisma.refreshToken.create({
      data: {
        jti,
        tokenHash: hashRefreshToken(refresh_token),
        userId: user.id,
        organizationId: user.organizationId,
        status: REFRESH_TOKEN_STATUS_ACTIVE,
        expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
        issuedAt: now,
      },
    });

    return this.toAuthResponse(user, access_token, refresh_token);
  }

  async refreshToken(token: string) {
    if (typeof token !== "string" || token.length === 0) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 1-2. Validate JWT signature and expiration. Throws on bad signature/expiry.
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 3. Validate token type: reject access tokens (or anything not explicitly refresh).
    if (
      !payload ||
      typeof payload !== "object" ||
      payload.tokenType !== "refresh" ||
      (payload as { type?: string }).type !== "refresh"
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 4. Extract jti, user identity, and organizationId. No fallback organization.
    const jti = (payload as RefreshTokenPayload).jti;
    const userId = payload.sub;
    const organizationId = payload.organizationId;
    if (
      typeof jti !== "string" ||
      jti.length === 0 ||
      typeof userId !== "string" ||
      userId.length === 0 ||
      typeof organizationId !== "string" ||
      organizationId.length === 0 ||
      FORBIDDEN_ORGANIZATION_IDS.has(organizationId)
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 5. Locate the persisted RefreshToken by jti.
    const record = await this.prisma.refreshToken.findUnique({ where: { jti } });
    if (!record) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const now = new Date();

    // 6-8. Verify active status, server-side expiry, and user/organization binding.
    if (record.status !== REFRESH_TOKEN_STATUS_ACTIVE) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const storedExpiresAt = record.expiresAt instanceof Date ? record.expiresAt : new Date(record.expiresAt);
    const storedExpiresAtMs = storedExpiresAt.getTime();
    if (Number.isNaN(storedExpiresAtMs) || storedExpiresAtMs <= now.getTime()) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    if (record.userId !== userId || record.organizationId !== organizationId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 8b. Verify the presented token matches the stored hash (constant-time compare).
    if (!hashMatches(token, record.tokenHash)) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // The persisted identity is authoritative: the account must still exist and
    // still belong to the same organization.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.organizationId !== organizationId || user.organizationId !== record.organizationId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 10. Rotate: atomically invalidate the old token and persist the replacement.
    // The conditional update (status must still be active) makes the claim
    // race-safe: concurrent replays of the same token yield count 0 and fail.
    const newJti = randomUUID();
    const access_token = this.signAccessToken(user);
    const refresh_token = this.signRefreshToken(user, newJti);
    const replacement = {
      jti: newJti,
      tokenHash: hashRefreshToken(refresh_token),
      userId: user.id,
      organizationId: user.organizationId,
      status: REFRESH_TOKEN_STATUS_ACTIVE,
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
      issuedAt: now,
    };

    await this.prisma.$transaction(async (tx: any) => {
      const current = await tx.refreshToken.findUnique({ where: { jti } });
      if (!current || current.status !== REFRESH_TOKEN_STATUS_ACTIVE) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      const claimed = await tx.refreshToken.updateMany({
        where: { id: current.id, status: REFRESH_TOKEN_STATUS_ACTIVE },
        data: {
          status: REFRESH_TOKEN_STATUS_REVOKED,
          usedAt: now,
          revokedAt: now,
        },
      });
      if (!claimed || claimed.count !== 1) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      await tx.refreshToken.create({ data: replacement });
    });

    return this.toAuthResponse(user, access_token, refresh_token);
  }

  /**
   * Revoke the persisted refresh token identified by the presented bearer token.
   * Idempotent: an already-revoked token completes successfully without issuing
   * any replacement. Never returns tokens, hashes, or database internals.
   */
  async logout(token: string) {
    if (typeof token !== "string" || token.length === 0) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Cryptographically validate the token (signature + expiration) to obtain jti.
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Require a refresh token: reject access tokens (or anything not explicit).
    if (
      !payload ||
      typeof payload !== "object" ||
      payload.tokenType !== "refresh" ||
      (payload as { type?: string }).type !== "refresh"
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Require a valid jti, user identity, and organizationId. No fallback organization.
    const jti = (payload as RefreshTokenPayload).jti;
    const userId = payload.sub;
    const organizationId = payload.organizationId;
    if (
      typeof jti !== "string" ||
      jti.length === 0 ||
      typeof userId !== "string" ||
      userId.length === 0 ||
      typeof organizationId !== "string" ||
      organizationId.length === 0 ||
      FORBIDDEN_ORGANIZATION_IDS.has(organizationId)
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Find the persisted record by jti. Unknown jti yields the same generic
    // error as every other failure so existence is never leaked.
    const record = await this.prisma.refreshToken.findUnique({ where: { jti } });
    if (!record) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Ownership/binding: the record must belong to the token's user and org,
    // so one user's token can never revoke another user's token.
    if (record.userId !== userId || record.organizationId !== organizationId) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Verify the presented token against the stored hash (constant-time compare).
    if (!hashMatches(token, record.tokenHash)) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Idempotent revocation: already-revoked tokens complete without changes
    // and without issuing anything. The row is retained for history.
    // Note: logout sets revokedAt only (not usedAt) to distinguish revocation
    // from rotation-driven use, consistent with the Batch 3A representation.
    if (record.status !== REFRESH_TOKEN_STATUS_ACTIVE) {
      return { success: true };
    }
    const now = new Date();
    await this.prisma.refreshToken.updateMany({
      where: { id: record.id, status: REFRESH_TOKEN_STATUS_ACTIVE },
      data: {
        status: REFRESH_TOKEN_STATUS_REVOKED,
        revokedAt: now,
      },
    });

    return { success: true };
  }

  async register(dto: RegisterDto) {
    const { password, email, name } = dto;

    const existingUser = await this.usersService.findOne(email);
    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName?.trim() || `${name?.trim() || email}'s Workspace` },
      });

      return tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: DEFAULT_ROLE,
          organization: { connect: { id: organization.id } },
        },
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...result } = user;

    return result;
  }
}
