/* eslint-disable */
import { Controller, Post, Body, Headers } from "@nestjs/common";

@Controller("webhooks")
export class WebhookController {
  @Post("incoming")
  async handleIncoming(
    @Body() _body: any, // eslint-disable-line @typescript-eslint/no-unused-vars
    @Headers("x-webhook-signature") _signature: string,
  ) {
    // eslint-disable-line @typescript-eslint/no-unused-vars
    return { status: "received" };
  }
}
