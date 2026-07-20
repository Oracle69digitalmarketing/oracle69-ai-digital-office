import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from "@nestjs/common";
import { TasksService } from "./tasks.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body("status") status: string, @Request() req: any) {
    return this.tasksService.updateStatus(id, status, req.user.userId);
  }

  @Post()
  create(@Body() data: any) {
    return this.tasksService.create(data);
  }
}
