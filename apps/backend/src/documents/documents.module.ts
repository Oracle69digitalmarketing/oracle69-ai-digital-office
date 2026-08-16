import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsService } from "./documents.service.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";

@Module({
  imports: [PrismaModule, SharedModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
