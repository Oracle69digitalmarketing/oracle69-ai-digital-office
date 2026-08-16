import { Controller, Get, Patch, Body, UseGuards, Request } from "@nestjs/common";
import { SettingsService } from "./settings.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@UseGuards(JwtAuthGuard)
@Controller("settings")
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get("me")
  async getSettings(@Request() req: any) {
    return this.settingsService.getUserSettings(req.user.id);
  }

  @Patch("me")
  async updateSetting(@Request() req: any, @Body() body: { key: string; value: any }) {
    return this.settingsService.updateUserSetting(req.user.id, body.key, body.value);
  }
}
