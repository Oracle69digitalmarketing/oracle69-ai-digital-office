var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessageRouter_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageStatus } from './message.types.js';
import { AgentDirectory } from './agent-directory.js';
import { CommunicationEventType } from './communication-events.js';
let MessageRouter = MessageRouter_1 = class MessageRouter {
    directory;
    eventEmitter;
    logger = new Logger(MessageRouter_1.name);
    constructor(directory, eventEmitter) {
        this.directory = directory;
        this.eventEmitter = eventEmitter;
    }
    async route(message) {
        this.logger.log(`Routing message ${message.id} to ${message.recipient}`);
        // Validate
        const recipient = this.directory.lookup(message.recipient);
        if (!recipient) {
            this.logger.error(`Recipient ${message.recipient} not found`);
            return;
        }
        message.status = MessageStatus.DELIVERED;
        this.eventEmitter.emit(CommunicationEventType.MESSAGE_SENT, message);
    }
};
MessageRouter = MessageRouter_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [AgentDirectory,
        EventEmitter2])
], MessageRouter);
export { MessageRouter };
//# sourceMappingURL=message-router.js.map