import { Controller, Get, Post, Patch, Param, Body } from "@nestjs/common";
import { WorkflowsService } from "./workflows.service.js";
import { CreateWorkflowDto, UpdateWorkflowStatusDto } from "./dto/workflows.dto.js";

@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  create(@Body() body: CreateWorkflowDto) {
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
  updateStatus(@Param("id") id: string, @Body() body: UpdateWorkflowStatusDto) {
    return this.workflowsService.updateWorkflowStatus(id, body.status);
  }
}
