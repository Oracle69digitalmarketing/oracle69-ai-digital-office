import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: "7d" }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.email);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }
      return this.login(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async register(data: any) {
    const existingUser = await this.usersService.findOne(data.email);
    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || "employee",
      organization: {
        connectOrCreate: {
          where: { id: data.organizationId || "default-org" },
          create: { name: data.organizationName || "Default Organization" },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
