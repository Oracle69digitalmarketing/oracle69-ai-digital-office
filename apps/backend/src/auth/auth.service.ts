import { Injectable, ConflictException, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service.js";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service.js";
import { RegisterDto } from "./dto/auth.dto.js";

const DEFAULT_ROLE = "employee";

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

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      organizationId: user.organizationId,
      tokenType: "access",
      type: "access",
    };
    const refreshPayload = {
      ...payload,
      tokenType: "refresh",
      type: "refresh",
    };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: "1h" }),
      refresh_token: this.jwtService.sign(refreshPayload, { expiresIn: "7d" }),
      expires_in: 3600,
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

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<{ email: string; tokenType?: string; type?: string }>(
        token,
      );
      if (payload.tokenType !== "refresh" && payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }
      const user = await this.usersService.findOne(payload.email);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }
      return this.login(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
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
