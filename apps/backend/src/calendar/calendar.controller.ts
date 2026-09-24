import { Controller, Get, Post, Body, UseGuards, Request } from "@nestjs/common";
import { CalendarService } from "./calendar.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CreateCalendarEventDto } from "./dto/calendar.dto.js";

@Controller("calendar")
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  findAll() {
    return this.calendarService.findAll();
  }

  @Post()
  create(@Body() data: CreateCalendarEventDto, @Request() req: any) {
    return this.calendarService.create(data, req.user.userId);
  }
}
