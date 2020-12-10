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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/browser/parts/notifications/notificationsList", "vs/base/common/event", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/common/theme", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/browser/parts/notifications/notificationsCommands", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/lifecycle/common/lifecycle", "vs/platform/windows/common/windows", "vs/base/common/async", "vs/css!./media/notificationsToasts"], function (require, exports, lifecycle_1, dom_1, instantiation_1, notificationsList_1, event_1, layoutService_1, theme_1, themeService_1, colorRegistry_1, editorGroupsService_1, notificationsCommands_1, contextkey_1, nls_1, notification_1, lifecycle_2, windows_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ToastVisibility;
    (function (ToastVisibility) {
        ToastVisibility[ToastVisibility["HIDDEN_OR_VISIBLE"] = 0] = "HIDDEN_OR_VISIBLE";
        ToastVisibility[ToastVisibility["HIDDEN"] = 1] = "HIDDEN";
        ToastVisibility[ToastVisibility["VISIBLE"] = 2] = "VISIBLE";
    })(ToastVisibility || (ToastVisibility = {}));
    let NotificationsToasts = class NotificationsToasts extends theme_1.Themable {
        constructor(container, model, instantiationService, layoutService, themeService, editorGroupService, contextKeyService, lifecycleService, windowService) {
            super(themeService);
            this.container = container;
            this.model = model;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.editorGroupService = editorGroupService;
            this.lifecycleService = lifecycleService;
            this.windowService = windowService;
            this.mapNotificationToToast = new Map();
            this.notificationsToastsVisibleContextKey = notificationsCommands_1.NotificationsToastsVisibleContext.bindTo(contextKeyService);
            this.registerListeners();
        }
        registerListeners() {
            // Layout
            this._register(this.layoutService.onLayout(dimension => this.layout(dimension)));
            // Delay some tasks until after we can show notifications
            this.onCanShowNotifications().then(() => {
                // Show toast for initial notifications if any
                this.model.notifications.forEach(notification => this.addToast(notification));
                // Update toasts on notification changes
                this._register(this.model.onDidNotificationChange(e => this.onDidNotificationChange(e)));
            });
        }
        onCanShowNotifications() {
            return __awaiter(this, void 0, void 0, function* () {
                // Wait for the running phase to ensure we can draw notifications properly
                yield this.lifecycleService.when(2 /* Ready */);
                // Push notificiations out until either workbench is restored
                // or some time has ellapsed to reduce pressure on the startup
                return Promise.race([
                    this.lifecycleService.when(3 /* Restored */),
                    async_1.timeout(2000)
                ]);
            });
        }
        onDidNotificationChange(e) {
            switch (e.kind) {
                case 0 /* ADD */:
                    return this.addToast(e.item);
                case 2 /* REMOVE */:
                    return this.removeToast(e.item);
            }
        }
        addToast(item) {
            if (this.isNotificationsCenterVisible) {
                return; // do not show toasts while notification center is visibles
            }
            if (item.silent) {
                return; // do not show toats for silenced notifications
            }
            // Lazily create toasts containers
            if (!this.notificationsToastsContainer) {
                this.notificationsToastsContainer = document.createElement('div');
                dom_1.addClass(this.notificationsToastsContainer, 'notifications-toasts');
                this.container.appendChild(this.notificationsToastsContainer);
            }
            // Make Visible
            dom_1.addClass(this.notificationsToastsContainer, 'visible');
            const itemDisposables = new lifecycle_1.DisposableStore();
            // Container
            const notificationToastContainer = document.createElement('div');
            dom_1.addClass(notificationToastContainer, 'notification-toast-container');
            const firstToast = this.notificationsToastsContainer.firstChild;
            if (firstToast) {
                this.notificationsToastsContainer.insertBefore(notificationToastContainer, firstToast); // always first
            }
            else {
                this.notificationsToastsContainer.appendChild(notificationToastContainer);
            }
            // Toast
            const notificationToast = document.createElement('div');
            dom_1.addClass(notificationToast, 'notification-toast');
            notificationToastContainer.appendChild(notificationToast);
            // Create toast with item and show
            const notificationList = this.instantiationService.createInstance(notificationsList_1.NotificationsList, notificationToast, {
                ariaLabel: nls_1.localize('notificationsToast', "Notification Toast"),
                verticalScrollMode: 2 /* Hidden */
            });
            itemDisposables.add(notificationList);
            const toast = { item, list: notificationList, container: notificationToastContainer, toast: notificationToast, toDispose: itemDisposables };
            this.mapNotificationToToast.set(item, toast);
            itemDisposables.add(lifecycle_1.toDisposable(() => {
                if (this.isVisible(toast)) {
                    this.notificationsToastsContainer.removeChild(toast.container);
                }
            }));
            // Make visible
            notificationList.show();
            // Layout lists
            const maxDimensions = this.computeMaxDimensions();
            this.layoutLists(maxDimensions.width);
            // Show notification
            notificationList.updateNotificationsList(0, 0, [item]);
            // Layout container: only after we show the notification to ensure that
            // the height computation takes the content of it into account!
            this.layoutContainer(maxDimensions.height);
            // Update when item height changes due to expansion
            itemDisposables.add(item.onDidExpansionChange(() => {
                notificationList.updateNotificationsList(0, 1, [item]);
            }));
            // Update when item height potentially changes due to label changes
            itemDisposables.add(item.onDidLabelChange(e => {
                if (!item.expanded) {
                    return; // dynamic height only applies to expanded notifications
                }
                if (e.kind === 2 /* ACTIONS */ || e.kind === 1 /* MESSAGE */) {
                    notificationList.updateNotificationsList(0, 1, [item]);
                }
            }));
            // Remove when item gets closed
            event_1.Event.once(item.onDidClose)(() => {
                this.removeToast(item);
            });
            // Automatically purge non-sticky notifications
            this.purgeNotification(item, notificationToastContainer, notificationList, itemDisposables);
            // Theming
            this.updateStyles();
            // Context Key
            this.notificationsToastsVisibleContextKey.set(true);
            // Animate in
            dom_1.addClass(notificationToast, 'notification-fade-in');
            itemDisposables.add(dom_1.addDisposableListener(notificationToast, 'transitionend', () => {
                dom_1.removeClass(notificationToast, 'notification-fade-in');
                dom_1.addClass(notificationToast, 'notification-fade-in-done');
            }));
        }
        purgeNotification(item, notificationToastContainer, notificationList, disposables) {
            // Track mouse over item
            let isMouseOverToast = false;
            disposables.add(dom_1.addDisposableListener(notificationToastContainer, dom_1.EventType.MOUSE_OVER, () => isMouseOverToast = true));
            disposables.add(dom_1.addDisposableListener(notificationToastContainer, dom_1.EventType.MOUSE_OUT, () => isMouseOverToast = false));
            // Install Timers to Purge Notification
            let purgeTimeoutHandle;
            let listener;
            const hideAfterTimeout = () => {
                purgeTimeoutHandle = setTimeout(() => {
                    // If the notification is sticky or prompting and the window does not have
                    // focus, we wait for the window to gain focus again before triggering
                    // the timeout again. This prevents an issue where focussing the window
                    // could immediately hide the notification because the timeout was triggered
                    // again.
                    if ((item.sticky || item.hasPrompt()) && !this.windowService.hasFocus) {
                        if (!listener) {
                            listener = this.windowService.onDidChangeFocus(focus => {
                                if (focus) {
                                    hideAfterTimeout();
                                }
                            });
                            disposables.add(listener);
                        }
                    }
                    // Otherwise...
                    else if (item.sticky || // never hide sticky notifications
                        notificationList.hasFocus() || // never hide notifications with focus
                        isMouseOverToast // never hide notifications under mouse
                    ) {
                        hideAfterTimeout();
                    }
                    else {
                        this.removeToast(item);
                    }
                }, NotificationsToasts.PURGE_TIMEOUT[item.severity]);
            };
            hideAfterTimeout();
            disposables.add(lifecycle_1.toDisposable(() => clearTimeout(purgeTimeoutHandle)));
        }
        removeToast(item) {
            const notificationToast = this.mapNotificationToToast.get(item);
            let focusGroup = false;
            if (notificationToast) {
                const toastHasDOMFocus = dom_1.isAncestor(document.activeElement, notificationToast.container);
                if (toastHasDOMFocus) {
                    focusGroup = !(this.focusNext() || this.focusPrevious()); // focus next if any, otherwise focus editor
                }
                // Listeners
                lifecycle_1.dispose(notificationToast.toDispose);
                // Remove from Map
                this.mapNotificationToToast.delete(item);
            }
            // Layout if we still have toasts
            if (this.mapNotificationToToast.size > 0) {
                this.layout(this.workbenchDimensions);
            }
            // Otherwise hide if no more toasts to show
            else {
                this.doHide();
                // Move focus back to editor group as needed
                if (focusGroup) {
                    this.editorGroupService.activeGroup.focus();
                }
            }
        }
        removeToasts() {
            this.mapNotificationToToast.forEach(toast => lifecycle_1.dispose(toast.toDispose));
            this.mapNotificationToToast.clear();
            this.doHide();
        }
        doHide() {
            if (this.notificationsToastsContainer) {
                dom_1.removeClass(this.notificationsToastsContainer, 'visible');
            }
            // Context Key
            this.notificationsToastsVisibleContextKey.set(false);
        }
        hide() {
            const focusGroup = dom_1.isAncestor(document.activeElement, this.notificationsToastsContainer);
            this.removeToasts();
            if (focusGroup) {
                this.editorGroupService.activeGroup.focus();
            }
        }
        focus() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            if (toasts.length > 0) {
                toasts[0].list.focusFirst();
                return true;
            }
            return false;
        }
        focusNext() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.list.hasFocus()) {
                    const nextToast = toasts[i + 1];
                    if (nextToast) {
                        nextToast.list.focusFirst();
                        return true;
                    }
                    break;
                }
            }
            return false;
        }
        focusPrevious() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            for (let i = 0; i < toasts.length; i++) {
                const toast = toasts[i];
                if (toast.list.hasFocus()) {
                    const previousToast = toasts[i - 1];
                    if (previousToast) {
                        previousToast.list.focusFirst();
                        return true;
                    }
                    break;
                }
            }
            return false;
        }
        focusFirst() {
            const toast = this.getToasts(ToastVisibility.VISIBLE)[0];
            if (toast) {
                toast.list.focusFirst();
                return true;
            }
            return false;
        }
        focusLast() {
            const toasts = this.getToasts(ToastVisibility.VISIBLE);
            if (toasts.length > 0) {
                toasts[toasts.length - 1].list.focusFirst();
                return true;
            }
            return false;
        }
        update(isCenterVisible) {
            if (this.isNotificationsCenterVisible !== isCenterVisible) {
                this.isNotificationsCenterVisible = isCenterVisible;
                // Hide all toasts when the notificationcenter gets visible
                if (this.isNotificationsCenterVisible) {
                    this.removeToasts();
                }
            }
        }
        updateStyles() {
            this.mapNotificationToToast.forEach(t => {
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                t.toast.style.boxShadow = widgetShadowColor ? `0 0px 8px ${widgetShadowColor}` : null;
                const borderColor = this.getColor(theme_1.NOTIFICATIONS_TOAST_BORDER);
                t.toast.style.border = borderColor ? `1px solid ${borderColor}` : null;
            });
        }
        getToasts(state) {
            const notificationToasts = [];
            this.mapNotificationToToast.forEach(toast => {
                switch (state) {
                    case ToastVisibility.HIDDEN_OR_VISIBLE:
                        notificationToasts.push(toast);
                        break;
                    case ToastVisibility.HIDDEN:
                        if (!this.isVisible(toast)) {
                            notificationToasts.push(toast);
                        }
                        break;
                    case ToastVisibility.VISIBLE:
                        if (this.isVisible(toast)) {
                            notificationToasts.push(toast);
                        }
                        break;
                }
            });
            return notificationToasts.reverse(); // from newest to oldest
        }
        layout(dimension) {
            this.workbenchDimensions = dimension;
            const maxDimensions = this.computeMaxDimensions();
            // Hide toasts that exceed height
            if (maxDimensions.height) {
                this.layoutContainer(maxDimensions.height);
            }
            // Layout all lists of toasts
            this.layoutLists(maxDimensions.width);
        }
        computeMaxDimensions() {
            let maxWidth = NotificationsToasts.MAX_WIDTH;
            let availableWidth = maxWidth;
            let availableHeight;
            if (this.workbenchDimensions) {
                // Make sure notifications are not exceding available width
                availableWidth = this.workbenchDimensions.width;
                availableWidth -= (2 * 8); // adjust for paddings left and right
                // Make sure notifications are not exceeding available height
                availableHeight = this.workbenchDimensions.height;
                if (this.layoutService.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */)) {
                    availableHeight -= 22; // adjust for status bar
                }
                if (this.layoutService.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */)) {
                    availableHeight -= 22; // adjust for title bar
                }
                availableHeight -= (2 * 12); // adjust for paddings top and bottom
            }
            availableHeight = typeof availableHeight === 'number'
                ? Math.round(availableHeight * 0.618) // try to not cover the full height for stacked toasts
                : 0;
            return new dom_1.Dimension(Math.min(maxWidth, availableWidth), availableHeight);
        }
        layoutLists(width) {
            this.mapNotificationToToast.forEach(toast => toast.list.layout(width));
        }
        layoutContainer(heightToGive) {
            let visibleToasts = 0;
            this.getToasts(ToastVisibility.HIDDEN_OR_VISIBLE).forEach(toast => {
                // In order to measure the client height, the element cannot have display: none
                toast.container.style.opacity = '0';
                this.setVisibility(toast, true);
                heightToGive -= toast.container.offsetHeight;
                let makeVisible = false;
                if (visibleToasts === NotificationsToasts.MAX_NOTIFICATIONS) {
                    makeVisible = false; // never show more than MAX_NOTIFICATIONS
                }
                else if (heightToGive >= 0) {
                    makeVisible = true; // hide toast if available height is too little
                }
                // Hide or show toast based on context
                this.setVisibility(toast, makeVisible);
                toast.container.style.opacity = null;
                if (makeVisible) {
                    visibleToasts++;
                }
            });
        }
        setVisibility(toast, visible) {
            if (this.isVisible(toast) === visible) {
                return;
            }
            if (visible) {
                this.notificationsToastsContainer.appendChild(toast.container);
            }
            else {
                this.notificationsToastsContainer.removeChild(toast.container);
            }
        }
        isVisible(toast) {
            return !!toast.container.parentElement;
        }
    };
    NotificationsToasts.MAX_WIDTH = 450;
    NotificationsToasts.MAX_NOTIFICATIONS = 3;
    NotificationsToasts.PURGE_TIMEOUT = (() => {
        const intervals = Object.create(null);
        intervals[notification_1.Severity.Info] = 15000;
        intervals[notification_1.Severity.Warning] = 18000;
        intervals[notification_1.Severity.Error] = 20000;
        return intervals;
    })();
    NotificationsToasts = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, themeService_1.IThemeService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, lifecycle_2.ILifecycleService),
        __param(8, windows_1.IWindowService)
    ], NotificationsToasts);
    exports.NotificationsToasts = NotificationsToasts;
});
//# sourceMappingURL=notificationsToasts.js.map