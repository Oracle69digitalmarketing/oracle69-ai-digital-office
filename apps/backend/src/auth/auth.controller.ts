import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "./roles.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post("login")
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.authService.login(user);
  }

  @Post("refresh")
  async refresh(@Body("refresh_token") token: string) {
    return this.authService.refreshToken(token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get("profile")
  getProfile(@Request() req: any) {
    return req.user;
  }
}
