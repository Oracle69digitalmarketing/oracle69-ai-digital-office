import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ProjectsService } from "./projects.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CreateProjectDto } from "./dto/projects.dto.js";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateProjectDto) {
    return this.projectsService.create(data);
  }
}
