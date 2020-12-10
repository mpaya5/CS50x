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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/browser/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/workbench/browser/parts/views/panelViewlet", "vs/base/browser/dom", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/scm/common/scm", "vs/workbench/browser/labels", "vs/base/browser/ui/countBadge/countBadge", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/base/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "./scmMenus", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/themeService", "./scmUtil", "vs/platform/theme/common/styler", "vs/platform/storage/common/storage", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/octiconLabel/octiconLabel", "vs/base/common/strings", "vs/base/common/arrays", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/platform/notification/common/notification", "vs/workbench/services/layout/browser/layoutService", "vs/base/common/platform", "vs/workbench/browser/parts/views/viewsViewlet", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/base/common/process", "vs/css!./media/scmViewlet"], function (require, exports, nls_1, event_1, event_2, resources_1, lifecycle_1, panelViewlet_1, dom_1, telemetry_1, scm_1, labels_1, countBadge_1, editorService_1, instantiation_1, contextView_1, contextkey_1, commands_1, keybinding_1, actions_1, actions_2, menuEntryActionViewItem_1, scmMenus_1, actionbar_1, themeService_1, scmUtil_1, styler_1, storage_1, inputBox_1, octiconLabel_1, strings_1, arrays_1, listService_1, configuration_1, async_1, notification_1, layoutService_1, platform, viewsViewlet_1, extensions_1, workspace_1, views_1, platform_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ProvidersListDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            return 'provider';
        }
    }
    class StatusBarAction extends actions_2.Action {
        constructor(command, commandService) {
            super(`statusbaraction{${command.id}}`, command.title, '', true);
            this.command = command;
            this.commandService = commandService;
            this.tooltip = command.tooltip || '';
        }
        run() {
            return this.commandService.executeCommand(this.command.id, ...(this.command.arguments || []));
        }
    }
    class StatusBarActionViewItem extends actionbar_1.ActionViewItem {
        constructor(action) {
            super(null, action, {});
        }
        updateLabel() {
            if (this.options.label) {
                this.label.innerHTML = octiconLabel_1.renderOcticons(this.getAction().label);
            }
        }
    }
    function connectPrimaryMenuToInlineActionBar(menu, actionBar) {
        let cachedDisposable = lifecycle_1.Disposable.None;
        let cachedPrimary = [];
        const updateActions = () => {
            const primary = [];
            const secondary = [];
            const disposable = menuEntryActionViewItem_1.createAndFillInActionBarActions(menu, { shouldForwardArgs: true }, { primary, secondary }, g => /^inline/.test(g));
            if (arrays_1.equals(cachedPrimary, primary, (a, b) => a.id === b.id)) {
                disposable.dispose();
                return;
            }
            cachedDisposable = disposable;
            cachedPrimary = primary;
            actionBar.clear();
            actionBar.push(primary, { icon: true, label: false });
        };
        updateActions();
        return lifecycle_1.combinedDisposable(menu.onDidChange(updateActions), lifecycle_1.toDisposable(() => {
            cachedDisposable.dispose();
        }));
    }
    let ProviderRenderer = class ProviderRenderer {
        constructor(commandService, themeService) {
            this.commandService = commandService;
            this.themeService = themeService;
            this.templateId = 'provider';
            this._onDidRenderElement = new event_1.Emitter();
            this.onDidRenderElement = this._onDidRenderElement.event;
        }
        renderTemplate(container) {
            const provider = dom_1.append(container, dom_1.$('.scm-provider'));
            const name = dom_1.append(provider, dom_1.$('.name'));
            const title = dom_1.append(name, dom_1.$('span.title'));
            const type = dom_1.append(name, dom_1.$('span.type'));
            const countContainer = dom_1.append(provider, dom_1.$('.count'));
            const count = new countBadge_1.CountBadge(countContainer);
            const badgeStyler = styler_1.attachBadgeStyler(count, this.themeService);
            const actionBar = new actionbar_1.ActionBar(provider, { actionViewItemProvider: a => new StatusBarActionViewItem(a) });
            const disposable = lifecycle_1.Disposable.None;
            const templateDisposable = lifecycle_1.combinedDisposable(actionBar, badgeStyler);
            return { title, type, countContainer, count, actionBar, disposable, templateDisposable };
        }
        renderElement(repository, index, templateData) {
            templateData.disposable.dispose();
            const disposables = new lifecycle_1.DisposableStore();
            if (repository.provider.rootUri) {
                templateData.title.textContent = resources_1.basename(repository.provider.rootUri);
                templateData.type.textContent = repository.provider.label;
            }
            else {
                templateData.title.textContent = repository.provider.label;
                templateData.type.textContent = '';
            }
            const actions = [];
            const disposeActions = () => lifecycle_1.dispose(actions);
            disposables.add({ dispose: disposeActions });
            const update = () => {
                disposeActions();
                const commands = repository.provider.statusBarCommands || [];
                actions.splice(0, actions.length, ...commands.map(c => new StatusBarAction(c, this.commandService)));
                templateData.actionBar.clear();
                templateData.actionBar.push(actions);
                const count = repository.provider.count || 0;
                dom_1.toggleClass(templateData.countContainer, 'hidden', count === 0);
                templateData.count.setCount(count);
                this._onDidRenderElement.fire(repository);
            };
            disposables.add(repository.provider.onDidChange(update, null));
            update();
            templateData.disposable = disposables;
        }
        disposeTemplate(templateData) {
            templateData.disposable.dispose();
            templateData.templateDisposable.dispose();
        }
    };
    ProviderRenderer = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, themeService_1.IThemeService)
    ], ProviderRenderer);
    let MainPanel = class MainPanel extends panelViewlet_1.ViewletPanel {
        constructor(viewModel, options, keybindingService, contextMenuService, scmService, instantiationService, contextKeyService, menuService, configurationService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService);
            this.viewModel = viewModel;
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.scmService = scmService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        renderBody(container) {
            const delegate = new ProvidersListDelegate();
            const renderer = this.instantiationService.createInstance(ProviderRenderer);
            const identityProvider = { getId: (r) => r.provider.id };
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, container, delegate, [renderer], {
                identityProvider,
                horizontalScrolling: false
            });
            this._register(renderer.onDidRenderElement(e => this.list.updateWidth(this.viewModel.repositories.indexOf(e)), null));
            this._register(this.list.onSelectionChange(this.onListSelectionChange, this));
            this._register(this.list.onFocusChange(this.onListFocusChange, this));
            this._register(this.list.onContextMenu(this.onListContextMenu, this));
            this._register(this.viewModel.onDidChangeVisibleRepositories(this.updateListSelection, this));
            this._register(this.viewModel.onDidSplice(({ index, deleteCount, elements }) => this.splice(index, deleteCount, elements), null));
            this.splice(0, 0, this.viewModel.repositories);
            this._register(this.list);
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('scm.providers.visible')) {
                    this.updateBodySize();
                }
            }));
            this.updateListSelection();
        }
        splice(index, deleteCount, repositories = []) {
            this.list.splice(index, deleteCount, repositories);
            const empty = this.list.length === 0;
            dom_1.toggleClass(this.element, 'empty', empty);
            this.updateBodySize();
        }
        layoutBody(height, width) {
            this.list.layout(height, width);
        }
        updateBodySize() {
            const visibleCount = this.configurationService.getValue('scm.providers.visible');
            const empty = this.list.length === 0;
            const size = Math.min(this.viewModel.repositories.length, visibleCount) * 22;
            this.minimumBodySize = visibleCount === 0 ? 22 : size;
            this.maximumBodySize = visibleCount === 0 ? Number.POSITIVE_INFINITY : empty ? Number.POSITIVE_INFINITY : size;
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const repository = e.element;
            const contextKeyService = this.contextKeyService.createScoped();
            const scmProviderKey = contextKeyService.createKey('scmProvider', undefined);
            scmProviderKey.set(repository.provider.contextValue);
            const menu = this.menuService.createMenu(32 /* SCMSourceControl */, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            const disposable = menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => g === 'inline');
            menu.dispose();
            contextKeyService.dispose();
            if (secondary.length === 0) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => secondary,
                getActionsContext: () => repository.provider
            });
            disposable.dispose();
        }
        onListSelectionChange(e) {
            if (e.browserEvent && e.elements.length > 0) {
                const scrollTop = this.list.scrollTop;
                this.viewModel.setVisibleRepositories(e.elements);
                this.list.scrollTop = scrollTop;
            }
        }
        onListFocusChange(e) {
            if (e.browserEvent && e.elements.length > 0) {
                e.elements[0].focus();
            }
        }
        updateListSelection() {
            const set = new Set();
            for (const repository of this.viewModel.visibleRepositories) {
                set.add(repository);
            }
            const selection = [];
            for (let i = 0; i < this.list.length; i++) {
                if (set.has(this.list.element(i))) {
                    selection.push(i);
                }
            }
            this.list.setSelection(selection);
            if (selection.length > 0) {
                this.list.setFocus([selection[0]]);
            }
        }
    };
    MainPanel.ID = 'scm.mainPanel';
    MainPanel.TITLE = nls_1.localize('scm providers', "Source Control Providers");
    MainPanel = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, scm_1.ISCMService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, actions_1.IMenuService),
        __param(8, configuration_1.IConfigurationService)
    ], MainPanel);
    exports.MainPanel = MainPanel;
    class ResourceGroupRenderer {
        constructor(actionViewItemProvider, themeService, menus) {
            this.actionViewItemProvider = actionViewItemProvider;
            this.themeService = themeService;
            this.menus = menus;
        }
        get templateId() { return ResourceGroupRenderer.TEMPLATE_ID; }
        renderTemplate(container) {
            const element = dom_1.append(container, dom_1.$('.resource-group'));
            const name = dom_1.append(element, dom_1.$('.name'));
            const actionsContainer = dom_1.append(element, dom_1.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, { actionViewItemProvider: this.actionViewItemProvider });
            const countContainer = dom_1.append(element, dom_1.$('.count'));
            const count = new countBadge_1.CountBadge(countContainer);
            const styler = styler_1.attachBadgeStyler(count, this.themeService);
            const elementDisposable = lifecycle_1.Disposable.None;
            return {
                name, count, actionBar, elementDisposable, dispose: () => {
                    actionBar.dispose();
                    styler.dispose();
                }
            };
        }
        renderElement(group, index, template) {
            template.elementDisposable.dispose();
            template.name.textContent = group.label;
            template.actionBar.clear();
            template.actionBar.context = group;
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(connectPrimaryMenuToInlineActionBar(this.menus.getResourceGroupMenu(group), template.actionBar));
            const updateCount = () => template.count.setCount(group.elements.length);
            disposables.add(group.onDidSplice(updateCount, null));
            updateCount();
            template.elementDisposable = disposables;
        }
        disposeElement(group, index, template) {
            template.elementDisposable.dispose();
        }
        disposeTemplate(template) {
            template.dispose();
        }
    }
    ResourceGroupRenderer.TEMPLATE_ID = 'resource group';
    class MultipleSelectionActionRunner extends actions_2.ActionRunner {
        constructor(getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
        }
        runAction(action, context) {
            if (action instanceof actions_1.MenuItemAction) {
                const selection = this.getSelectedResources();
                const filteredSelection = selection.filter(s => s !== context);
                if (selection.length === filteredSelection.length || selection.length === 1) {
                    return action.run(context);
                }
                return action.run(context, ...filteredSelection);
            }
            return super.runAction(action, context);
        }
    }
    class ResourceRenderer {
        constructor(labels, actionViewItemProvider, getSelectedResources, themeService, menus) {
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.getSelectedResources = getSelectedResources;
            this.themeService = themeService;
            this.menus = menus;
        }
        get templateId() { return ResourceRenderer.TEMPLATE_ID; }
        renderTemplate(container) {
            const element = dom_1.append(container, dom_1.$('.resource'));
            const name = dom_1.append(element, dom_1.$('.name'));
            const fileLabel = this.labels.create(name);
            const actionsContainer = dom_1.append(fileLabel.element, dom_1.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider,
                actionRunner: new MultipleSelectionActionRunner(this.getSelectedResources)
            });
            const decorationIcon = dom_1.append(element, dom_1.$('.decoration-icon'));
            return {
                element, name, fileLabel, decorationIcon, actionBar, elementDisposable: lifecycle_1.Disposable.None, dispose: () => {
                    actionBar.dispose();
                    fileLabel.dispose();
                }
            };
        }
        renderElement(resource, index, template) {
            template.elementDisposable.dispose();
            const theme = this.themeService.getTheme();
            const icon = theme.type === themeService_1.LIGHT ? resource.decorations.icon : resource.decorations.iconDark;
            template.fileLabel.setFile(resource.sourceUri, { fileDecorations: { colors: false, badges: !icon, data: resource.decorations } });
            template.actionBar.clear();
            template.actionBar.context = resource;
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(connectPrimaryMenuToInlineActionBar(this.menus.getResourceMenu(resource.resourceGroup), template.actionBar));
            dom_1.toggleClass(template.name, 'strike-through', resource.decorations.strikeThrough);
            dom_1.toggleClass(template.element, 'faded', resource.decorations.faded);
            if (icon) {
                template.decorationIcon.style.display = '';
                template.decorationIcon.style.backgroundImage = `url('${icon}')`;
                template.decorationIcon.title = resource.decorations.tooltip || '';
            }
            else {
                template.decorationIcon.style.display = 'none';
                template.decorationIcon.style.backgroundImage = '';
            }
            template.element.setAttribute('data-tooltip', resource.decorations.tooltip || '');
            template.elementDisposable = disposables;
        }
        disposeElement(resource, index, template) {
            template.elementDisposable.dispose();
        }
        disposeTemplate(template) {
            template.elementDisposable.dispose();
            template.dispose();
        }
    }
    ResourceRenderer.TEMPLATE_ID = 'resource';
    class ProviderListDelegate {
        getHeight() { return 22; }
        getTemplateId(element) {
            return scmUtil_1.isSCMResource(element) ? ResourceRenderer.TEMPLATE_ID : ResourceGroupRenderer.TEMPLATE_ID;
        }
    }
    const scmResourceIdentityProvider = new class {
        getId(r) {
            if (scmUtil_1.isSCMResource(r)) {
                const group = r.resourceGroup;
                const provider = group.provider;
                return `${provider.contextValue}/${group.id}/${r.sourceUri.toString()}`;
            }
            else {
                const provider = r.provider;
                return `${provider.contextValue}/${r.id}`;
            }
        }
    };
    const scmKeyboardNavigationLabelProvider = new class {
        getKeyboardNavigationLabel(e) {
            if (scmUtil_1.isSCMResource(e)) {
                return resources_1.basename(e.sourceUri);
            }
            else {
                return e.label;
            }
        }
    };
    function isGroupVisible(group) {
        return group.elements.length > 0 || !group.hideWhenEmpty;
    }
    class ResourceGroupSplicer {
        constructor(groupSequence, spliceable) {
            this.spliceable = spliceable;
            this.items = [];
            this.disposables = [];
            groupSequence.onDidSplice(this.onDidSpliceGroups, this, this.disposables);
            this.onDidSpliceGroups({ start: 0, deleteCount: 0, toInsert: groupSequence.elements });
        }
        onDidSpliceGroups({ start, deleteCount, toInsert }) {
            let absoluteStart = 0;
            for (let i = 0; i < start; i++) {
                const item = this.items[i];
                absoluteStart += (item.visible ? 1 : 0) + item.group.elements.length;
            }
            let absoluteDeleteCount = 0;
            for (let i = 0; i < deleteCount; i++) {
                const item = this.items[start + i];
                absoluteDeleteCount += (item.visible ? 1 : 0) + item.group.elements.length;
            }
            const itemsToInsert = [];
            const absoluteToInsert = [];
            for (const group of toInsert) {
                const visible = isGroupVisible(group);
                if (visible) {
                    absoluteToInsert.push(group);
                }
                for (const element of group.elements) {
                    absoluteToInsert.push(element);
                }
                const disposable = lifecycle_1.combinedDisposable(group.onDidChange(() => this.onDidChangeGroup(group)), group.onDidSplice(splice => this.onDidSpliceGroup(group, splice)));
                itemsToInsert.push({ group, visible, disposable });
            }
            const itemsToDispose = this.items.splice(start, deleteCount, ...itemsToInsert);
            for (const item of itemsToDispose) {
                item.disposable.dispose();
            }
            this.spliceable.splice(absoluteStart, absoluteDeleteCount, absoluteToInsert);
        }
        onDidChangeGroup(group) {
            const itemIndex = arrays_1.firstIndex(this.items, item => item.group === group);
            if (itemIndex < 0) {
                return;
            }
            const item = this.items[itemIndex];
            const visible = isGroupVisible(group);
            if (item.visible === visible) {
                return;
            }
            let absoluteStart = 0;
            for (let i = 0; i < itemIndex; i++) {
                const item = this.items[i];
                absoluteStart += (item.visible ? 1 : 0) + item.group.elements.length;
            }
            if (visible) {
                this.spliceable.splice(absoluteStart, 0, [group, ...group.elements]);
            }
            else {
                this.spliceable.splice(absoluteStart, 1 + group.elements.length, []);
            }
            item.visible = visible;
        }
        onDidSpliceGroup(group, { start, deleteCount, toInsert }) {
            const itemIndex = arrays_1.firstIndex(this.items, item => item.group === group);
            if (itemIndex < 0) {
                return;
            }
            const item = this.items[itemIndex];
            const visible = isGroupVisible(group);
            if (!item.visible && !visible) {
                return;
            }
            let absoluteStart = start;
            for (let i = 0; i < itemIndex; i++) {
                const item = this.items[i];
                absoluteStart += (item.visible ? 1 : 0) + item.group.elements.length;
            }
            if (item.visible && !visible) {
                this.spliceable.splice(absoluteStart, 1 + deleteCount, toInsert);
            }
            else if (!item.visible && visible) {
                this.spliceable.splice(absoluteStart, deleteCount, [group, ...toInsert]);
            }
            else {
                this.spliceable.splice(absoluteStart + 1, deleteCount, toInsert);
            }
            item.visible = visible;
        }
        dispose() {
            this.onDidSpliceGroups({ start: 0, deleteCount: this.items.length, toInsert: [] });
            this.disposables = lifecycle_1.dispose(this.disposables);
        }
    }
    function convertValidationType(type) {
        switch (type) {
            case 2 /* Information */: return 1 /* INFO */;
            case 1 /* Warning */: return 2 /* WARNING */;
            case 0 /* Error */: return 3 /* ERROR */;
        }
    }
    let RepositoryPanel = class RepositoryPanel extends panelViewlet_1.ViewletPanel {
        constructor(repository, viewModel, options, keybindingService, themeService, contextMenuService, contextViewService, commandService, notificationService, editorService, instantiationService, configurationService, contextKeyService, menuService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService);
            this.repository = repository;
            this.viewModel = viewModel;
            this.keybindingService = keybindingService;
            this.themeService = themeService;
            this.contextMenuService = contextMenuService;
            this.contextViewService = contextViewService;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.menuService = menuService;
            this.cachedHeight = undefined;
            this.cachedWidth = undefined;
            this.cachedScrollTop = undefined;
            this.visibilityDisposables = [];
            this.menus = instantiationService.createInstance(scmMenus_1.SCMMenus, this.repository.provider);
            this._register(this.menus);
            this._register(this.menus.onDidChangeTitle(this._onDidChangeTitleArea.fire, this._onDidChangeTitleArea));
            this.contextKeyService = contextKeyService.createScoped(this.element);
            this.contextKeyService.createKey('scmRepository', this.repository);
        }
        render() {
            super.render();
            this._register(this.menus.onDidChangeTitle(this.updateActions, this));
        }
        renderHeaderTitle(container) {
            let title;
            let type;
            if (this.repository.provider.rootUri) {
                title = resources_1.basename(this.repository.provider.rootUri);
                type = this.repository.provider.label;
            }
            else {
                title = this.repository.provider.label;
                type = '';
            }
            super.renderHeaderTitle(container, title);
            dom_1.addClass(container, 'scm-provider');
            dom_1.append(container, dom_1.$('span.type', undefined, type));
        }
        renderBody(container) {
            const focusTracker = dom_1.trackFocus(container);
            this._register(focusTracker.onDidFocus(() => this.repository.focus()));
            this._register(focusTracker);
            // Input
            this.inputBoxContainer = dom_1.append(container, dom_1.$('.scm-editor'));
            const updatePlaceholder = () => {
                const binding = this.keybindingService.lookupKeybinding('scm.acceptInput');
                const label = binding ? binding.getLabel() : (platform.isMacintosh ? 'Cmd+Enter' : 'Ctrl+Enter');
                const placeholder = strings_1.format(this.repository.input.placeholder, label);
                this.inputBox.setPlaceHolder(placeholder);
            };
            const validationDelayer = new async_1.ThrottledDelayer(200);
            const validate = () => {
                return this.repository.input.validateInput(this.inputBox.value, this.inputBox.inputElement.selectionStart || 0).then(result => {
                    if (!result) {
                        this.inputBox.inputElement.removeAttribute('aria-invalid');
                        this.inputBox.hideMessage();
                    }
                    else {
                        this.inputBox.inputElement.setAttribute('aria-invalid', 'true');
                        this.inputBox.showMessage({ content: result.message, type: convertValidationType(result.type) });
                    }
                });
            };
            const triggerValidation = () => validationDelayer.trigger(validate);
            this.inputBox = new inputBox_1.InputBox(this.inputBoxContainer, this.contextViewService, { flexibleHeight: true, flexibleMaxHeight: 134 });
            this.inputBox.setEnabled(this.isBodyVisible());
            this._register(styler_1.attachInputBoxStyler(this.inputBox, this.themeService));
            this._register(this.inputBox);
            this._register(this.inputBox.onDidChange(triggerValidation, null));
            const onKeyUp = event_2.domEvent(this.inputBox.inputElement, 'keyup');
            const onMouseUp = event_2.domEvent(this.inputBox.inputElement, 'mouseup');
            this._register(event_1.Event.any(onKeyUp, onMouseUp)(triggerValidation, null));
            this.inputBox.value = this.repository.input.value;
            this._register(this.inputBox.onDidChange(value => this.repository.input.value = value, null));
            this._register(this.repository.input.onDidChange(value => this.inputBox.value = value, null));
            updatePlaceholder();
            this._register(this.repository.input.onDidChangePlaceholder(updatePlaceholder, null));
            this._register(this.keybindingService.onDidUpdateKeybindings(updatePlaceholder, null));
            this._register(this.inputBox.onDidHeightChange(() => this.layoutBody()));
            if (this.repository.provider.onDidChangeCommitTemplate) {
                this._register(this.repository.provider.onDidChangeCommitTemplate(this.updateInputBox, this));
            }
            this.updateInputBox();
            // Input box visibility
            this._register(this.repository.input.onDidChangeVisibility(this.updateInputBoxVisibility, this));
            this.updateInputBoxVisibility();
            // List
            this.listContainer = dom_1.append(container, dom_1.$('.scm-status.show-file-icons'));
            const updateActionsVisibility = () => dom_1.toggleClass(this.listContainer, 'show-actions', this.configurationService.getValue('scm.alwaysShowActions'));
            event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.alwaysShowActions'))(updateActionsVisibility);
            updateActionsVisibility();
            const delegate = new ProviderListDelegate();
            const actionViewItemProvider = (action) => this.getActionViewItem(action);
            this.listLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this._register(this.listLabels);
            const renderers = [
                new ResourceGroupRenderer(actionViewItemProvider, this.themeService, this.menus),
                new ResourceRenderer(this.listLabels, actionViewItemProvider, () => this.getSelectedResources(), this.themeService, this.menus)
            ];
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, this.listContainer, delegate, renderers, {
                identityProvider: scmResourceIdentityProvider,
                keyboardNavigationLabelProvider: scmKeyboardNavigationLabelProvider,
                horizontalScrolling: false
            });
            this._register(event_1.Event.chain(this.list.onDidOpen)
                .map(e => e.elements[0])
                .filter(e => !!e && scmUtil_1.isSCMResource(e))
                .on(this.open, this));
            this._register(event_1.Event.chain(this.list.onPin)
                .map(e => e.elements[0])
                .filter(e => !!e && scmUtil_1.isSCMResource(e))
                .on(this.pin, this));
            this._register(this.list.onContextMenu(this.onListContextMenu, this));
            this._register(this.list);
            this._register(this.viewModel.onDidChangeVisibility(this.onDidChangeVisibility, this));
            this.onDidChangeVisibility(this.viewModel.isVisible());
            this.onDidChangeBodyVisibility(visible => this.inputBox.setEnabled(visible));
        }
        onDidChangeVisibility(visible) {
            if (visible) {
                const listSplicer = new ResourceGroupSplicer(this.repository.provider.groups, this.list);
                this.visibilityDisposables.push(listSplicer);
            }
            else {
                this.cachedScrollTop = this.list.scrollTop;
                this.visibilityDisposables = lifecycle_1.dispose(this.visibilityDisposables);
            }
        }
        layoutBody(height = this.cachedHeight, width = this.cachedWidth) {
            if (height === undefined) {
                return;
            }
            this.cachedHeight = height;
            if (this.repository.input.visible) {
                dom_1.removeClass(this.inputBoxContainer, 'hidden');
                this.inputBox.layout();
                const editorHeight = this.inputBox.height;
                const listHeight = height - (editorHeight + 12 /* margin */);
                this.listContainer.style.height = `${listHeight}px`;
                this.list.layout(listHeight, width);
            }
            else {
                dom_1.addClass(this.inputBoxContainer, 'hidden');
                this.listContainer.style.height = `${height}px`;
                this.list.layout(height, width);
            }
            if (this.cachedScrollTop !== undefined && this.list.scrollTop !== this.cachedScrollTop) {
                this.list.scrollTop = Math.min(this.cachedScrollTop, this.list.scrollHeight);
                // Applying the cached scroll position just once until the next leave.
                // This, also, avoids the scrollbar to flicker when resizing the sidebar.
                this.cachedScrollTop = undefined;
            }
        }
        focus() {
            super.focus();
            if (this.isExpanded()) {
                if (this.repository.input.visible) {
                    this.inputBox.focus();
                }
                else {
                    this.list.domFocus();
                }
                this.repository.focus();
            }
        }
        getActions() {
            return this.menus.getTitleActions();
        }
        getSecondaryActions() {
            return this.menus.getTitleSecondaryActions();
        }
        getActionViewItem(action) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return undefined;
            }
            return new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
        }
        getActionsContext() {
            return this.repository.provider;
        }
        open(e) {
            e.open();
        }
        pin() {
            const activeControl = this.editorService.activeControl;
            if (activeControl) {
                activeControl.group.pinEditor(activeControl.input);
            }
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const element = e.element;
            let actions;
            if (scmUtil_1.isSCMResource(element)) {
                actions = this.menus.getResourceContextActions(element);
            }
            else {
                actions = this.menus.getResourceGroupContextActions(element);
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element,
                actionRunner: new MultipleSelectionActionRunner(() => this.getSelectedResources())
            });
        }
        getSelectedResources() {
            return this.list.getSelectedElements()
                .filter(r => scmUtil_1.isSCMResource(r));
        }
        updateInputBox() {
            if (typeof this.repository.provider.commitTemplate === 'undefined' || !this.repository.input.visible || this.inputBox.value) {
                return;
            }
            this.inputBox.value = this.repository.provider.commitTemplate;
        }
        updateInputBoxVisibility() {
            if (this.cachedHeight) {
                this.layoutBody(this.cachedHeight);
            }
        }
        dispose() {
            this.visibilityDisposables = lifecycle_1.dispose(this.visibilityDisposables);
            super.dispose();
        }
    };
    RepositoryPanel = __decorate([
        __param(3, keybinding_1.IKeybindingService),
        __param(4, themeService_1.IThemeService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, contextView_1.IContextViewService),
        __param(7, commands_1.ICommandService),
        __param(8, notification_1.INotificationService),
        __param(9, editorService_1.IEditorService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, actions_1.IMenuService)
    ], RepositoryPanel);
    exports.RepositoryPanel = RepositoryPanel;
    class RepositoryViewDescriptor {
        constructor(repository, viewModel, hideByDefault) {
            this.repository = repository;
            this.hideByDefault = hideByDefault;
            this.canToggleVisibility = true;
            this.order = -500;
            this.workspace = true;
            const repoId = repository.provider.rootUri ? repository.provider.rootUri.toString() : `#${RepositoryViewDescriptor.counter++}`;
            this.id = `scm:repository:${repository.provider.label}:${repoId}`;
            this.name = repository.provider.rootUri ? resources_1.basename(repository.provider.rootUri) : repository.provider.label;
            this.ctorDescriptor = { ctor: RepositoryPanel, arguments: [repository, viewModel] };
        }
    }
    RepositoryViewDescriptor.counter = 0;
    class MainPanelDescriptor {
        constructor(viewModel) {
            this.id = MainPanel.ID;
            this.name = MainPanel.TITLE;
            this.canToggleVisibility = true;
            this.hideByDefault = true;
            this.order = -1000;
            this.workspace = true;
            this.ctorDescriptor = { ctor: MainPanel, arguments: [viewModel] };
        }
    }
    let SCMViewlet = class SCMViewlet extends viewsViewlet_1.ViewContainerViewlet {
        constructor(layoutService, telemetryService, scmService, instantiationService, contextViewService, keybindingService, notificationService, contextMenuService, themeService, commandService, storageService, configurationService, extensionService, contextService) {
            super(scm_1.VIEWLET_ID, SCMViewlet.STATE_KEY, true, configurationService, layoutService, telemetryService, storageService, instantiationService, themeService, contextMenuService, extensionService, contextService);
            this.scmService = scmService;
            this.instantiationService = instantiationService;
            this.contextViewService = contextViewService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.contextMenuService = contextMenuService;
            this.themeService = themeService;
            this.commandService = commandService;
            this.contextService = contextService;
            this.repositoryCount = 0;
            this._repositories = [];
            this.mainPanelDescriptor = new MainPanelDescriptor(this);
            this.viewDescriptors = [];
            this._onDidSplice = new event_1.Emitter();
            this.onDidSplice = this._onDidSplice.event;
            this._height = undefined;
            this._onDidChangeRepositories = new event_1.Emitter();
            this._onHaveChangedRepositories = event_1.Event.debounce(this._onDidChangeRepositories.event, () => null, 1000);
            this.menus = instantiationService.createInstance(scmMenus_1.SCMMenus, undefined);
            this._register(this.menus.onDidChangeTitle(this.updateTitleArea, this));
            this.message = dom_1.$('.empty-message', { tabIndex: 0 }, nls_1.localize('no open repo', "No source control providers registered."));
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('scm.alwaysShowProviders')) {
                    this.onDidChangeRepositories();
                }
            }));
            this._register(event_1.Event.once(this._onHaveChangedRepositories)(this.onAfterStartup, this));
            this._register(this.viewsModel.onDidRemove(this.onDidHideView, this));
            this._register(contextService.onDidChangeWorkspaceFolders(this.onDidChangeWorkspaceFolders, this));
        }
        get height() { return this._height; }
        get repositories() {
            return this._repositories;
        }
        get visibleRepositories() {
            return this.panels.filter(panel => panel instanceof RepositoryPanel)
                .map(panel => panel.repository);
        }
        get onDidChangeVisibleRepositories() {
            const modificationEvent = event_1.Event.debounce(event_1.Event.any(this.viewsModel.onDidAdd, this.viewsModel.onDidRemove), () => null, 0);
            return event_1.Event.map(modificationEvent, () => this.visibleRepositories);
        }
        setVisibleRepositories(repositories) {
            const visibleViewDescriptors = this.viewsModel.visibleViewDescriptors;
            const toSetVisible = this.viewsModel.viewDescriptors
                .filter((d) => d instanceof RepositoryViewDescriptor && repositories.indexOf(d.repository) > -1 && visibleViewDescriptors.indexOf(d) === -1);
            const toSetInvisible = visibleViewDescriptors
                .filter((d) => d instanceof RepositoryViewDescriptor && repositories.indexOf(d.repository) === -1);
            let size;
            const oneToOne = toSetVisible.length === 1 && toSetInvisible.length === 1;
            for (const viewDescriptor of toSetInvisible) {
                if (oneToOne) {
                    const panel = this.panels.filter(panel => panel.id === viewDescriptor.id)[0];
                    if (panel) {
                        size = this.getPanelSize(panel);
                    }
                }
                viewDescriptor.repository.setSelected(false);
                this.viewsModel.setVisible(viewDescriptor.id, false);
            }
            for (const viewDescriptor of toSetVisible) {
                viewDescriptor.repository.setSelected(true);
                this.viewsModel.setVisible(viewDescriptor.id, true, size);
            }
        }
        create(parent) {
            super.create(parent);
            this.el = parent;
            dom_1.addClasses(parent, 'scm-viewlet', 'empty');
            dom_1.append(parent, this.message);
            this._register(this.scmService.onDidAddRepository(this.onDidAddRepository, this));
            this._register(this.scmService.onDidRemoveRepository(this.onDidRemoveRepository, this));
            this.scmService.repositories.forEach(r => this.onDidAddRepository(r));
        }
        onDidAddRepository(repository) {
            const index = this._repositories.length;
            this._repositories.push(repository);
            const viewDescriptor = new RepositoryViewDescriptor(repository, this, false);
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([viewDescriptor], scm_1.VIEW_CONTAINER);
            this.viewDescriptors.push(viewDescriptor);
            this._onDidSplice.fire({ index, deleteCount: 0, elements: [repository] });
            this.updateTitleArea();
            this.onDidChangeRepositories();
        }
        onDidRemoveRepository(repository) {
            const index = this._repositories.indexOf(repository);
            if (index === -1) {
                return;
            }
            platform_1.Registry.as(views_1.Extensions.ViewsRegistry).deregisterViews([this.viewDescriptors[index]], scm_1.VIEW_CONTAINER);
            this._repositories.splice(index, 1);
            this.viewDescriptors.splice(index, 1);
            this._onDidSplice.fire({ index, deleteCount: 1, elements: [] });
            this.updateTitleArea();
            this.onDidChangeRepositories();
        }
        onDidChangeRepositories() {
            const repositoryCount = this.repositories.length;
            const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
            if (this.repositoryCount === 0 && repositoryCount !== 0) {
                viewsRegistry.registerViews([this.mainPanelDescriptor], scm_1.VIEW_CONTAINER);
            }
            else if (this.repositoryCount !== 0 && repositoryCount === 0) {
                viewsRegistry.deregisterViews([this.mainPanelDescriptor], scm_1.VIEW_CONTAINER);
            }
            const alwaysShowProviders = this.configurationService.getValue('scm.alwaysShowProviders') || false;
            if (alwaysShowProviders && repositoryCount > 0) {
                this.viewsModel.setVisible(MainPanel.ID, true);
            }
            dom_1.toggleClass(this.el, 'empty', repositoryCount === 0);
            this.repositoryCount = repositoryCount;
            this._onDidChangeRepositories.fire();
        }
        onAfterStartup() {
            if (this.repositoryCount > 0 && this.viewDescriptors.every(d => !this.viewsModel.isVisible(d.id))) {
                this.viewsModel.setVisible(this.viewDescriptors[0].id, true);
            }
        }
        onDidHideView() {
            process_1.nextTick(() => {
                if (this.repositoryCount > 0 && this.viewDescriptors.every(d => !this.viewsModel.isVisible(d.id))) {
                    const alwaysShowProviders = this.configurationService.getValue('scm.alwaysShowProviders') || false;
                    this.viewsModel.setVisible(MainPanel.ID, alwaysShowProviders || this.repositoryCount > 1);
                    this.viewsModel.setVisible(this.viewDescriptors[0].id, true);
                }
            });
        }
        onDidChangeWorkspaceFolders() {
            event_1.Event.once(this._onHaveChangedRepositories)(this.onHaveChangedWorkspaceFolders, this);
        }
        onHaveChangedWorkspaceFolders() {
            if (this.repositoryCount > 1) {
                this.viewsModel.setVisible(MainPanel.ID, true);
            }
        }
        focus() {
            if (this.repositoryCount === 0) {
                this.message.focus();
            }
            else {
                const repository = this.visibleRepositories[0];
                if (repository) {
                    const panel = this.panels
                        .filter(panel => panel instanceof RepositoryPanel && panel.repository === repository)[0];
                    if (panel) {
                        panel.focus();
                    }
                    else {
                        super.focus();
                    }
                }
                else {
                    super.focus();
                }
            }
        }
        getOptimalWidth() {
            return 400;
        }
        getTitle() {
            const title = nls_1.localize('source control', "Source Control");
            if (this.visibleRepositories.length === 1) {
                const [repository] = this.repositories;
                return nls_1.localize('viewletTitle', "{0}: {1}", title, repository.provider.label);
            }
            else {
                return title;
            }
        }
        getActionViewItem(action) {
            if (!(action instanceof actions_1.MenuItemAction)) {
                return undefined;
            }
            return new menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
        }
        getActions() {
            if (this.repositories.length > 0) {
                return super.getActions();
            }
            return this.menus.getTitleActions();
        }
        getSecondaryActions() {
            if (this.repositories.length > 0) {
                return super.getSecondaryActions();
            }
            return this.menus.getTitleSecondaryActions();
        }
        getActionsContext() {
            if (this.visibleRepositories.length === 1) {
                return this.repositories[0].provider;
            }
        }
    };
    SCMViewlet.STATE_KEY = 'workbench.scm.views.state';
    SCMViewlet = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, scm_1.ISCMService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, contextView_1.IContextViewService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, notification_1.INotificationService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, themeService_1.IThemeService),
        __param(9, commands_1.ICommandService),
        __param(10, storage_1.IStorageService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, extensions_1.IExtensionService),
        __param(13, workspace_1.IWorkspaceContextService)
    ], SCMViewlet);
    exports.SCMViewlet = SCMViewlet;
});
//# sourceMappingURL=scmViewlet.js.map