import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AccessTokenPayload } from "./token-payload.types.js";

/** Organization ids that must never be accepted as an authenticated tenant. */
const FORBIDDEN_ORGANIZATION_IDS = new Set(["system"]);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
      algorithms: ["HS256"],
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (payload.tokenType !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }

    // The authenticated principal must always carry a resolvable tenant. An
    // access token without a valid organizationId is rejected so that no
    // downstream query can silently drop its tenant filter (Prisma ignores
    // undefined where-predicates, which would otherwise fail open).
    const organizationId = payload.organizationId;
    if (
      typeof payload.sub !== "string" ||
      payload.sub.length === 0 ||
      typeof organizationId !== "string" ||
      organizationId.length === 0 ||
      FORBIDDEN_ORGANIZATION_IDS.has(organizationId)
    ) {
      throw new UnauthorizedException("Invalid token organization");
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId,
    };
  }
}
