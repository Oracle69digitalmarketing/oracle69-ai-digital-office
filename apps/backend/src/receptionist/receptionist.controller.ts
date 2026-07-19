import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { ReceptionistService } from './receptionist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('receptionist')
@UseGuards(JwtAuthGuard)
export class ReceptionistController {
  constructor(private receptionistService: ReceptionistService) {}

  @Post('chat')
  async chat(@Request() req: any, @Body('message') message: string) {
    return this.receptionistService.handleRequest(req.user.userId, message);
  }
}
