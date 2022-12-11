import { Plugin } from "@rweich/streamdeck-ts";

export default class PluginLoggerDelegate {
    private _delegate: Plugin;
    constructor(delegate: Plugin) {
        this._delegate = delegate;
    }
    logMessage(message: string) {
        this._delegate.logMessage(message);
    }
}