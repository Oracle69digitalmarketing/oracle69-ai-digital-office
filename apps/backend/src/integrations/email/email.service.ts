/* eslint-disable */
import { Injectable, Logger } from '@nestjs/common';

import { IEmailProvider } from "@oracle69/shared";

@Injectable()
export class MockEmailService implements IEmailProvider {
  private readonly logger = new Logger(MockEmailService.name);

  async send(to: string, subject: string, _body: string): Promise<void> {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    this.logger.log(`Mock Sending Email to ${to}: ${subject}`);
  }
}
