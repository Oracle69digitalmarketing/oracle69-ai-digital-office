import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { RolesGuard } from "./roles.guard.js";
import { Public } from "./public.decorator.js";
import { RegisterDto, LoginDto, RefreshDto } from "./dto/auth.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post("login")
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.authService.login(user);
  }

  @Public()
  @Post("refresh")
  async refresh(@Body() body: RefreshDto) {
    return this.authService.refreshToken(body.refresh_token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get("profile")
  getProfile(@Request() req: any) {
    return req.user;
  }
}
