import { Controller, Get, Post, Body, Param, UseGuards, Request } from "@nestjs/common";
import { DocumentsService } from "./documents.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CreateDocumentDto } from "./dto/documents.dto.js";

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
  create(@Body() data: CreateDocumentDto, @Request() req: any) {
    return this.documentsService.create(data, req.user.userId);
  }
}
