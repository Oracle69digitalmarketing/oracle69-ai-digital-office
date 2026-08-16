/**
 * Represents the lifecycle state of the Enterprise Runtime.
 */
export var RuntimeState;
(function (RuntimeState) {
    RuntimeState["UNINITIALIZED"] = "uninitialized";
    RuntimeState["STARTING"] = "starting";
    RuntimeState["READY"] = "ready";
    RuntimeState["STOPPING"] = "stopping";
    RuntimeState["STOPPED"] = "stopped";
})(RuntimeState || (RuntimeState = {}));
