import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from "@nestjs/common";
import { WorkflowsService } from "./workflows.service.js";

@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  create(@Body() body: { name: string; projectId: string }) {
    return this.workflowsService.createWorkflow(body.name, body.projectId);
  }

  @Get()
  findAll() {
    return this.workflowsService.listWorkflows();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.workflowsService.findWorkflow(id);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.workflowsService.updateWorkflowStatus(id, status);
  }
}
