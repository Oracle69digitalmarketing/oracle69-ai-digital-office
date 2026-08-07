import { Module, Global } from "@nestjs/common";
import { PrismaService } from "./prisma.service.js";

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: "PrismaService",
      useExisting: PrismaService,
    },
  ],
  exports: [PrismaService, "PrismaService"],
})
export class PrismaModule {}
