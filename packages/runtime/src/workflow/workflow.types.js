export var WorkflowState;
(function (WorkflowState) {
    WorkflowState["CREATED"] = "created";
    WorkflowState["READY"] = "ready";
    WorkflowState["RUNNING"] = "running";
    WorkflowState["WAITING"] = "waiting";
    WorkflowState["PAUSED"] = "paused";
    WorkflowState["RETRYING"] = "retrying";
    WorkflowState["FAILED"] = "failed";
    WorkflowState["COMPLETED"] = "completed";
    WorkflowState["CANCELLED"] = "cancelled";
})(WorkflowState || (WorkflowState = {}));
