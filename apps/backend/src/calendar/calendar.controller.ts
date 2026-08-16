import { Controller, Get, Post, Body, UseGuards } from "@nestjs/common";
import { CalendarService } from "./calendar.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("calendar")
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  findAll() {
    return this.calendarService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.calendarService.create(data);
  }
}
