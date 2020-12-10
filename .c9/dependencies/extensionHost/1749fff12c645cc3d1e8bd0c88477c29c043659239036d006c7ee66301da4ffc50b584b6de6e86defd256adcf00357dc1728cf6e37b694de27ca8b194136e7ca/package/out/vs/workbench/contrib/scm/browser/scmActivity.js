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
define(["require", "exports", "vs/nls", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/contrib/scm/common/scm", "vs/workbench/services/activity/common/activity", "vs/platform/contextkey/common/contextkey", "vs/platform/statusbar/common/statusbar", "vs/workbench/services/editor/common/editorService", "vs/base/common/strings", "vs/platform/configuration/common/configuration"], function (require, exports, nls_1, resources_1, lifecycle_1, event_1, scm_1, activity_1, contextkey_1, statusbar_1, editorService_1, strings_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getCount(repository) {
        if (typeof repository.provider.count === 'number') {
            return repository.provider.count;
        }
        else {
            return repository.provider.groups.elements.reduce((r, g) => r + g.elements.length, 0);
        }
    }
    let SCMStatusController = class SCMStatusController {
        constructor(scmService, statusbarService, contextKeyService, activityService, editorService, configurationService) {
            this.scmService = scmService;
            this.statusbarService = statusbarService;
            this.contextKeyService = contextKeyService;
            this.activityService = activityService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.statusBarDisposable = lifecycle_1.Disposable.None;
            this.focusDisposable = lifecycle_1.Disposable.None;
            this.focusedRepository = undefined;
            this.badgeDisposable = new lifecycle_1.MutableDisposable();
            this.disposables = [];
            this.focusedProviderContextKey = contextKeyService.createKey('scmProvider', undefined);
            this.scmService.onDidAddRepository(this.onDidAddRepository, this, this.disposables);
            const onDidChangeSCMCountBadge = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.countBadge'));
            onDidChangeSCMCountBadge(this.renderActivityCount, this, this.disposables);
            for (const repository of this.scmService.repositories) {
                this.onDidAddRepository(repository);
            }
            editorService.onDidActiveEditorChange(this.onDidActiveEditorChange, this, this.disposables);
            this.renderActivityCount();
        }
        onDidActiveEditorChange() {
            if (!this.editorService.activeEditor) {
                return;
            }
            const resource = this.editorService.activeEditor.getResource();
            if (!resource || resource.scheme !== 'file') {
                return;
            }
            let bestRepository = null;
            let bestMatchLength = Number.NEGATIVE_INFINITY;
            for (const repository of this.scmService.repositories) {
                const root = repository.provider.rootUri;
                if (!root) {
                    continue;
                }
                const rootFSPath = root.fsPath;
                const prefixLength = strings_1.commonPrefixLength(rootFSPath, resource.fsPath);
                if (prefixLength === rootFSPath.length && prefixLength > bestMatchLength) {
                    bestRepository = repository;
                    bestMatchLength = prefixLength;
                }
            }
            if (bestRepository) {
                this.onDidFocusRepository(bestRepository);
            }
        }
        onDidAddRepository(repository) {
            const focusDisposable = repository.onDidFocus(() => this.onDidFocusRepository(repository));
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            const changeDisposable = onDidChange(() => this.renderActivityCount());
            const onDidRemove = event_1.Event.filter(this.scmService.onDidRemoveRepository, e => e === repository);
            const removeDisposable = onDidRemove(() => {
                disposable.dispose();
                this.disposables = this.disposables.filter(d => d !== removeDisposable);
                if (this.scmService.repositories.length === 0) {
                    this.onDidFocusRepository(undefined);
                }
                else if (this.focusedRepository === repository) {
                    this.scmService.repositories[0].focus();
                }
                this.renderActivityCount();
            });
            const disposable = lifecycle_1.combinedDisposable(focusDisposable, changeDisposable, removeDisposable);
            this.disposables.push(disposable);
            if (!this.focusedRepository) {
                this.onDidFocusRepository(repository);
            }
        }
        onDidFocusRepository(repository) {
            if (this.focusedRepository === repository) {
                return;
            }
            this.focusedRepository = repository;
            this.focusedProviderContextKey.set(repository && repository.provider.id);
            this.focusDisposable.dispose();
            if (repository && repository.provider.onDidChangeStatusBarCommands) {
                this.focusDisposable = repository.provider.onDidChangeStatusBarCommands(() => this.renderStatusBar(repository));
            }
            this.renderStatusBar(repository);
            this.renderActivityCount();
        }
        renderStatusBar(repository) {
            this.statusBarDisposable.dispose();
            if (!repository) {
                return;
            }
            const commands = repository.provider.statusBarCommands || [];
            const label = repository.provider.rootUri
                ? `${resources_1.basename(repository.provider.rootUri)} (${repository.provider.label})`
                : repository.provider.label;
            const disposables = new lifecycle_1.DisposableStore();
            for (const c of commands) {
                disposables.add(this.statusbarService.addEntry({
                    text: c.title,
                    tooltip: `${label} - ${c.tooltip}`,
                    command: c.id,
                    arguments: c.arguments
                }, 'status.scm', nls_1.localize('status.scm', "Source Control"), 0 /* LEFT */, 10000));
            }
            this.statusBarDisposable = disposables;
        }
        renderActivityCount() {
            this.badgeDisposable.clear();
            const countBadgeType = this.configurationService.getValue('scm.countBadge');
            let count = 0;
            if (countBadgeType === 'all') {
                count = this.scmService.repositories.reduce((r, repository) => r + getCount(repository), 0);
            }
            else if (countBadgeType === 'focused' && this.focusedRepository) {
                count = getCount(this.focusedRepository);
            }
            if (count > 0) {
                const badge = new activity_1.NumberBadge(count, num => nls_1.localize('scmPendingChangesBadge', '{0} pending changes', num));
                this.badgeDisposable.value = this.activityService.showActivity(scm_1.VIEWLET_ID, badge, 'scm-viewlet-label');
            }
            else {
                this.badgeDisposable.clear();
            }
        }
        dispose() {
            this.focusDisposable.dispose();
            this.statusBarDisposable.dispose();
            this.badgeDisposable.dispose();
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    };
    SCMStatusController = __decorate([
        __param(0, scm_1.ISCMService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, activity_1.IActivityService),
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService)
    ], SCMStatusController);
    exports.SCMStatusController = SCMStatusController;
});
//# sourceMappingURL=scmActivity.js.map