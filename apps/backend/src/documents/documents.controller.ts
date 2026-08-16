import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { DocumentsService } from "./documents.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.documentsService.create(data);
  }
}
