/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/platform/notification/common/notification", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/commands/common/commands", "vs/platform/clipboard/common/clipboardService", "vs/css!./media/notificationsActions"], function (require, exports, nls_1, actions_1, telemetry_1, notification_1, notificationsCommands_1, commands_1, clipboardService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ClearNotificationAction = class ClearNotificationAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, 'clear-notification-action');
            this.commandService = commandService;
        }
        run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.CLEAR_NOTIFICATION, notification);
            return Promise.resolve();
        }
    };
    ClearNotificationAction.ID = notificationsCommands_1.CLEAR_NOTIFICATION;
    ClearNotificationAction.LABEL = nls_1.localize('clearNotification', "Clear Notification");
    ClearNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ClearNotificationAction);
    exports.ClearNotificationAction = ClearNotificationAction;
    let ClearAllNotificationsAction = class ClearAllNotificationsAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, 'clear-all-notifications-action');
            this.commandService = commandService;
        }
        run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.CLEAR_ALL_NOTIFICATIONS);
            return Promise.resolve();
        }
    };
    ClearAllNotificationsAction.ID = notificationsCommands_1.CLEAR_ALL_NOTIFICATIONS;
    ClearAllNotificationsAction.LABEL = nls_1.localize('clearNotifications', "Clear All Notifications");
    ClearAllNotificationsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ClearAllNotificationsAction);
    exports.ClearAllNotificationsAction = ClearAllNotificationsAction;
    let HideNotificationsCenterAction = class HideNotificationsCenterAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, 'hide-all-notifications-action');
            this.commandService = commandService;
        }
        run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER);
            return Promise.resolve();
        }
    };
    HideNotificationsCenterAction.ID = notificationsCommands_1.HIDE_NOTIFICATIONS_CENTER;
    HideNotificationsCenterAction.LABEL = nls_1.localize('hideNotificationsCenter', "Hide Notifications");
    HideNotificationsCenterAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], HideNotificationsCenterAction);
    exports.HideNotificationsCenterAction = HideNotificationsCenterAction;
    let ExpandNotificationAction = class ExpandNotificationAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, 'expand-notification-action');
            this.commandService = commandService;
        }
        run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.EXPAND_NOTIFICATION, notification);
            return Promise.resolve();
        }
    };
    ExpandNotificationAction.ID = notificationsCommands_1.EXPAND_NOTIFICATION;
    ExpandNotificationAction.LABEL = nls_1.localize('expandNotification', "Expand Notification");
    ExpandNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ExpandNotificationAction);
    exports.ExpandNotificationAction = ExpandNotificationAction;
    let CollapseNotificationAction = class CollapseNotificationAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, 'collapse-notification-action');
            this.commandService = commandService;
        }
        run(notification) {
            this.commandService.executeCommand(notificationsCommands_1.COLLAPSE_NOTIFICATION, notification);
            return Promise.resolve();
        }
    };
    CollapseNotificationAction.ID = notificationsCommands_1.COLLAPSE_NOTIFICATION;
    CollapseNotificationAction.LABEL = nls_1.localize('collapseNotification', "Collapse Notification");
    CollapseNotificationAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CollapseNotificationAction);
    exports.CollapseNotificationAction = CollapseNotificationAction;
    class ConfigureNotificationAction extends actions_1.Action {
        constructor(id, label, _configurationActions) {
            super(id, label, 'configure-notification-action');
            this._configurationActions = _configurationActions;
        }
        get configurationActions() {
            return this._configurationActions;
        }
    }
    ConfigureNotificationAction.ID = 'workbench.action.configureNotification';
    ConfigureNotificationAction.LABEL = nls_1.localize('configureNotification', "Configure Notification");
    exports.ConfigureNotificationAction = ConfigureNotificationAction;
    let CopyNotificationMessageAction = class CopyNotificationMessageAction extends actions_1.Action {
        constructor(id, label, clipboardService) {
            super(id, label);
            this.clipboardService = clipboardService;
        }
        run(notification) {
            return this.clipboardService.writeText(notification.message.raw);
        }
    };
    CopyNotificationMessageAction.ID = 'workbench.action.copyNotificationMessage';
    CopyNotificationMessageAction.LABEL = nls_1.localize('copyNotification', "Copy Text");
    CopyNotificationMessageAction = __decorate([
        __param(2, clipboardService_1.IClipboardService)
    ], CopyNotificationMessageAction);
    exports.CopyNotificationMessageAction = CopyNotificationMessageAction;
    let NotificationActionRunner = class NotificationActionRunner extends actions_1.ActionRunner {
        constructor(telemetryService, notificationService) {
            super();
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
        }
        runAction(action, context) {
            const _super = Object.create(null, {
                runAction: { get: () => super.runAction }
            });
            return __awaiter(this, void 0, void 0, function* () {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: action.id, from: 'message' });
                // Run and make sure to notify on any error again
                try {
                    yield _super.runAction.call(this, action, context);
                }
                catch (error) {
                    this.notificationService.error(error);
                }
            });
        }
    };
    NotificationActionRunner = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService)
    ], NotificationActionRunner);
    exports.NotificationActionRunner = NotificationActionRunner;
});
//# sourceMappingURL=notificationsActions.js.map