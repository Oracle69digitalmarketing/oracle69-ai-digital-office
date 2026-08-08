var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AgentMailbox_1;
import { Injectable, Logger } from '@nestjs/common';
let AgentMailbox = AgentMailbox_1 = class AgentMailbox {
    logger = new Logger(AgentMailbox_1.name);
    inbox = [];
    outbox = [];
    pending = [];
    completed = [];
    failed = [];
    pushToInbox(message) {
        this.inbox.push(message);
    }
    popFromInbox() {
        return this.inbox.shift();
    }
    pushToOutbox(message) {
        this.outbox.push(message);
    }
};
AgentMailbox = AgentMailbox_1 = __decorate([
    Injectable()
], AgentMailbox);
export { AgentMailbox };
//# sourceMappingURL=agent-mailbox.js.map