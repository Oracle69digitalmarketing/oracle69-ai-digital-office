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
      const { password: _password, ...result } = user;
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
    console.log("STEP 1: validating input");
    console.log("AuthService.register: Starting registration for data:", JSON.stringify(data));

    try {
      console.log("STEP 2: checking existing user");
      const existingUser = await this.usersService.findOne(data.email);
      console.log("STEP 3: existing user check result:", existingUser ? "User exists" : "User not found");

      if (existingUser) {
        throw new ConflictException("User already exists");
      }

      console.log("STEP 4: hashing password");
      const hashedPassword = await bcrypt.hash(data.password, 10);
      console.log("STEP 5: password hashed");

      console.log("STEP 6: creating organization (via connectOrCreate)");
      console.log("STEP 7: creating user");
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
      console.log("STEP 8: user created successfully:", user.id);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user;
      
      console.log("STEP 10: registration complete");
      return result;
    } catch (error: any) {
      console.error("REGISTER ERROR");
      console.error(error);
      console.error(error.stack);
      throw error;
    }
  }
}
