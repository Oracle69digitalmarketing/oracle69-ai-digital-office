import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";

import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service.js";
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
    console.log("AuthService.register: Starting registration for email:", data.email);
    
    const existingUser = await this.usersService.findOne(data.email);
    console.log("AuthService.register: existingUser check result:", existingUser ? "User exists" : "User not found");
    
    if (existingUser) {
      throw new ConflictException("User already exists");
    }

    console.log("AuthService.register: Hashing password...");
    const hashedPassword = await bcrypt.hash(data.password, 10);
    console.log("AuthService.register: Password hashed.");

    console.log("AuthService.register: Creating user in DB...");
    try {
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
      console.log("AuthService.register: User created successfully:", user.id);
      
      const { password, ...result } = user;
      return result;
    } catch (error) {
      console.error("AuthService.register: Error during user creation:", error);
      throw error;
    }
  }
}
