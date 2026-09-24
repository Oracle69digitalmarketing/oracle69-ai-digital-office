import { Controller, Post, Body, Request, UseGuards } from "@nestjs/common";
import { ReceptionistService } from "./receptionist.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { ReceptionistChatDto } from "./dto/receptionist.dto.js";

@Controller("receptionist")
@UseGuards(JwtAuthGuard)
export class ReceptionistController {
  constructor(private receptionistService: ReceptionistService) {}

  @Post("chat")
  async chat(@Request() req: any, @Body() body: ReceptionistChatDto) {
    const sid = body.sessionId || `session-${req.user.userId}`;
    return this.receptionistService.handleRequest(req.user.userId, sid, body.message);
  }
}
