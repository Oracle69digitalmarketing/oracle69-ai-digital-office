import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { User, Prisma } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    console.log("UsersService.create: Attempting to create user with data:", JSON.stringify(data));
    try {
      const user = await this.prisma.user.create({
        data,
      });
      console.log("UsersService.create: Prisma create success.");
      return user;
    } catch (error) {
      console.error("UsersService.create: Prisma create failed:", error);
      throw error;
    }
  }
}
