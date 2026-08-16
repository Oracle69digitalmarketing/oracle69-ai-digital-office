export var MessageType;
(function (MessageType) {
    MessageType["TASK_REQUEST"] = "task.request";
    MessageType["TASK_RESPONSE"] = "task.response";
    MessageType["DELEGATION"] = "delegation";
    MessageType["STATUS_UPDATE"] = "status.update";
    MessageType["APPROVAL_REQUEST"] = "approval.request";
    MessageType["APPROVAL_RESPONSE"] = "approval.response";
    MessageType["QUESTION"] = "question";
    MessageType["ANSWER"] = "answer";
    MessageType["NOTIFICATION"] = "notification";
    MessageType["SYSTEM_EVENT"] = "system.event";
    MessageType["HEARTBEAT"] = "heartbeat";
    MessageType["ERROR"] = "error";
})(MessageType || (MessageType = {}));
export var MessagePriority;
(function (MessagePriority) {
    MessagePriority["LOW"] = "low";
    MessagePriority["NORMAL"] = "normal";
    MessagePriority["HIGH"] = "high";
    MessagePriority["URGENT"] = "urgent";
})(MessagePriority || (MessagePriority = {}));
export var MessageStatus;
(function (MessageStatus) {
    MessageStatus["CREATED"] = "created";
    MessageStatus["QUEUED"] = "queued";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["ACKNOWLEDGED"] = "acknowledged";
    MessageStatus["COMPLETED"] = "completed";
    MessageStatus["EXPIRED"] = "expired";
    MessageStatus["FAILED"] = "failed";
})(MessageStatus || (MessageStatus = {}));
