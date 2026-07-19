import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Oracle69 AI Digital Office Backend";
  }
}
