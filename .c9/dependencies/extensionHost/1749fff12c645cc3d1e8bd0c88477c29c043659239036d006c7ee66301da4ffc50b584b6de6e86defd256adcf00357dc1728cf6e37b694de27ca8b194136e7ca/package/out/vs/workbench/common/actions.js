/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey"], function (require, exports, platform_1, keybindingsRegistry_1, commands_1, actions_1, instantiation_1, lifecycle_1, lifecycle_2, notification_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = {
        WorkbenchActions: 'workbench.contributions.actions'
    };
    platform_1.Registry.add(exports.Extensions.WorkbenchActions, new class {
        registerWorkbenchAction(descriptor, alias, category, when) {
            return this.registerWorkbenchCommandFromAction(descriptor, alias, category, when);
        }
        registerWorkbenchCommandFromAction(descriptor, alias, category, when) {
            const registrations = new lifecycle_1.DisposableStore();
            // command
            registrations.add(commands_1.CommandsRegistry.registerCommand(descriptor.id, this.createCommandHandler(descriptor)));
            // keybinding
            const weight = (typeof descriptor.keybindingWeight === 'undefined' ? 200 /* WorkbenchContrib */ : descriptor.keybindingWeight);
            const keybindings = descriptor.keybindings;
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: descriptor.id,
                weight: weight,
                when: (descriptor.keybindingContext || when ? contextkey_1.ContextKeyExpr.and(descriptor.keybindingContext, when) : null),
                primary: keybindings ? keybindings.primary : 0,
                secondary: keybindings && keybindings.secondary,
                win: keybindings && keybindings.win,
                mac: keybindings && keybindings.mac,
                linux: keybindings && keybindings.linux
            });
            // menu item
            // TODO@Rob slightly weird if-check required because of
            // https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/contrib/search/electron-browser/search.contribution.ts#L266
            if (descriptor.label) {
                let idx = alias.indexOf(': ');
                let categoryOriginal = '';
                if (idx > 0) {
                    categoryOriginal = alias.substr(0, idx);
                    alias = alias.substr(idx + 2);
                }
                const command = {
                    id: descriptor.id,
                    title: { value: descriptor.label, original: alias },
                    category: category ? { value: category, original: categoryOriginal } : undefined
                };
                actions_1.MenuRegistry.addCommand(command);
                registrations.add(actions_1.MenuRegistry.appendMenuItem(0 /* CommandPalette */, { command, when }));
            }
            // TODO@alex,joh
            // support removal of keybinding rule
            // support removal of command-ui
            return registrations;
        }
        createCommandHandler(descriptor) {
            return (accessor, args) => __awaiter(this, void 0, void 0, function* () {
                const notificationService = accessor.get(notification_1.INotificationService);
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const lifecycleService = accessor.get(lifecycle_2.ILifecycleService);
                try {
                    yield this.triggerAndDisposeAction(instantiationService, lifecycleService, descriptor, args);
                }
                catch (error) {
                    notificationService.error(error);
                }
            });
        }
        triggerAndDisposeAction(instantiationService, lifecycleService, descriptor, args) {
            return __awaiter(this, void 0, void 0, function* () {
                // run action when workbench is created
                yield lifecycleService.when(2 /* Ready */);
                const actionInstance = instantiationService.createInstance(descriptor.syncDescriptor);
                actionInstance.label = descriptor.label || actionInstance.label;
                // don't run the action when not enabled
                if (!actionInstance.enabled) {
                    actionInstance.dispose();
                    return;
                }
                // otherwise run and dispose
                try {
                    const from = args && args.from || 'keybinding';
                    yield actionInstance.run(undefined, { from });
                }
                finally {
                    actionInstance.dispose();
                }
            });
        }
    });
});
//# sourceMappingURL=actions.js.map