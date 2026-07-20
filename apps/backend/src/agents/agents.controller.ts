import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AgentsService } from "./agents.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("agents")
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  findAll() {
    return this.agentsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.agentsService.findOne(id);
  }
}
