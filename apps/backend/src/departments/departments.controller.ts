import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { DepartmentsService } from "./departments.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CreateDepartmentDto } from "./dto/departments.dto.js";

@Controller("departments")
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateDepartmentDto) {
    return this.departmentsService.create(data);
  }
}
