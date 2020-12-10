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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/browser/ui/checkbox/checkbox", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/parts/editor/baseEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/preferences/common/keybindingsEditorModel", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/preferences/browser/keybindingWidgets", "vs/workbench/contrib/preferences/common/preferences", "vs/platform/contextview/browser/contextView", "vs/workbench/services/keybinding/common/keybindingEditing", "vs/platform/theme/common/themeService", "vs/platform/contextkey/common/contextkey", "vs/base/browser/keyboardEvent", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/editorExtensions", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/theme/common/styler", "vs/platform/storage/common/storage", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/event", "vs/platform/actions/common/actions", "vs/css!./media/keybindingsEditor"], function (require, exports, nls_1, async_1, DOM, platform_1, lifecycle_1, checkbox_1, highlightedLabel_1, keybindingLabel_1, actions_1, actionbar_1, baseEditor_1, telemetry_1, clipboardService_1, keybindingsEditorModel_1, instantiation_1, keybinding_1, keybindingWidgets_1, preferences_1, contextView_1, keybindingEditing_1, themeService_1, contextkey_1, keyboardEvent_1, colorRegistry_1, editorService_1, editorExtensions_1, listService_1, notification_1, styler_1, storage_1, inputBox_1, event_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const $ = DOM.$;
    let KeybindingsEditor = class KeybindingsEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, themeService, keybindingsService, contextMenuService, keybindingEditingService, contextKeyService, notificationService, clipboardService, instantiationService, editorService, storageService) {
            super(KeybindingsEditor.ID, telemetryService, themeService, storageService);
            this.keybindingsService = keybindingsService;
            this.contextMenuService = contextMenuService;
            this.keybindingEditingService = keybindingEditingService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.clipboardService = clipboardService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this._onDefineWhenExpression = this._register(new event_1.Emitter());
            this.onDefineWhenExpression = this._onDefineWhenExpression.event;
            this._onLayout = this._register(new event_1.Emitter());
            this.onLayout = this._onLayout.event;
            this.columnItems = [];
            this.latestEmptyFilters = [];
            this.delayedFiltering = new async_1.Delayer(300);
            this._register(keybindingsService.onDidUpdateKeybindings(() => this.render(!!this.keybindingFocusContextKey.get())));
            this.keybindingsEditorContextKey = preferences_1.CONTEXT_KEYBINDINGS_EDITOR.bindTo(this.contextKeyService);
            this.searchFocusContextKey = preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS.bindTo(this.contextKeyService);
            this.keybindingFocusContextKey = preferences_1.CONTEXT_KEYBINDING_FOCUS.bindTo(this.contextKeyService);
            this.delayedFilterLogging = new async_1.Delayer(1000);
        }
        createEditor(parent) {
            const keybindingsEditorElement = DOM.append(parent, $('div', { class: 'keybindings-editor' }));
            this.createAriaLabelElement(keybindingsEditorElement);
            this.createOverlayContainer(keybindingsEditorElement);
            this.createHeader(keybindingsEditorElement);
            this.createBody(keybindingsEditorElement);
        }
        setInput(input, options, token) {
            this.keybindingsEditorContextKey.set(true);
            return super.setInput(input, options, token)
                .then(() => this.render(!!(options && options.preserveFocus)));
        }
        clearInput() {
            super.clearInput();
            this.keybindingsEditorContextKey.reset();
            this.keybindingFocusContextKey.reset();
        }
        layout(dimension) {
            this.dimension = dimension;
            this.layoutSearchWidget(dimension);
            this.overlayContainer.style.width = dimension.width + 'px';
            this.overlayContainer.style.height = dimension.height + 'px';
            this.defineKeybindingWidget.layout(this.dimension);
            this.columnItems.forEach(columnItem => {
                if (columnItem.proportion) {
                    columnItem.width = 0;
                }
            });
            this.layoutKeybindingsList();
            this._onLayout.fire();
        }
        layoutColumns(columns) {
            if (this.columnItems) {
                columns.forEach((column, index) => {
                    column.style.paddingRight = `6px`;
                    column.style.width = `${this.columnItems[index].width}px`;
                });
            }
        }
        focus() {
            const activeKeybindingEntry = this.activeKeybindingEntry;
            if (activeKeybindingEntry) {
                this.selectEntry(activeKeybindingEntry);
            }
            else {
                this.searchWidget.focus();
            }
        }
        get activeKeybindingEntry() {
            const focusedElement = this.keybindingsList.getFocusedElements()[0];
            return focusedElement && focusedElement.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID ? focusedElement : null;
        }
        defineKeybinding(keybindingEntry) {
            this.selectEntry(keybindingEntry);
            this.showOverlayContainer();
            return this.defineKeybindingWidget.define().then(key => {
                if (key) {
                    this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE, keybindingEntry.keybindingItem.command, key);
                    return this.updateKeybinding(keybindingEntry, key, keybindingEntry.keybindingItem.when);
                }
                return null;
            }).then(() => {
                this.hideOverlayContainer();
                this.selectEntry(keybindingEntry);
            }, error => {
                this.hideOverlayContainer();
                this.onKeybindingEditingError(error);
                this.selectEntry(keybindingEntry);
                return error;
            });
        }
        defineWhenExpression(keybindingEntry) {
            if (keybindingEntry.keybindingItem.keybinding) {
                this.selectEntry(keybindingEntry);
                this._onDefineWhenExpression.fire(keybindingEntry);
            }
        }
        updateKeybinding(keybindingEntry, key, when) {
            const currentKey = keybindingEntry.keybindingItem.keybinding ? keybindingEntry.keybindingItem.keybinding.getUserSettingsLabel() : '';
            if (currentKey !== key || keybindingEntry.keybindingItem.when !== when) {
                return this.keybindingEditingService.editKeybinding(keybindingEntry.keybindingItem.keybindingItem, key, when || undefined)
                    .then(() => {
                    if (!keybindingEntry.keybindingItem.keybinding) { // reveal only if keybinding was added to unassinged. Because the entry will be placed in different position after rendering
                        this.unAssignedKeybindingItemToRevealAndFocus = keybindingEntry;
                    }
                });
            }
            return Promise.resolve();
        }
        removeKeybinding(keybindingEntry) {
            this.selectEntry(keybindingEntry);
            if (keybindingEntry.keybindingItem.keybinding) { // This should be a pre-condition
                this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_REMOVE, keybindingEntry.keybindingItem.command, keybindingEntry.keybindingItem.keybinding);
                return this.keybindingEditingService.removeKeybinding(keybindingEntry.keybindingItem.keybindingItem)
                    .then(() => this.focus(), error => {
                    this.onKeybindingEditingError(error);
                    this.selectEntry(keybindingEntry);
                });
            }
            return Promise.resolve(null);
        }
        resetKeybinding(keybindingEntry) {
            this.selectEntry(keybindingEntry);
            this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_RESET, keybindingEntry.keybindingItem.command, keybindingEntry.keybindingItem.keybinding);
            return this.keybindingEditingService.resetKeybinding(keybindingEntry.keybindingItem.keybindingItem)
                .then(() => {
                if (!keybindingEntry.keybindingItem.keybinding) { // reveal only if keybinding was added to unassinged. Because the entry will be placed in different position after rendering
                    this.unAssignedKeybindingItemToRevealAndFocus = keybindingEntry;
                }
                this.selectEntry(keybindingEntry);
            }, error => {
                this.onKeybindingEditingError(error);
                this.selectEntry(keybindingEntry);
            });
        }
        copyKeybinding(keybinding) {
            return __awaiter(this, void 0, void 0, function* () {
                this.selectEntry(keybinding);
                this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY, keybinding.keybindingItem.command, keybinding.keybindingItem.keybinding);
                const userFriendlyKeybinding = {
                    key: keybinding.keybindingItem.keybinding ? keybinding.keybindingItem.keybinding.getUserSettingsLabel() || '' : '',
                    command: keybinding.keybindingItem.command
                };
                if (keybinding.keybindingItem.when) {
                    userFriendlyKeybinding.when = keybinding.keybindingItem.when;
                }
                yield this.clipboardService.writeText(JSON.stringify(userFriendlyKeybinding, null, '  '));
            });
        }
        copyKeybindingCommand(keybinding) {
            return __awaiter(this, void 0, void 0, function* () {
                this.selectEntry(keybinding);
                this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND, keybinding.keybindingItem.command, keybinding.keybindingItem.keybinding);
                yield this.clipboardService.writeText(keybinding.keybindingItem.command);
            });
        }
        focusSearch() {
            this.searchWidget.focus();
        }
        search(filter) {
            this.focusSearch();
            this.searchWidget.setValue(filter);
        }
        clearSearchResults() {
            this.searchWidget.clear();
        }
        showSimilarKeybindings(keybindingEntry) {
            const value = `"${keybindingEntry.keybindingItem.keybinding.getAriaLabel()}"`;
            if (value !== this.searchWidget.getValue()) {
                this.searchWidget.setValue(value);
            }
        }
        createAriaLabelElement(parent) {
            this.ariaLabelElement = DOM.append(parent, DOM.$(''));
            this.ariaLabelElement.setAttribute('id', 'keybindings-editor-aria-label-element');
            this.ariaLabelElement.setAttribute('aria-live', 'assertive');
        }
        createOverlayContainer(parent) {
            this.overlayContainer = DOM.append(parent, $('.overlay-container'));
            this.overlayContainer.style.position = 'absolute';
            this.overlayContainer.style.zIndex = '10';
            this.defineKeybindingWidget = this._register(this.instantiationService.createInstance(keybindingWidgets_1.DefineKeybindingWidget, this.overlayContainer));
            this._register(this.defineKeybindingWidget.onDidChange(keybindingStr => this.defineKeybindingWidget.printExisting(this.keybindingsEditorModel.fetch(`"${keybindingStr}"`).length)));
            this._register(this.defineKeybindingWidget.onShowExistingKeybidings(keybindingStr => this.searchWidget.setValue(`"${keybindingStr}"`)));
            this.hideOverlayContainer();
        }
        showOverlayContainer() {
            this.overlayContainer.style.display = 'block';
        }
        hideOverlayContainer() {
            this.overlayContainer.style.display = 'none';
        }
        createHeader(parent) {
            this.headerContainer = DOM.append(parent, $('.keybindings-header'));
            const fullTextSearchPlaceholder = nls_1.localize('SearchKeybindings.FullTextSearchPlaceholder', "Type to search in keybindings");
            const keybindingsSearchPlaceholder = nls_1.localize('SearchKeybindings.KeybindingsSearchPlaceholder', "Recording Keys. Press Escape to exit");
            const clearInputAction = new actions_1.Action(preferences_1.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS, nls_1.localize('clearInput', "Clear Keybindings Search Input"), 'clear-input', false, () => { this.search(''); return Promise.resolve(null); });
            const searchContainer = DOM.append(this.headerContainer, $('.search-container'));
            this.searchWidget = this._register(this.instantiationService.createInstance(keybindingWidgets_1.KeybindingsSearchWidget, searchContainer, {
                ariaLabel: fullTextSearchPlaceholder,
                placeholder: fullTextSearchPlaceholder,
                focusKey: this.searchFocusContextKey,
                ariaLabelledBy: 'keybindings-editor-aria-label-element',
                recordEnter: true,
                quoteRecordedKeys: true
            }));
            this._register(this.searchWidget.onDidChange(searchValue => {
                clearInputAction.enabled = !!searchValue;
                this.delayedFiltering.trigger(() => this.filterKeybindings());
                this.updateSearchOptions();
            }));
            this._register(this.searchWidget.onEscape(() => this.recordKeysAction.checked = false));
            this.actionsContainer = DOM.append(searchContainer, DOM.$('.keybindings-search-actions-container'));
            const recordingBadge = this.createRecordingBadge(this.actionsContainer);
            const sortByPrecedenceActionKeybinding = this.keybindingsService.lookupKeybinding(preferences_1.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE);
            const sortByPrecedenceActionLabel = nls_1.localize('sortByPrecedeneLabel', "Sort by Precedence");
            this.sortByPrecedenceAction = new actions_1.Action('keybindings.editor.sortByPrecedence', sortByPrecedenceActionKeybinding ? nls_1.localize('sortByPrecedeneLabelWithKeybinding', "{0} ({1})", sortByPrecedenceActionLabel, sortByPrecedenceActionKeybinding.getLabel()) : sortByPrecedenceActionLabel, 'sort-by-precedence');
            this.sortByPrecedenceAction.checked = false;
            this._register(this.sortByPrecedenceAction.onDidChange(e => {
                if (e.checked !== undefined) {
                    this.renderKeybindingsEntries(false);
                }
                this.updateSearchOptions();
            }));
            const recordKeysActionKeybinding = this.keybindingsService.lookupKeybinding(preferences_1.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS);
            const recordKeysActionLabel = nls_1.localize('recordKeysLabel', "Record Keys");
            this.recordKeysAction = new actions_1.Action(preferences_1.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS, recordKeysActionKeybinding ? nls_1.localize('recordKeysLabelWithKeybinding', "{0} ({1})", recordKeysActionLabel, recordKeysActionKeybinding.getLabel()) : recordKeysActionLabel, 'record-keys');
            this.recordKeysAction.checked = false;
            this._register(this.recordKeysAction.onDidChange(e => {
                if (e.checked !== undefined) {
                    DOM.toggleClass(recordingBadge, 'disabled', !e.checked);
                    if (e.checked) {
                        this.searchWidget.inputBox.setPlaceHolder(keybindingsSearchPlaceholder);
                        this.searchWidget.inputBox.setAriaLabel(keybindingsSearchPlaceholder);
                        this.searchWidget.startRecordingKeys();
                        this.searchWidget.focus();
                    }
                    else {
                        this.searchWidget.inputBox.setPlaceHolder(fullTextSearchPlaceholder);
                        this.searchWidget.inputBox.setAriaLabel(fullTextSearchPlaceholder);
                        this.searchWidget.stopRecordingKeys();
                        this.searchWidget.focus();
                    }
                    this.updateSearchOptions();
                }
            }));
            this.actionBar = this._register(new actionbar_1.ActionBar(this.actionsContainer, {
                animated: false,
                actionViewItemProvider: (action) => {
                    if (action.id === this.sortByPrecedenceAction.id) {
                        return new checkbox_1.CheckboxActionViewItem(null, action);
                    }
                    if (action.id === this.recordKeysAction.id) {
                        return new checkbox_1.CheckboxActionViewItem(null, action);
                    }
                    return undefined;
                }
            }));
            this.actionBar.push([this.recordKeysAction, this.sortByPrecedenceAction, clearInputAction], { label: false, icon: true });
        }
        updateSearchOptions() {
            const keybindingsEditorInput = this.input;
            if (keybindingsEditorInput) {
                keybindingsEditorInput.searchOptions = {
                    searchValue: this.searchWidget.getValue(),
                    recordKeybindings: !!this.recordKeysAction.checked,
                    sortByPrecedence: !!this.sortByPrecedenceAction.checked
                };
            }
        }
        createRecordingBadge(container) {
            const recordingBadge = DOM.append(container, DOM.$('.recording-badge.disabled'));
            recordingBadge.textContent = nls_1.localize('recording', "Recording Keys");
            this._register(styler_1.attachStylerCallback(this.themeService, { badgeBackground: colorRegistry_1.badgeBackground, contrastBorder: colorRegistry_1.contrastBorder, badgeForeground: colorRegistry_1.badgeForeground }, colors => {
                const background = colors.badgeBackground ? colors.badgeBackground.toString() : null;
                const border = colors.contrastBorder ? colors.contrastBorder.toString() : null;
                const color = colors.badgeForeground ? colors.badgeForeground.toString() : null;
                recordingBadge.style.backgroundColor = background;
                recordingBadge.style.borderWidth = border ? '1px' : null;
                recordingBadge.style.borderStyle = border ? 'solid' : null;
                recordingBadge.style.borderColor = border;
                recordingBadge.style.color = color ? color.toString() : null;
            }));
            return recordingBadge;
        }
        layoutSearchWidget(dimension) {
            this.searchWidget.layout(dimension);
            DOM.toggleClass(this.headerContainer, 'small', dimension.width < 400);
            this.searchWidget.inputBox.inputElement.style.paddingRight = `${DOM.getTotalWidth(this.actionsContainer) + 12}px`;
        }
        createBody(parent) {
            const bodyContainer = DOM.append(parent, $('.keybindings-body'));
            this.createListHeader(bodyContainer);
            this.createList(bodyContainer);
        }
        createListHeader(parent) {
            const keybindingsListHeader = DOM.append(parent, $('.keybindings-list-header'));
            keybindingsListHeader.style.height = '30px';
            keybindingsListHeader.style.lineHeight = '30px';
            this.columnItems = [];
            let column = $('.header.actions');
            this.columnItems.push({ column, width: 30 });
            column = $('.header.command', undefined, nls_1.localize('command', "Command"));
            this.columnItems.push({ column, proportion: 0.3, width: 0 });
            column = $('.header.keybinding', undefined, nls_1.localize('keybinding', "Keybinding"));
            this.columnItems.push({ column, proportion: 0.2, width: 0 });
            column = $('.header.when', undefined, nls_1.localize('when', "When"));
            this.columnItems.push({ column, proportion: 0.4, width: 0 });
            column = $('.header.source', undefined, nls_1.localize('source', "Source"));
            this.columnItems.push({ column, proportion: 0.1, width: 0 });
            DOM.append(keybindingsListHeader, ...this.columnItems.map(({ column }) => column));
        }
        createList(parent) {
            this.keybindingsListContainer = DOM.append(parent, $('.keybindings-list-container'));
            this.keybindingsList = this._register(this.instantiationService.createInstance(listService_1.WorkbenchList, this.keybindingsListContainer, new Delegate(), [new KeybindingItemRenderer(this, this.instantiationService)], {
                identityProvider: { getId: (e) => e.id },
                ariaLabel: nls_1.localize('keybindingsLabel', "Keybindings"),
                setRowLineHeight: false,
                horizontalScrolling: false
            }));
            this._register(this.keybindingsList.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.keybindingsList.onFocusChange(e => this.onFocusChange(e)));
            this._register(this.keybindingsList.onDidFocus(() => {
                DOM.addClass(this.keybindingsList.getHTMLElement(), 'focused');
            }));
            this._register(this.keybindingsList.onDidBlur(() => {
                DOM.removeClass(this.keybindingsList.getHTMLElement(), 'focused');
                this.keybindingFocusContextKey.reset();
            }));
            this._register(this.keybindingsList.onMouseDblClick(() => {
                const activeKeybindingEntry = this.activeKeybindingEntry;
                if (activeKeybindingEntry) {
                    this.defineKeybinding(activeKeybindingEntry);
                }
            }));
            this._register(this.keybindingsList.onKeyDown(e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.keyCode === 3 /* Enter */) {
                    const keybindingEntry = this.activeKeybindingEntry;
                    if (keybindingEntry) {
                        this.defineKeybinding(keybindingEntry);
                    }
                    e.stopPropagation();
                }
            }));
        }
        render(preserveFocus) {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.input) {
                    const input = this.input;
                    this.keybindingsEditorModel = yield input.resolve();
                    yield this.keybindingsEditorModel.resolve(this.getActionsLabels());
                    this.renderKeybindingsEntries(false, preserveFocus);
                    if (input.searchOptions) {
                        this.recordKeysAction.checked = input.searchOptions.recordKeybindings;
                        this.sortByPrecedenceAction.checked = input.searchOptions.sortByPrecedence;
                        this.searchWidget.setValue(input.searchOptions.searchValue);
                    }
                    else {
                        this.updateSearchOptions();
                    }
                }
            });
        }
        getActionsLabels() {
            const actionsLabels = new Map();
            editorExtensions_1.EditorExtensionsRegistry.getEditorActions().forEach(editorAction => actionsLabels.set(editorAction.id, editorAction.label));
            for (const menuItem of actions_2.MenuRegistry.getMenuItems(0 /* CommandPalette */)) {
                if (actions_2.isIMenuItem(menuItem)) {
                    const title = typeof menuItem.command.title === 'string' ? menuItem.command.title : menuItem.command.title.value;
                    const category = menuItem.command.category ? typeof menuItem.command.category === 'string' ? menuItem.command.category : menuItem.command.category.value : undefined;
                    actionsLabels.set(menuItem.command.id, category ? `${category}: ${title}` : title);
                }
            }
            return actionsLabels;
        }
        filterKeybindings() {
            this.renderKeybindingsEntries(this.searchWidget.hasFocus());
            this.delayedFilterLogging.trigger(() => this.reportFilteringUsed(this.searchWidget.getValue()));
        }
        renderKeybindingsEntries(reset, preserveFocus) {
            if (this.keybindingsEditorModel) {
                const filter = this.searchWidget.getValue();
                const keybindingsEntries = this.keybindingsEditorModel.fetch(filter, this.sortByPrecedenceAction.checked);
                this.ariaLabelElement.setAttribute('aria-label', this.getAriaLabel(keybindingsEntries));
                if (keybindingsEntries.length === 0) {
                    this.latestEmptyFilters.push(filter);
                }
                const currentSelectedIndex = this.keybindingsList.getSelection()[0];
                this.listEntries = keybindingsEntries;
                this.keybindingsList.splice(0, this.keybindingsList.length, this.listEntries);
                this.layoutKeybindingsList();
                if (reset) {
                    this.keybindingsList.setSelection([]);
                    this.keybindingsList.setFocus([]);
                }
                else {
                    if (this.unAssignedKeybindingItemToRevealAndFocus) {
                        const index = this.getNewIndexOfUnassignedKeybinding(this.unAssignedKeybindingItemToRevealAndFocus);
                        if (index !== -1) {
                            this.keybindingsList.reveal(index, 0.2);
                            this.selectEntry(index);
                        }
                        this.unAssignedKeybindingItemToRevealAndFocus = null;
                    }
                    else if (currentSelectedIndex !== -1 && currentSelectedIndex < this.listEntries.length) {
                        this.selectEntry(currentSelectedIndex, preserveFocus);
                    }
                    else if (this.editorService.activeControl === this && !preserveFocus) {
                        this.focus();
                    }
                }
            }
        }
        getAriaLabel(keybindingsEntries) {
            if (this.sortByPrecedenceAction.checked) {
                return nls_1.localize('show sorted keybindings', "Showing {0} Keybindings in precedence order", keybindingsEntries.length);
            }
            else {
                return nls_1.localize('show keybindings', "Showing {0} Keybindings in alphabetical order", keybindingsEntries.length);
            }
        }
        layoutKeybindingsList() {
            let width = this.dimension.width - 27;
            for (const columnItem of this.columnItems) {
                if (columnItem.width && !columnItem.proportion) {
                    width = width - columnItem.width;
                }
            }
            for (const columnItem of this.columnItems) {
                if (columnItem.proportion && !columnItem.width) {
                    columnItem.width = width * columnItem.proportion;
                }
            }
            this.layoutColumns(this.columnItems.map(({ column }) => column));
            const listHeight = this.dimension.height - (DOM.getDomNodePagePosition(this.headerContainer).height + 12 /*padding*/ + 30 /*list header*/);
            this.keybindingsListContainer.style.height = `${listHeight}px`;
            this.keybindingsList.layout(listHeight);
        }
        getIndexOf(listEntry) {
            const index = this.listEntries.indexOf(listEntry);
            if (index === -1) {
                for (let i = 0; i < this.listEntries.length; i++) {
                    if (this.listEntries[i].id === listEntry.id) {
                        return i;
                    }
                }
            }
            return index;
        }
        getNewIndexOfUnassignedKeybinding(unassignedKeybinding) {
            for (let index = 0; index < this.listEntries.length; index++) {
                const entry = this.listEntries[index];
                if (entry.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                    const keybindingItemEntry = entry;
                    if (keybindingItemEntry.keybindingItem.command === unassignedKeybinding.keybindingItem.command) {
                        return index;
                    }
                }
            }
            return -1;
        }
        selectEntry(keybindingItemEntry, focus = true) {
            const index = typeof keybindingItemEntry === 'number' ? keybindingItemEntry : this.getIndexOf(keybindingItemEntry);
            if (index !== -1) {
                if (focus) {
                    this.keybindingsList.getHTMLElement().focus();
                    this.keybindingsList.setFocus([index]);
                }
                this.keybindingsList.setSelection([index]);
            }
        }
        focusKeybindings() {
            this.keybindingsList.getHTMLElement().focus();
            const currentFocusIndices = this.keybindingsList.getFocus();
            this.keybindingsList.setFocus([currentFocusIndices.length ? currentFocusIndices[0] : 0]);
        }
        selectKeybinding(keybindingItemEntry) {
            this.selectEntry(keybindingItemEntry);
        }
        recordSearchKeys() {
            this.recordKeysAction.checked = true;
        }
        toggleSortByPrecedence() {
            this.sortByPrecedenceAction.checked = !this.sortByPrecedenceAction.checked;
        }
        onContextMenu(e) {
            if (!e.element) {
                return;
            }
            if (e.element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                this.selectEntry(e.element);
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => [
                        this.createCopyAction(e.element),
                        this.createCopyCommandAction(e.element),
                        new actionbar_1.Separator(),
                        this.createDefineAction(e.element),
                        this.createRemoveAction(e.element),
                        this.createResetAction(e.element),
                        this.createDefineWhenExpressionAction(e.element),
                        new actionbar_1.Separator(),
                        this.createShowConflictsAction(e.element)
                    ]
                });
            }
        }
        onFocusChange(e) {
            this.keybindingFocusContextKey.reset();
            const element = e.elements[0];
            if (!element) {
                return;
            }
            if (element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                this.keybindingFocusContextKey.set(true);
            }
        }
        createDefineAction(keybindingItemEntry) {
            return {
                label: keybindingItemEntry.keybindingItem.keybinding ? nls_1.localize('changeLabel', "Change Keybinding") : nls_1.localize('addLabel', "Add Keybinding"),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE,
                run: () => this.defineKeybinding(keybindingItemEntry)
            };
        }
        createDefineWhenExpressionAction(keybindingItemEntry) {
            return {
                label: nls_1.localize('editWhen', "Change When Expression"),
                enabled: !!keybindingItemEntry.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN,
                run: () => this.defineWhenExpression(keybindingItemEntry)
            };
        }
        createRemoveAction(keybindingItem) {
            return {
                label: nls_1.localize('removeLabel', "Remove Keybinding"),
                enabled: !!keybindingItem.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_REMOVE,
                run: () => this.removeKeybinding(keybindingItem)
            };
        }
        createResetAction(keybindingItem) {
            return {
                label: nls_1.localize('resetLabel', "Reset Keybinding"),
                enabled: !keybindingItem.keybindingItem.keybindingItem.isDefault,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RESET,
                run: () => this.resetKeybinding(keybindingItem)
            };
        }
        createShowConflictsAction(keybindingItem) {
            return {
                label: nls_1.localize('showSameKeybindings', "Show Same Keybindings"),
                enabled: !!keybindingItem.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR,
                run: () => this.showSimilarKeybindings(keybindingItem)
            };
        }
        createCopyAction(keybindingItem) {
            return {
                label: nls_1.localize('copyLabel', "Copy"),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY,
                run: () => this.copyKeybinding(keybindingItem)
            };
        }
        createCopyCommandAction(keybinding) {
            return {
                label: nls_1.localize('copyCommandLabel', "Copy Command ID"),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND,
                run: () => this.copyKeybindingCommand(keybinding)
            };
        }
        reportFilteringUsed(filter) {
            if (filter) {
                const data = {
                    filter,
                    emptyFilters: this.getLatestEmptyFiltersForTelemetry()
                };
                this.latestEmptyFilters = [];
                /* __GDPR__
                    "keybindings.filter" : {
                        "filter": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
                        "emptyFilters" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                this.telemetryService.publicLog('keybindings.filter', data);
            }
        }
        /**
         * Put a rough limit on the size of the telemetry data, since otherwise it could be an unbounded large amount
         * of data. 8192 is the max size of a property value. This is rough since that probably includes ""s, etc.
         */
        getLatestEmptyFiltersForTelemetry() {
            let cumulativeSize = 0;
            return this.latestEmptyFilters.filter(filterText => (cumulativeSize += filterText.length) <= 8192);
        }
        reportKeybindingAction(action, command, keybinding) {
            // __GDPR__TODO__ Need to move off dynamic event names and properties as they cannot be registered statically
            this.telemetryService.publicLog(action, { command, keybinding: keybinding ? (typeof keybinding === 'string' ? keybinding : keybinding.getUserSettingsLabel()) : '' });
        }
        onKeybindingEditingError(error) {
            this.notificationService.error(typeof error === 'string' ? error : nls_1.localize('error', "Error '{0}' while editing the keybinding. Please open 'keybindings.json' file and check for errors.", `${error}`));
        }
    };
    KeybindingsEditor.ID = 'workbench.editor.keybindings';
    KeybindingsEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, keybindingEditing_1.IKeybindingEditingService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, notification_1.INotificationService),
        __param(7, clipboardService_1.IClipboardService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, editorService_1.IEditorService),
        __param(10, storage_1.IStorageService)
    ], KeybindingsEditor);
    exports.KeybindingsEditor = KeybindingsEditor;
    class Delegate {
        getHeight(element) {
            if (element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                const commandIdMatched = element.keybindingItem.commandLabel && element.commandIdMatches;
                const commandDefaultLabelMatched = !!element.commandDefaultLabelMatches;
                if (commandIdMatched && commandDefaultLabelMatched) {
                    return 60;
                }
                if (commandIdMatched || commandDefaultLabelMatched) {
                    return 40;
                }
            }
            return 24;
        }
        getTemplateId(element) {
            return element.templateId;
        }
    }
    class KeybindingItemRenderer {
        constructor(keybindingsEditor, instantiationService) {
            this.keybindingsEditor = keybindingsEditor;
            this.instantiationService = instantiationService;
        }
        get templateId() { return keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID; }
        renderTemplate(parent) {
            DOM.addClass(parent, 'keybinding-item');
            const actions = this.instantiationService.createInstance(ActionsColumn, parent, this.keybindingsEditor);
            const command = this.instantiationService.createInstance(CommandColumn, parent, this.keybindingsEditor);
            const keybinding = this.instantiationService.createInstance(KeybindingColumn, parent, this.keybindingsEditor);
            const when = this.instantiationService.createInstance(WhenColumn, parent, this.keybindingsEditor);
            const source = this.instantiationService.createInstance(SourceColumn, parent, this.keybindingsEditor);
            const columns = [actions, command, keybinding, when, source];
            const disposables = lifecycle_1.combinedDisposable(...columns);
            const elements = columns.map(({ element }) => element);
            this.keybindingsEditor.layoutColumns(elements);
            this.keybindingsEditor.onLayout(() => this.keybindingsEditor.layoutColumns(elements));
            parent.setAttribute('aria-labelledby', elements.map(e => e.getAttribute('id')).join(' '));
            return {
                parent,
                columns,
                disposable: disposables
            };
        }
        renderElement(keybindingEntry, index, template) {
            DOM.toggleClass(template.parent, 'odd', index % 2 === 1);
            for (const column of template.columns) {
                column.render(keybindingEntry);
            }
        }
        disposeTemplate(template) {
            template.disposable.dispose();
        }
    }
    class Column extends lifecycle_1.Disposable {
        constructor(keybindingsEditor) {
            super();
            this.keybindingsEditor = keybindingsEditor;
        }
    }
    Column.COUNTER = 0;
    let ActionsColumn = class ActionsColumn extends Column {
        constructor(parent, keybindingsEditor, keybindingsService) {
            super(keybindingsEditor);
            this.keybindingsService = keybindingsService;
            this.element = this.create(parent);
        }
        create(parent) {
            const actionsContainer = DOM.append(parent, $('.column.actions', { id: 'actions_' + ++Column.COUNTER }));
            this.actionBar = new actionbar_1.ActionBar(actionsContainer, { animated: false });
            return actionsContainer;
        }
        render(keybindingItemEntry) {
            this.actionBar.clear();
            const actions = [];
            if (keybindingItemEntry.keybindingItem.keybinding) {
                actions.push(this.createEditAction(keybindingItemEntry));
            }
            else {
                actions.push(this.createAddAction(keybindingItemEntry));
            }
            this.actionBar.push(actions, { icon: true });
        }
        createEditAction(keybindingItemEntry) {
            const keybinding = this.keybindingsService.lookupKeybinding(preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE);
            return {
                class: 'edit',
                enabled: true,
                id: 'editKeybinding',
                tooltip: keybinding ? nls_1.localize('editKeybindingLabelWithKey', "Change Keybinding {0}", `(${keybinding.getLabel()})`) : nls_1.localize('editKeybindingLabel', "Change Keybinding"),
                run: () => this.keybindingsEditor.defineKeybinding(keybindingItemEntry)
            };
        }
        createAddAction(keybindingItemEntry) {
            const keybinding = this.keybindingsService.lookupKeybinding(preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE);
            return {
                class: 'add',
                enabled: true,
                id: 'addKeybinding',
                tooltip: keybinding ? nls_1.localize('addKeybindingLabelWithKey', "Add Keybinding {0}", `(${keybinding.getLabel()})`) : nls_1.localize('addKeybindingLabel', "Add Keybinding"),
                run: () => this.keybindingsEditor.defineKeybinding(keybindingItemEntry)
            };
        }
        dispose() {
            super.dispose();
            lifecycle_1.dispose(this.actionBar);
        }
    };
    ActionsColumn = __decorate([
        __param(2, keybinding_1.IKeybindingService)
    ], ActionsColumn);
    class CommandColumn extends Column {
        constructor(parent, keybindingsEditor) {
            super(keybindingsEditor);
            this.element = this.create(parent);
        }
        create(parent) {
            this.commandColumn = DOM.append(parent, $('.column.command', { id: 'command_' + ++Column.COUNTER }));
            return this.commandColumn;
        }
        render(keybindingItemEntry) {
            DOM.clearNode(this.commandColumn);
            const keybindingItem = keybindingItemEntry.keybindingItem;
            const commandIdMatched = !!(keybindingItem.commandLabel && keybindingItemEntry.commandIdMatches);
            const commandDefaultLabelMatched = !!keybindingItemEntry.commandDefaultLabelMatches;
            DOM.toggleClass(this.commandColumn, 'vertical-align-column', commandIdMatched || commandDefaultLabelMatched);
            this.commandColumn.setAttribute('aria-label', this.getAriaLabel(keybindingItemEntry));
            let commandLabel;
            if (keybindingItem.commandLabel) {
                commandLabel = new highlightedLabel_1.HighlightedLabel(this.commandColumn, false);
                commandLabel.set(keybindingItem.commandLabel, keybindingItemEntry.commandLabelMatches);
            }
            if (keybindingItemEntry.commandDefaultLabelMatches) {
                commandLabel = new highlightedLabel_1.HighlightedLabel(DOM.append(this.commandColumn, $('.command-default-label')), false);
                commandLabel.set(keybindingItem.commandDefaultLabel, keybindingItemEntry.commandDefaultLabelMatches);
            }
            if (keybindingItemEntry.commandIdMatches || !keybindingItem.commandLabel) {
                commandLabel = new highlightedLabel_1.HighlightedLabel(DOM.append(this.commandColumn, $('.code')), false);
                commandLabel.set(keybindingItem.command, keybindingItemEntry.commandIdMatches);
            }
            if (commandLabel) {
                commandLabel.element.title = keybindingItem.commandLabel ? nls_1.localize('title', "{0} ({1})", keybindingItem.commandLabel, keybindingItem.command) : keybindingItem.command;
            }
        }
        getAriaLabel(keybindingItemEntry) {
            return nls_1.localize('commandAriaLabel', "Command is {0}.", keybindingItemEntry.keybindingItem.commandLabel ? keybindingItemEntry.keybindingItem.commandLabel : keybindingItemEntry.keybindingItem.command);
        }
    }
    class KeybindingColumn extends Column {
        constructor(parent, keybindingsEditor) {
            super(keybindingsEditor);
            this.element = this.create(parent);
        }
        create(parent) {
            const column = DOM.append(parent, $('.column.keybinding', { id: 'keybinding_' + ++Column.COUNTER }));
            this.keybindingLabel = DOM.append(column, $('div.keybinding-label'));
            return column;
        }
        render(keybindingItemEntry) {
            DOM.clearNode(this.keybindingLabel);
            this.keybindingLabel.setAttribute('aria-label', this.getAriaLabel(keybindingItemEntry));
            if (keybindingItemEntry.keybindingItem.keybinding) {
                new keybindingLabel_1.KeybindingLabel(this.keybindingLabel, platform_1.OS).set(keybindingItemEntry.keybindingItem.keybinding, keybindingItemEntry.keybindingMatches);
            }
        }
        getAriaLabel(keybindingItemEntry) {
            return keybindingItemEntry.keybindingItem.keybinding ? nls_1.localize('keybindingAriaLabel', "Keybinding is {0}.", keybindingItemEntry.keybindingItem.keybinding.getAriaLabel()) : nls_1.localize('noKeybinding', "No Keybinding assigned.");
        }
    }
    class SourceColumn extends Column {
        constructor(parent, keybindingsEditor) {
            super(keybindingsEditor);
            this.element = this.create(parent);
        }
        create(parent) {
            this.sourceColumn = DOM.append(parent, $('.column.source', { id: 'source_' + ++Column.COUNTER }));
            return this.sourceColumn;
        }
        render(keybindingItemEntry) {
            DOM.clearNode(this.sourceColumn);
            this.sourceColumn.setAttribute('aria-label', this.getAriaLabel(keybindingItemEntry));
            new highlightedLabel_1.HighlightedLabel(this.sourceColumn, false).set(keybindingItemEntry.keybindingItem.source, keybindingItemEntry.sourceMatches);
        }
        getAriaLabel(keybindingItemEntry) {
            return nls_1.localize('sourceAriaLabel', "Source is {0}.", keybindingItemEntry.keybindingItem.source);
        }
    }
    let WhenColumn = class WhenColumn extends Column {
        constructor(parent, keybindingsEditor, contextViewService, themeService) {
            super(keybindingsEditor);
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.renderDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onDidAccept = this._register(new event_1.Emitter());
            this.onDidAccept = this._onDidAccept.event;
            this._onDidReject = this._register(new event_1.Emitter());
            this.onDidReject = this._onDidReject.event;
            this.element = this.create(parent);
        }
        create(parent) {
            const column = DOM.append(parent, $('.column.when', { id: 'when_' + ++Column.COUNTER }));
            this.whenLabel = DOM.append(column, $('div.when-label'));
            this.whenInput = new inputBox_1.InputBox(column, this.contextViewService, {
                validationOptions: {
                    validation: (value) => {
                        try {
                            contextkey_1.ContextKeyExpr.deserialize(value, true);
                        }
                        catch (error) {
                            return {
                                content: error.message,
                                formatContent: true,
                                type: 3 /* ERROR */
                            };
                        }
                        return null;
                    }
                },
                ariaLabel: nls_1.localize('whenContextInputAriaLabel', "Type when context. Press Enter to confirm or Escape to cancel.")
            });
            this._register(styler_1.attachInputBoxStyler(this.whenInput, this.themeService));
            this._register(DOM.addStandardDisposableListener(this.whenInput.inputElement, DOM.EventType.KEY_DOWN, e => this.onInputKeyDown(e)));
            this._register(DOM.addDisposableListener(this.whenInput.inputElement, DOM.EventType.BLUR, () => this.cancelEditing()));
            return column;
        }
        onInputKeyDown(e) {
            let handled = false;
            if (e.equals(3 /* Enter */)) {
                this.finishEditing();
                handled = true;
            }
            else if (e.equals(9 /* Escape */)) {
                this.cancelEditing();
                handled = true;
            }
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        startEditing() {
            DOM.addClass(this.element, 'input-mode');
            this.whenInput.focus();
            this.whenInput.select();
        }
        finishEditing() {
            DOM.removeClass(this.element, 'input-mode');
            this._onDidAccept.fire();
        }
        cancelEditing() {
            DOM.removeClass(this.element, 'input-mode');
            this._onDidReject.fire();
        }
        render(keybindingItemEntry) {
            this.renderDisposables.clear();
            DOM.clearNode(this.whenLabel);
            this.keybindingsEditor.onDefineWhenExpression(e => {
                if (keybindingItemEntry === e) {
                    this.startEditing();
                }
            }, this, this.renderDisposables);
            this.whenInput.value = keybindingItemEntry.keybindingItem.when || '';
            this.whenLabel.setAttribute('aria-label', this.getAriaLabel(keybindingItemEntry));
            DOM.toggleClass(this.whenLabel, 'code', !!keybindingItemEntry.keybindingItem.when);
            DOM.toggleClass(this.whenLabel, 'empty', !keybindingItemEntry.keybindingItem.when);
            if (keybindingItemEntry.keybindingItem.when) {
                const whenLabel = new highlightedLabel_1.HighlightedLabel(this.whenLabel, false);
                whenLabel.set(keybindingItemEntry.keybindingItem.when, keybindingItemEntry.whenMatches);
                this.element.title = keybindingItemEntry.keybindingItem.when;
                whenLabel.element.title = keybindingItemEntry.keybindingItem.when;
            }
            else {
                this.whenLabel.textContent = '—';
                this.element.title = '';
            }
            this.onDidAccept(() => {
                this.keybindingsEditor.updateKeybinding(keybindingItemEntry, keybindingItemEntry.keybindingItem.keybinding ? keybindingItemEntry.keybindingItem.keybinding.getUserSettingsLabel() || '' : '', this.whenInput.value);
                this.keybindingsEditor.selectKeybinding(keybindingItemEntry);
            }, this, this.renderDisposables);
            this.onDidReject(() => {
                this.whenInput.value = keybindingItemEntry.keybindingItem.when || '';
                this.keybindingsEditor.selectKeybinding(keybindingItemEntry);
            }, this, this.renderDisposables);
        }
        getAriaLabel(keybindingItemEntry) {
            return keybindingItemEntry.keybindingItem.when ? nls_1.localize('whenAriaLabel', "When is {0}.", keybindingItemEntry.keybindingItem.when) : nls_1.localize('noWhen', "No when context.");
        }
    };
    WhenColumn = __decorate([
        __param(2, contextView_1.IContextViewService),
        __param(3, themeService_1.IThemeService)
    ], WhenColumn);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const listHighlightForegroundColor = theme.getColor(colorRegistry_1.listHighlightForeground);
        if (listHighlightForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-list-container .monaco-list-row > .column .highlight { color: ${listHighlightForegroundColor}; }`);
        }
        const listActiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        if (listActiveSelectionForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-list-container .monaco-list:focus .monaco-list-row.selected.focused > .column .monaco-keybinding-key { color: ${listActiveSelectionForegroundColor}; }`);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-list-container .monaco-list:focus .monaco-list-row.selected > .column .monaco-keybinding-key { color: ${listActiveSelectionForegroundColor}; }`);
        }
        const listInactiveFocusAndSelectionForegroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionForeground);
        if (listActiveSelectionForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-list-container .monaco-list .monaco-list-row.selected > .column .monaco-keybinding-key { color: ${listInactiveFocusAndSelectionForegroundColor}; }`);
        }
        const listHoverForegroundColor = theme.getColor(colorRegistry_1.listHoverForeground);
        if (listHoverForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-list-container .monaco-list .monaco-list-row:hover:not(.selected):not(.focused) > .column .monaco-keybinding-key { color: ${listHoverForegroundColor}; }`);
        }
        const listFocusForegroundColor = theme.getColor(colorRegistry_1.listFocusForeground);
        if (listFocusForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-list-container .monaco-list .monaco-list-row.focused > .column .monaco-keybinding-key { color: ${listFocusForegroundColor}; }`);
        }
    });
});
//# sourceMappingURL=keybindingsEditor.js.map