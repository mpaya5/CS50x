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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/labels", "vs/workbench/common/editor", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/editor/titleControl", "vs/platform/quickOpen/common/quickOpen", "vs/base/common/lifecycle", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/map", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/dnd", "vs/platform/notification/common/notification", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/untitled/common/untitledEditorService", "vs/base/browser/dom", "vs/nls", "vs/workbench/browser/parts/editor/editorActions", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/platform/files/common/files", "vs/base/common/types", "vs/platform/label/common/label", "vs/css!./media/tabstitlecontrol"], function (require, exports, platform_1, labels_1, editor_1, keyboardEvent_1, touch_1, labels_2, actionbar_1, contextView_1, telemetry_1, instantiation_1, keybinding_1, contextkey_1, actions_1, titleControl_1, quickOpen_1, lifecycle_1, scrollableElement_1, map_1, themeService_1, theme_1, colorRegistry_1, dnd_1, notification_1, extensions_1, untitledEditorService_1, dom_1, nls_1, editorActions_1, configuration_1, breadcrumbsControl_1, files_1, types_1, label_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TabsTitleControl = class TabsTitleControl extends titleControl_1.TitleControl {
        constructor(parent, accessor, group, contextMenuService, instantiationService, untitledEditorService, contextKeyService, keybindingService, telemetryService, notificationService, menuService, quickOpenService, themeService, extensionService, configurationService, fileService, labelService) {
            super(parent, accessor, group, contextMenuService, instantiationService, contextKeyService, keybindingService, telemetryService, notificationService, menuService, quickOpenService, themeService, extensionService, configurationService, fileService, labelService);
            this.untitledEditorService = untitledEditorService;
            this.tabLabels = [];
            this.tabDisposables = [];
            this.layoutScheduled = this._register(new lifecycle_1.MutableDisposable());
        }
        create(parent) {
            this.titleContainer = parent;
            // Tabs and Actions Container (are on a single row with flex side-by-side)
            const tabsAndActionsContainer = document.createElement('div');
            dom_1.addClass(tabsAndActionsContainer, 'tabs-and-actions-container');
            this.titleContainer.appendChild(tabsAndActionsContainer);
            // Tabs Container
            this.tabsContainer = document.createElement('div');
            this.tabsContainer.setAttribute('role', 'tablist');
            this.tabsContainer.draggable = true;
            dom_1.addClass(this.tabsContainer, 'tabs-container');
            // Tabs Container listeners
            this.registerTabsContainerListeners();
            // Tabs Scrollbar
            this.tabsScrollbar = this._register(this.createTabsScrollbar(this.tabsContainer));
            tabsAndActionsContainer.appendChild(this.tabsScrollbar.getDomNode());
            // Editor Toolbar Container
            this.editorToolbarContainer = document.createElement('div');
            dom_1.addClass(this.editorToolbarContainer, 'editor-actions');
            tabsAndActionsContainer.appendChild(this.editorToolbarContainer);
            // Editor Actions Toolbar
            this.createEditorActionsToolBar(this.editorToolbarContainer);
            // Close Action
            this.closeOneEditorAction = this._register(this.instantiationService.createInstance(editorActions_1.CloseOneEditorAction, editorActions_1.CloseOneEditorAction.ID, editorActions_1.CloseOneEditorAction.LABEL));
            // Breadcrumbs (are on a separate row below tabs and actions)
            const breadcrumbsContainer = document.createElement('div');
            dom_1.addClass(breadcrumbsContainer, 'tabs-breadcrumbs');
            this.titleContainer.appendChild(breadcrumbsContainer);
            this.createBreadcrumbsControl(breadcrumbsContainer, { showFileIcons: true, showSymbolIcons: true, showDecorationColors: false, breadcrumbsBackground: colorRegistry_1.breadcrumbsBackground });
            // Tab Labels
            this.tabResourceLabels = this._register(this.instantiationService.createInstance(labels_2.ResourceLabels, labels_2.DEFAULT_LABELS_CONTAINER));
        }
        createTabsScrollbar(scrollable) {
            const tabsScrollbar = new scrollableElement_1.ScrollableElement(scrollable, {
                horizontal: 1 /* Auto */,
                vertical: 2 /* Hidden */,
                scrollYToX: true,
                useShadows: false,
                horizontalScrollbarSize: 3
            });
            tabsScrollbar.onScroll(e => {
                scrollable.scrollLeft = e.scrollLeft;
            });
            return tabsScrollbar;
        }
        updateBreadcrumbsControl() {
            if (this.breadcrumbsControl && this.breadcrumbsControl.update()) {
                // relayout when we have a breadcrumbs and when update changed
                // its hidden-status
                this.group.relayout();
            }
        }
        handleBreadcrumbsEnablementChange() {
            // relayout when breadcrumbs are enable/disabled
            this.group.relayout();
        }
        registerTabsContainerListeners() {
            // Group dragging
            this.enableGroupDragging(this.tabsContainer);
            // Forward scrolling inside the container to our custom scrollbar
            this._register(dom_1.addDisposableListener(this.tabsContainer, dom_1.EventType.SCROLL, () => {
                if (dom_1.hasClass(this.tabsContainer, 'scroll')) {
                    this.tabsScrollbar.setScrollPosition({
                        scrollLeft: this.tabsContainer.scrollLeft // during DND the  container gets scrolled so we need to update the custom scrollbar
                    });
                }
            }));
            // New file when double clicking on tabs container (but not tabs)
            this._register(dom_1.addDisposableListener(this.tabsContainer, dom_1.EventType.DBLCLICK, e => {
                if (e.target === this.tabsContainer) {
                    dom_1.EventHelper.stop(e);
                    this.group.openEditor(this.untitledEditorService.createOrGet(), { pinned: true /* untitled is always pinned */, index: this.group.count /* always at the end */ });
                }
            }));
            // Prevent auto-scrolling (https://github.com/Microsoft/vscode/issues/16690)
            this._register(dom_1.addDisposableListener(this.tabsContainer, dom_1.EventType.MOUSE_DOWN, (e) => {
                if (e.button === 1) {
                    e.preventDefault();
                }
            }));
            // Drop support
            this._register(new dnd_1.DragAndDropObserver(this.tabsContainer, {
                onDragEnter: e => {
                    // Always enable support to scroll while dragging
                    dom_1.addClass(this.tabsContainer, 'scroll');
                    // Return if the target is not on the tabs container
                    if (e.target !== this.tabsContainer) {
                        this.updateDropFeedback(this.tabsContainer, false); // fixes https://github.com/Microsoft/vscode/issues/52093
                        return;
                    }
                    // Return if transfer is unsupported
                    if (!this.isSupportedDropTransfer(e)) {
                        e.dataTransfer.dropEffect = 'none';
                        return;
                    }
                    // Return if dragged editor is last tab because then this is a no-op
                    let isLocalDragAndDrop = false;
                    if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                        isLocalDragAndDrop = true;
                        const localDraggedEditor = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype)[0].identifier;
                        if (this.group.id === localDraggedEditor.groupId && this.group.getIndexOfEditor(localDraggedEditor.editor) === this.group.count - 1) {
                            e.dataTransfer.dropEffect = 'none';
                            return;
                        }
                    }
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!isLocalDragAndDrop) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                    this.updateDropFeedback(this.tabsContainer, true);
                },
                onDragLeave: e => {
                    this.updateDropFeedback(this.tabsContainer, false);
                    dom_1.removeClass(this.tabsContainer, 'scroll');
                },
                onDragEnd: e => {
                    this.updateDropFeedback(this.tabsContainer, false);
                    dom_1.removeClass(this.tabsContainer, 'scroll');
                },
                onDrop: e => {
                    this.updateDropFeedback(this.tabsContainer, false);
                    dom_1.removeClass(this.tabsContainer, 'scroll');
                    if (e.target === this.tabsContainer) {
                        this.onDrop(e, this.group.count);
                    }
                }
            }));
        }
        updateEditorActionsToolbar() {
            super.updateEditorActionsToolbar();
            // Changing the actions in the toolbar can have an impact on the size of the
            // tab container, so we need to layout the tabs to make sure the active is visible
            this.layout(this.dimension);
        }
        openEditor(editor) {
            // Create tabs as needed
            for (let i = this.tabsContainer.children.length; i < this.group.count; i++) {
                this.tabsContainer.appendChild(this.createTab(i));
            }
            // An add of a tab requires to recompute all labels
            this.computeTabLabels();
            // Redraw all tabs
            this.redraw();
            // Update Breadcrumbs
            this.updateBreadcrumbsControl();
        }
        closeEditor(editor) {
            this.handleClosedEditors();
        }
        closeEditors(editors) {
            this.handleClosedEditors();
        }
        closeAllEditors() {
            this.handleClosedEditors();
        }
        handleClosedEditors() {
            // There are tabs to show
            if (this.group.activeEditor) {
                // Remove tabs that got closed
                while (this.tabsContainer.children.length > this.group.count) {
                    // Remove one tab from container (must be the last to keep indexes in order!)
                    this.tabsContainer.lastChild.remove();
                    // Remove associated tab label and widget
                    this.tabDisposables.pop().dispose();
                }
                // A removal of a label requires to recompute all labels
                this.computeTabLabels();
                // Redraw all tabs
                this.redraw();
            }
            // No tabs to show
            else {
                dom_1.clearNode(this.tabsContainer);
                this.tabDisposables = lifecycle_1.dispose(this.tabDisposables);
                this.tabResourceLabels.clear();
                this.tabLabels = [];
                this.clearEditorActionsToolbar();
            }
            // Update Breadcrumbs
            this.updateBreadcrumbsControl();
        }
        moveEditor(editor, fromIndex, targetIndex) {
            // Swap the editor label
            const editorLabel = this.tabLabels[fromIndex];
            this.tabLabels.splice(fromIndex, 1);
            this.tabLabels.splice(targetIndex, 0, editorLabel);
            // As such we need to redraw each tab
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel) => {
                this.redrawTab(editor, index, tabContainer, tabLabelWidget, tabLabel);
            });
            // Moving an editor requires a layout to keep the active editor visible
            this.layout(this.dimension);
        }
        pinEditor(editor) {
            this.withTab(editor, (tabContainer, tabLabelWidget, tabLabel) => this.redrawLabel(editor, tabContainer, tabLabelWidget, tabLabel));
        }
        setActive(isGroupActive) {
            // Activity has an impact on each tab
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel) => {
                this.redrawEditorActiveAndDirty(isGroupActive, editor, tabContainer, tabLabelWidget);
            });
            // Activity has an impact on the toolbar, so we need to update and layout
            this.updateEditorActionsToolbar();
            this.layout(this.dimension);
        }
        updateEditorLabel(editor) {
            // Update all labels to account for changes to tab labels
            this.updateEditorLabels();
        }
        updateEditorLabels() {
            // A change to a label requires to recompute all labels
            this.computeTabLabels();
            // As such we need to redraw each label
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel) => {
                this.redrawLabel(editor, tabContainer, tabLabelWidget, tabLabel);
            });
            // A change to a label requires a layout to keep the active editor visible
            this.layout(this.dimension);
        }
        updateEditorDirty(editor) {
            this.withTab(editor, (tabContainer, tabLabelWidget) => this.redrawEditorActiveAndDirty(this.accessor.activeGroup === this.group, editor, tabContainer, tabLabelWidget));
        }
        updateOptions(oldOptions, newOptions) {
            // A change to a label format options requires to recompute all labels
            if (oldOptions.labelFormat !== newOptions.labelFormat) {
                this.computeTabLabels();
            }
            // Apply new options if something of interest changed
            if (oldOptions.labelFormat !== newOptions.labelFormat ||
                oldOptions.tabCloseButton !== newOptions.tabCloseButton ||
                oldOptions.tabSizing !== newOptions.tabSizing ||
                oldOptions.showIcons !== newOptions.showIcons ||
                oldOptions.iconTheme !== newOptions.iconTheme ||
                oldOptions.highlightModifiedTabs !== newOptions.highlightModifiedTabs) {
                this.redraw();
            }
        }
        updateStyles() {
            this.redraw();
        }
        withTab(editor, fn) {
            const editorIndex = this.group.getIndexOfEditor(editor);
            const tabContainer = this.tabsContainer.children[editorIndex];
            if (tabContainer) {
                fn(tabContainer, this.tabResourceLabels.get(editorIndex), this.tabLabels[editorIndex]);
            }
        }
        createTab(index) {
            // Tab Container
            const tabContainer = document.createElement('div');
            tabContainer.draggable = true;
            tabContainer.tabIndex = 0;
            tabContainer.setAttribute('role', 'presentation'); // cannot use role "tab" here due to https://github.com/Microsoft/vscode/issues/8659
            dom_1.addClass(tabContainer, 'tab');
            // Gesture Support
            touch_1.Gesture.addTarget(tabContainer);
            // Tab Border Top
            const tabBorderTopContainer = document.createElement('div');
            dom_1.addClass(tabBorderTopContainer, 'tab-border-top-container');
            tabContainer.appendChild(tabBorderTopContainer);
            // Tab Editor Label
            const editorLabel = this.tabResourceLabels.create(tabContainer);
            // Tab Close Button
            const tabCloseContainer = document.createElement('div');
            dom_1.addClass(tabCloseContainer, 'tab-close');
            tabContainer.appendChild(tabCloseContainer);
            // Tab Border Bottom
            const tabBorderBottomContainer = document.createElement('div');
            dom_1.addClass(tabBorderBottomContainer, 'tab-border-bottom-container');
            tabContainer.appendChild(tabBorderBottomContainer);
            const tabActionRunner = new editor_1.EditorCommandsContextActionRunner({ groupId: this.group.id, editorIndex: index });
            const tabActionBar = new actionbar_1.ActionBar(tabCloseContainer, { ariaLabel: nls_1.localize('araLabelTabActions', "Tab actions"), actionRunner: tabActionRunner });
            tabActionBar.push(this.closeOneEditorAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(this.closeOneEditorAction) });
            tabActionBar.onDidBeforeRun(() => this.blockRevealActiveTabOnce());
            // Eventing
            const eventsDisposable = this.registerTabListeners(tabContainer, index);
            this.tabDisposables.push(lifecycle_1.combinedDisposable(eventsDisposable, tabActionBar, tabActionRunner, editorLabel));
            return tabContainer;
        }
        registerTabListeners(tab, index) {
            const disposables = new lifecycle_1.DisposableStore();
            const handleClickOrTouch = (e) => {
                tab.blur();
                if (e instanceof MouseEvent && e.button !== 0) {
                    if (e.button === 1) {
                        e.preventDefault(); // required to prevent auto-scrolling (https://github.com/Microsoft/vscode/issues/16690)
                    }
                    return undefined; // only for left mouse click
                }
                if (this.originatesFromTabActionBar(e)) {
                    return; // not when clicking on actions
                }
                // Open tabs editor
                const input = this.group.getEditor(index);
                if (input) {
                    this.group.openEditor(input);
                }
                return undefined;
            };
            const showContextMenu = (e) => {
                dom_1.EventHelper.stop(e);
                const input = this.group.getEditor(index);
                if (input) {
                    this.onContextMenu(input, e, tab);
                }
            };
            // Open on Click / Touch
            disposables.add(dom_1.addDisposableListener(tab, dom_1.EventType.MOUSE_DOWN, (e) => handleClickOrTouch(e)));
            disposables.add(dom_1.addDisposableListener(tab, touch_1.EventType.Tap, (e) => handleClickOrTouch(e)));
            // Touch Scroll Support
            disposables.add(dom_1.addDisposableListener(tab, touch_1.EventType.Change, (e) => {
                this.tabsScrollbar.setScrollPosition({ scrollLeft: this.tabsScrollbar.getScrollPosition().scrollLeft - e.translationX });
            }));
            // Close on mouse middle click
            disposables.add(dom_1.addDisposableListener(tab, dom_1.EventType.MOUSE_UP, (e) => {
                dom_1.EventHelper.stop(e);
                tab.blur();
                if (e.button === 1 /* Middle Button*/) {
                    e.stopPropagation(); // for https://github.com/Microsoft/vscode/issues/56715
                    this.blockRevealActiveTabOnce();
                    this.closeOneEditorAction.run({ groupId: this.group.id, editorIndex: index });
                }
            }));
            // Context menu on Shift+F10
            disposables.add(dom_1.addDisposableListener(tab, dom_1.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.shiftKey && event.keyCode === 68 /* F10 */) {
                    showContextMenu(e);
                }
            }));
            // Context menu on touch context menu gesture
            disposables.add(dom_1.addDisposableListener(tab, touch_1.EventType.Contextmenu, (e) => {
                showContextMenu(e);
            }));
            // Keyboard accessibility
            disposables.add(dom_1.addDisposableListener(tab, dom_1.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let handled = false;
                // Run action on Enter/Space
                if (event.equals(3 /* Enter */) || event.equals(10 /* Space */)) {
                    handled = true;
                    const input = this.group.getEditor(index);
                    if (input) {
                        this.group.openEditor(input);
                    }
                }
                // Navigate in editors
                else if ([15 /* LeftArrow */, 17 /* RightArrow */, 16 /* UpArrow */, 18 /* DownArrow */, 14 /* Home */, 13 /* End */].some(kb => event.equals(kb))) {
                    let targetIndex;
                    if (event.equals(15 /* LeftArrow */) || event.equals(16 /* UpArrow */)) {
                        targetIndex = index - 1;
                    }
                    else if (event.equals(17 /* RightArrow */) || event.equals(18 /* DownArrow */)) {
                        targetIndex = index + 1;
                    }
                    else if (event.equals(14 /* Home */)) {
                        targetIndex = 0;
                    }
                    else {
                        targetIndex = this.group.count - 1;
                    }
                    const target = this.group.getEditor(targetIndex);
                    if (target) {
                        handled = true;
                        this.group.openEditor(target, { preserveFocus: true });
                        this.tabsContainer.childNodes[targetIndex].focus();
                    }
                }
                if (handled) {
                    dom_1.EventHelper.stop(e, true);
                }
                // moving in the tabs container can have an impact on scrolling position, so we need to update the custom scrollbar
                this.tabsScrollbar.setScrollPosition({
                    scrollLeft: this.tabsContainer.scrollLeft
                });
            }));
            // Pin on double click
            disposables.add(dom_1.addDisposableListener(tab, dom_1.EventType.DBLCLICK, (e) => {
                dom_1.EventHelper.stop(e);
                this.group.pinEditor(this.group.getEditor(index) || undefined);
            }));
            // Context menu
            disposables.add(dom_1.addDisposableListener(tab, dom_1.EventType.CONTEXT_MENU, (e) => {
                dom_1.EventHelper.stop(e, true);
                const input = this.group.getEditor(index);
                if (input) {
                    this.onContextMenu(input, e, tab);
                }
            }, true /* use capture to fix https://github.com/Microsoft/vscode/issues/19145 */));
            // Drag support
            disposables.add(dom_1.addDisposableListener(tab, dom_1.EventType.DRAG_START, (e) => {
                const editor = this.group.getEditor(index);
                if (!editor) {
                    return;
                }
                this.editorTransfer.setData([new dnd_1.DraggedEditorIdentifier({ editor, groupId: this.group.id })], dnd_1.DraggedEditorIdentifier.prototype);
                e.dataTransfer.effectAllowed = 'copyMove';
                // Apply some datatransfer types to allow for dragging the element outside of the application
                const resource = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER });
                if (resource) {
                    this.instantiationService.invokeFunction(dnd_1.fillResourceDataTransfers, [resource], e);
                }
                // Fixes https://github.com/Microsoft/vscode/issues/18733
                dom_1.addClass(tab, 'dragged');
                dom_1.scheduleAtNextAnimationFrame(() => dom_1.removeClass(tab, 'dragged'));
            }));
            // Drop support
            disposables.add(new dnd_1.DragAndDropObserver(tab, {
                onDragEnter: e => {
                    // Update class to signal drag operation
                    dom_1.addClass(tab, 'dragged-over');
                    // Return if transfer is unsupported
                    if (!this.isSupportedDropTransfer(e)) {
                        e.dataTransfer.dropEffect = 'none';
                        return;
                    }
                    // Return if dragged editor is the current tab dragged over
                    let isLocalDragAndDrop = false;
                    if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                        isLocalDragAndDrop = true;
                        const localDraggedEditor = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype)[0].identifier;
                        if (localDraggedEditor.editor === this.group.getEditor(index) && localDraggedEditor.groupId === this.group.id) {
                            e.dataTransfer.dropEffect = 'none';
                            return;
                        }
                    }
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!isLocalDragAndDrop) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                    this.updateDropFeedback(tab, true, index);
                },
                onDragLeave: e => {
                    dom_1.removeClass(tab, 'dragged-over');
                    this.updateDropFeedback(tab, false, index);
                },
                onDragEnd: e => {
                    dom_1.removeClass(tab, 'dragged-over');
                    this.updateDropFeedback(tab, false, index);
                    this.editorTransfer.clearData(dnd_1.DraggedEditorIdentifier.prototype);
                },
                onDrop: e => {
                    dom_1.removeClass(tab, 'dragged-over');
                    this.updateDropFeedback(tab, false, index);
                    this.onDrop(e, index);
                }
            }));
            return disposables;
        }
        isSupportedDropTransfer(e) {
            if (this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype)) {
                const group = this.groupTransfer.getData(dnd_1.DraggedEditorGroupIdentifier.prototype)[0];
                if (group.identifier === this.group.id) {
                    return false; // groups cannot be dropped on title area it originates from
                }
                return true;
            }
            if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                return true; // (local) editors can always be dropped
            }
            if (e.dataTransfer && e.dataTransfer.types.length > 0) {
                return true; // optimistically allow external data (// see https://github.com/Microsoft/vscode/issues/25789)
            }
            return false;
        }
        updateDropFeedback(element, isDND, index) {
            const isTab = (typeof index === 'number');
            const editor = typeof index === 'number' ? this.group.getEditor(index) : undefined;
            const isActiveTab = isTab && !!editor && this.group.isActive(editor);
            // Background
            const noDNDBackgroundColor = isTab ? this.getColor(isActiveTab ? theme_1.TAB_ACTIVE_BACKGROUND : theme_1.TAB_INACTIVE_BACKGROUND) : null;
            element.style.backgroundColor = isDND ? this.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND) : noDNDBackgroundColor;
            // Outline
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            if (activeContrastBorderColor && isDND) {
                element.style.outlineWidth = '2px';
                element.style.outlineStyle = 'dashed';
                element.style.outlineColor = activeContrastBorderColor;
                element.style.outlineOffset = isTab ? '-5px' : '-3px';
            }
            else {
                element.style.outlineWidth = '';
                element.style.outlineStyle = '';
                element.style.outlineColor = activeContrastBorderColor || '';
                element.style.outlineOffset = '';
            }
        }
        computeTabLabels() {
            const { labelFormat } = this.accessor.partOptions;
            const { verbosity, shortenDuplicates } = this.getLabelConfigFlags(labelFormat);
            // Build labels and descriptions for each editor
            const labels = this.group.editors.map(editor => ({
                editor,
                name: editor.getName(),
                description: editor.getDescription(verbosity),
                title: types_1.withNullAsUndefined(editor.getTitle(2 /* LONG */))
            }));
            // Shorten labels as needed
            if (shortenDuplicates) {
                this.shortenTabLabels(labels);
            }
            this.tabLabels = labels;
        }
        shortenTabLabels(labels) {
            // Gather duplicate titles, while filtering out invalid descriptions
            const mapTitleToDuplicates = new Map();
            for (const label of labels) {
                if (typeof label.description === 'string') {
                    map_1.getOrSet(mapTitleToDuplicates, label.name, []).push(label);
                }
                else {
                    label.description = '';
                }
            }
            // Identify duplicate titles and shorten descriptions
            mapTitleToDuplicates.forEach(duplicateTitles => {
                // Remove description if the title isn't duplicated
                if (duplicateTitles.length === 1) {
                    duplicateTitles[0].description = '';
                    return;
                }
                // Identify duplicate descriptions
                const mapDescriptionToDuplicates = new Map();
                for (const label of duplicateTitles) {
                    map_1.getOrSet(mapDescriptionToDuplicates, label.description, []).push(label);
                }
                // For editors with duplicate descriptions, check whether any long descriptions differ
                let useLongDescriptions = false;
                mapDescriptionToDuplicates.forEach((duplicateDescriptions, name) => {
                    if (!useLongDescriptions && duplicateDescriptions.length > 1) {
                        const [first, ...rest] = duplicateDescriptions.map(({ editor }) => editor.getDescription(2 /* LONG */));
                        useLongDescriptions = rest.some(description => description !== first);
                    }
                });
                // If so, replace all descriptions with long descriptions
                if (useLongDescriptions) {
                    mapDescriptionToDuplicates.clear();
                    duplicateTitles.forEach(label => {
                        label.description = label.editor.getDescription(2 /* LONG */);
                        map_1.getOrSet(mapDescriptionToDuplicates, label.description, []).push(label);
                    });
                }
                // Obtain final set of descriptions
                const descriptions = [];
                mapDescriptionToDuplicates.forEach((_, description) => descriptions.push(description));
                // Remove description if all descriptions are identical
                if (descriptions.length === 1) {
                    for (const label of mapDescriptionToDuplicates.get(descriptions[0]) || []) {
                        label.description = '';
                    }
                    return;
                }
                // Shorten descriptions
                const shortenedDescriptions = labels_1.shorten(descriptions);
                descriptions.forEach((description, i) => {
                    for (const label of mapDescriptionToDuplicates.get(description) || []) {
                        label.description = shortenedDescriptions[i];
                    }
                });
            });
        }
        getLabelConfigFlags(value) {
            switch (value) {
                case 'short':
                    return { verbosity: 0 /* SHORT */, shortenDuplicates: false };
                case 'medium':
                    return { verbosity: 1 /* MEDIUM */, shortenDuplicates: false };
                case 'long':
                    return { verbosity: 2 /* LONG */, shortenDuplicates: false };
                default:
                    return { verbosity: 1 /* MEDIUM */, shortenDuplicates: true };
            }
        }
        redraw() {
            // For each tab
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel) => {
                this.redrawTab(editor, index, tabContainer, tabLabelWidget, tabLabel);
            });
            // Update Editor Actions Toolbar
            this.updateEditorActionsToolbar();
            // Ensure the active tab is always revealed
            this.layout(this.dimension);
        }
        forEachTab(fn) {
            this.group.editors.forEach((editor, index) => {
                const tabContainer = this.tabsContainer.children[index];
                if (tabContainer) {
                    fn(editor, index, tabContainer, this.tabResourceLabels.get(index), this.tabLabels[index]);
                }
            });
        }
        redrawTab(editor, index, tabContainer, tabLabelWidget, tabLabel) {
            // Label
            this.redrawLabel(editor, tabContainer, tabLabelWidget, tabLabel);
            // Borders / Outline
            const borderRightColor = (this.getColor(theme_1.TAB_BORDER) || this.getColor(colorRegistry_1.contrastBorder));
            tabContainer.style.borderRight = borderRightColor ? `1px solid ${borderRightColor}` : null;
            tabContainer.style.outlineColor = this.getColor(colorRegistry_1.activeContrastBorder) || '';
            // Settings
            const options = this.accessor.partOptions;
            ['off', 'left', 'right'].forEach(option => {
                const domAction = options.tabCloseButton === option ? dom_1.addClass : dom_1.removeClass;
                domAction(tabContainer, `close-button-${option}`);
            });
            ['fit', 'shrink'].forEach(option => {
                const domAction = options.tabSizing === option ? dom_1.addClass : dom_1.removeClass;
                domAction(tabContainer, `sizing-${option}`);
            });
            if (options.showIcons && !!options.iconTheme) {
                dom_1.addClass(tabContainer, 'has-icon-theme');
            }
            else {
                dom_1.removeClass(tabContainer, 'has-icon-theme');
            }
            // Active / dirty state
            this.redrawEditorActiveAndDirty(this.accessor.activeGroup === this.group, editor, tabContainer, tabLabelWidget);
        }
        redrawLabel(editor, tabContainer, tabLabelWidget, tabLabel) {
            const name = tabLabel.name;
            const description = tabLabel.description || '';
            const title = tabLabel.title || '';
            // Container
            tabContainer.setAttribute('aria-label', `${name}, tab`);
            tabContainer.title = title;
            // Label
            tabLabelWidget.setResource({ name, description, resource: editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.MASTER }) || undefined }, { title, extraClasses: ['tab-label'], italic: !this.group.isPinned(editor) });
        }
        redrawEditorActiveAndDirty(isGroupActive, editor, tabContainer, tabLabelWidget) {
            const isTabActive = this.group.isActive(editor);
            const hasModifiedBorderTop = this.doRedrawEditorDirty(isGroupActive, isTabActive, editor, tabContainer);
            this.doRedrawEditorActive(isGroupActive, !hasModifiedBorderTop, editor, tabContainer, tabLabelWidget);
        }
        doRedrawEditorActive(isGroupActive, allowBorderTop, editor, tabContainer, tabLabelWidget) {
            // Tab is active
            if (this.group.isActive(editor)) {
                // Container
                dom_1.addClass(tabContainer, 'active');
                tabContainer.setAttribute('aria-selected', 'true');
                tabContainer.style.backgroundColor = this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_BACKGROUND : theme_1.TAB_UNFOCUSED_ACTIVE_BACKGROUND);
                const activeTabBorderColorBottom = this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_BORDER : theme_1.TAB_UNFOCUSED_ACTIVE_BORDER);
                if (activeTabBorderColorBottom) {
                    dom_1.addClass(tabContainer, 'tab-border-bottom');
                    tabContainer.style.setProperty('--tab-border-bottom-color', activeTabBorderColorBottom.toString());
                }
                else {
                    dom_1.removeClass(tabContainer, 'tab-border-bottom');
                    tabContainer.style.removeProperty('--tab-border-bottom-color');
                }
                const activeTabBorderColorTop = allowBorderTop ? this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_BORDER_TOP : theme_1.TAB_UNFOCUSED_ACTIVE_BORDER_TOP) : undefined;
                if (activeTabBorderColorTop) {
                    dom_1.addClass(tabContainer, 'tab-border-top');
                    tabContainer.style.setProperty('--tab-border-top-color', activeTabBorderColorTop.toString());
                }
                else {
                    dom_1.removeClass(tabContainer, 'tab-border-top');
                    tabContainer.style.removeProperty('--tab-border-top-color');
                }
                // Label
                tabLabelWidget.element.style.color = this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_FOREGROUND : theme_1.TAB_UNFOCUSED_ACTIVE_FOREGROUND);
            }
            // Tab is inactive
            else {
                // Container
                dom_1.removeClass(tabContainer, 'active');
                tabContainer.setAttribute('aria-selected', 'false');
                tabContainer.style.backgroundColor = this.getColor(theme_1.TAB_INACTIVE_BACKGROUND);
                tabContainer.style.boxShadow = null;
                // Label
                tabLabelWidget.element.style.color = this.getColor(isGroupActive ? theme_1.TAB_INACTIVE_FOREGROUND : theme_1.TAB_UNFOCUSED_INACTIVE_FOREGROUND);
            }
        }
        doRedrawEditorDirty(isGroupActive, isTabActive, editor, tabContainer) {
            let hasModifiedBorderColor = false;
            // Tab: dirty
            if (editor.isDirty()) {
                dom_1.addClass(tabContainer, 'dirty');
                // Highlight modified tabs with a border if configured
                if (this.accessor.partOptions.highlightModifiedTabs) {
                    let modifiedBorderColor;
                    if (isGroupActive && isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_ACTIVE_MODIFIED_BORDER);
                    }
                    else if (isGroupActive && !isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_INACTIVE_MODIFIED_BORDER);
                    }
                    else if (!isGroupActive && isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_MODIFIED_BORDER);
                    }
                    else {
                        modifiedBorderColor = this.getColor(theme_1.TAB_UNFOCUSED_INACTIVE_MODIFIED_BORDER);
                    }
                    if (modifiedBorderColor) {
                        hasModifiedBorderColor = true;
                        dom_1.addClass(tabContainer, 'dirty-border-top');
                        tabContainer.style.setProperty('--tab-dirty-border-top-color', modifiedBorderColor);
                    }
                }
                else {
                    dom_1.removeClass(tabContainer, 'dirty-border-top');
                    tabContainer.style.removeProperty('--tab-dirty-border-top-color');
                }
            }
            // Tab: not dirty
            else {
                dom_1.removeClass(tabContainer, 'dirty');
                dom_1.removeClass(tabContainer, 'dirty-border-top');
                tabContainer.style.removeProperty('--tab-dirty-border-top-color');
            }
            return hasModifiedBorderColor;
        }
        layout(dimension) {
            this.dimension = dimension;
            const activeTab = this.group.activeEditor ? this.getTab(this.group.activeEditor) : undefined;
            if (!activeTab || !this.dimension) {
                return;
            }
            // The layout of tabs can be an expensive operation because we access DOM properties
            // that can result in the browser doing a full page layout to validate them. To buffer
            // this a little bit we try at least to schedule this work on the next animation frame.
            if (!this.layoutScheduled.value) {
                this.layoutScheduled.value = dom_1.scheduleAtNextAnimationFrame(() => {
                    this.doLayout(this.dimension);
                    this.layoutScheduled.clear();
                });
            }
        }
        doLayout(dimension) {
            const activeTab = this.group.activeEditor ? this.getTab(this.group.activeEditor) : undefined;
            if (!activeTab) {
                return;
            }
            if (this.breadcrumbsControl && !this.breadcrumbsControl.isHidden()) {
                this.breadcrumbsControl.layout({ width: dimension.width, height: breadcrumbsControl_1.BreadcrumbsControl.HEIGHT });
                this.tabsScrollbar.getDomNode().style.height = `${dimension.height - breadcrumbsControl_1.BreadcrumbsControl.HEIGHT}px`;
            }
            const visibleContainerWidth = this.tabsContainer.offsetWidth;
            const totalContainerWidth = this.tabsContainer.scrollWidth;
            let activeTabPosX;
            let activeTabWidth;
            if (!this.blockRevealActiveTab) {
                activeTabPosX = activeTab.offsetLeft;
                activeTabWidth = activeTab.offsetWidth;
            }
            // Update scrollbar
            this.tabsScrollbar.setScrollDimensions({
                width: visibleContainerWidth,
                scrollWidth: totalContainerWidth
            });
            // Return now if we are blocked to reveal the active tab and clear flag
            if (this.blockRevealActiveTab) {
                this.blockRevealActiveTab = false;
                return;
            }
            // Reveal the active one
            const containerScrollPosX = this.tabsScrollbar.getScrollPosition().scrollLeft;
            const activeTabFits = activeTabWidth <= visibleContainerWidth;
            // Tab is overflowing to the right: Scroll minimally until the element is fully visible to the right
            // Note: only try to do this if we actually have enough width to give to show the tab fully!
            if (activeTabFits && containerScrollPosX + visibleContainerWidth < activeTabPosX + activeTabWidth) {
                this.tabsScrollbar.setScrollPosition({
                    scrollLeft: containerScrollPosX + ((activeTabPosX + activeTabWidth) /* right corner of tab */ - (containerScrollPosX + visibleContainerWidth) /* right corner of view port */)
                });
            }
            // Tab is overlflowng to the left or does not fit: Scroll it into view to the left
            else if (containerScrollPosX > activeTabPosX || !activeTabFits) {
                this.tabsScrollbar.setScrollPosition({
                    scrollLeft: activeTabPosX
                });
            }
        }
        getTab(editor) {
            const editorIndex = this.group.getIndexOfEditor(editor);
            if (editorIndex >= 0) {
                return this.tabsContainer.children[editorIndex];
            }
            return undefined;
        }
        blockRevealActiveTabOnce() {
            // When closing tabs through the tab close button or gesture, the user
            // might want to rapidly close tabs in sequence and as such revealing
            // the active tab after each close would be annoying. As such we block
            // the automated revealing of the active tab once after the close is
            // triggered.
            this.blockRevealActiveTab = true;
        }
        originatesFromTabActionBar(e) {
            let element;
            if (e instanceof MouseEvent) {
                element = (e.target || e.srcElement);
            }
            else {
                element = e.initialTarget;
            }
            return !!dom_1.findParentWithClass(element, 'action-item', 'tab');
        }
        onDrop(e, targetIndex) {
            dom_1.EventHelper.stop(e, true);
            this.updateDropFeedback(this.tabsContainer, false);
            dom_1.removeClass(this.tabsContainer, 'scroll');
            // Local Editor DND
            if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                const draggedEditor = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype)[0].identifier;
                const sourceGroup = this.accessor.getGroup(draggedEditor.groupId);
                if (sourceGroup) {
                    // Move editor to target position and index
                    if (this.isMoveOperation(e, draggedEditor.groupId)) {
                        sourceGroup.moveEditor(draggedEditor.editor, this.group, { index: targetIndex });
                    }
                    // Copy editor to target position and index
                    else {
                        sourceGroup.copyEditor(draggedEditor.editor, this.group, { index: targetIndex });
                    }
                }
                this.group.focus();
                this.editorTransfer.clearData(dnd_1.DraggedEditorIdentifier.prototype);
            }
            // Local Editor Group DND
            else if (this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype)) {
                const sourceGroup = this.accessor.getGroup(this.groupTransfer.getData(dnd_1.DraggedEditorGroupIdentifier.prototype)[0].identifier);
                if (sourceGroup) {
                    const mergeGroupOptions = { index: targetIndex };
                    if (!this.isMoveOperation(e, sourceGroup.id)) {
                        mergeGroupOptions.mode = 0 /* COPY_EDITORS */;
                    }
                    this.accessor.mergeGroup(sourceGroup, this.group, mergeGroupOptions);
                }
                this.group.focus();
                this.groupTransfer.clearData(dnd_1.DraggedEditorGroupIdentifier.prototype);
            }
            // External DND
            else {
                const dropHandler = this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: false /* open workspace file as file if dropped */ });
                dropHandler.handleDrop(e, () => this.group, () => this.group.focus(), targetIndex);
            }
        }
        isMoveOperation(e, source) {
            const isCopy = (e.ctrlKey && !platform_1.isMacintosh) || (e.altKey && platform_1.isMacintosh);
            return !isCopy || source === this.group.id;
        }
        dispose() {
            super.dispose();
            this.tabDisposables = lifecycle_1.dispose(this.tabDisposables);
        }
    };
    TabsTitleControl = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, untitledEditorService_1.IUntitledEditorService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, notification_1.INotificationService),
        __param(10, actions_1.IMenuService),
        __param(11, quickOpen_1.IQuickOpenService),
        __param(12, themeService_1.IThemeService),
        __param(13, extensions_1.IExtensionService),
        __param(14, configuration_1.IConfigurationService),
        __param(15, files_1.IFileService),
        __param(16, label_1.ILabelService)
    ], TabsTitleControl);
    exports.TabsTitleControl = TabsTitleControl;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Add border between tabs and breadcrumbs in high contrast mode.
        if (theme.type === themeService_1.HIGH_CONTRAST) {
            const borderColor = (theme.getColor(theme_1.TAB_BORDER) || theme.getColor(colorRegistry_1.contrastBorder));
            collector.addRule(`
		.monaco-workbench div.tabs-and-actions-container {
			border-bottom: 1px solid ${borderColor};
		}
		`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const activeContrastBorderColor = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (activeContrastBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active:hover  {
				outline: 1px solid;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				outline: 1px dashed;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active > .tab-close .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active:hover > .tab-close .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.dirty > .tab-close .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover > .tab-close .action-label {
				opacity: 1 !important;
			}
		`);
        }
        // High Contrast Border Color for Editor Actions
        const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
        if (colorRegistry_1.contrastBorder) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .editor-actions {
				outline: 1px solid ${contrastBorderColor}
			}
		`);
        }
        // Hover Background
        const tabHoverBackground = theme.getColor(theme_1.TAB_HOVER_BACKGROUND);
        if (tabHoverBackground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover  {
				background-color: ${tabHoverBackground} !important;
			}
		`);
        }
        const tabUnfocusedHoverBackground = theme.getColor(theme_1.TAB_UNFOCUSED_HOVER_BACKGROUND);
        if (tabUnfocusedHoverBackground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				background-color: ${tabUnfocusedHoverBackground} !important;
			}
		`);
        }
        // Hover Border
        const tabHoverBorder = theme.getColor(theme_1.TAB_HOVER_BORDER);
        if (tabHoverBorder) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover  {
				box-shadow: ${tabHoverBorder} 0 -1px inset !important;
			}
		`);
        }
        const tabUnfocusedHoverBorder = theme.getColor(theme_1.TAB_UNFOCUSED_HOVER_BORDER);
        if (tabUnfocusedHoverBorder) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				box-shadow: ${tabUnfocusedHoverBorder} 0 -1px inset !important;
			}
		`);
        }
        // Fade out styles via linear gradient (when tabs are set to shrink)
        if (theme.type !== 'hc') {
            const workbenchBackground = theme_1.WORKBENCH_BACKGROUND(theme);
            const editorBackgroundColor = theme.getColor(colorRegistry_1.editorBackground);
            const editorGroupHeaderTabsBackground = theme.getColor(theme_1.EDITOR_GROUP_HEADER_TABS_BACKGROUND);
            const editorDragAndDropBackground = theme.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND);
            let adjustedTabBackground;
            if (editorGroupHeaderTabsBackground && editorBackgroundColor) {
                adjustedTabBackground = editorGroupHeaderTabsBackground.flatten(editorBackgroundColor, editorBackgroundColor, workbenchBackground);
            }
            let adjustedTabDragBackground;
            if (editorGroupHeaderTabsBackground && editorBackgroundColor && editorDragAndDropBackground && editorBackgroundColor) {
                adjustedTabDragBackground = editorGroupHeaderTabsBackground.flatten(editorBackgroundColor, editorDragAndDropBackground, editorBackgroundColor, workbenchBackground);
            }
            // Adjust gradient for focused and unfocused hover background
            const makeTabHoverBackgroundRule = (color, colorDrag, hasFocus = false) => `
				.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${hasFocus ? '.active' : ''} > .title .tabs-container > .tab.sizing-shrink:not(.dragged):hover > .tab-label::after {
					background: linear-gradient(to left, ${color}, transparent) !important;
				}

				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${hasFocus ? '.active' : ''} > .title .tabs-container > .tab.sizing-shrink:not(.dragged):hover > .tab-label::after {
					background: linear-gradient(to left, ${colorDrag}, transparent) !important;
				}
		`;
            // Adjust gradient for (focused) hover background
            if (tabHoverBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabHoverBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabHoverBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabHoverBackgroundRule(adjustedColor, adjustedColorDrag, true));
            }
            // Adjust gradient for unfocused hover background
            if (tabUnfocusedHoverBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabUnfocusedHoverBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabUnfocusedHoverBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabHoverBackgroundRule(adjustedColor, adjustedColorDrag));
            }
            // Adjust gradient for drag and drop background
            if (editorDragAndDropBackground && adjustedTabDragBackground) {
                const adjustedColorDrag = editorDragAndDropBackground.flatten(adjustedTabDragBackground);
                collector.addRule(`
			.monaco-workbench .part.editor > .content.dragged-over .editor-group-container.active > .title .tabs-container > .tab.sizing-shrink.dragged-over:not(.active):not(.dragged) > .tab-label::after,
			.monaco-workbench .part.editor > .content.dragged-over .editor-group-container:not(.active) > .title .tabs-container > .tab.sizing-shrink.dragged-over:not(.dragged) > .tab-label::after {
				background: linear-gradient(to left, ${adjustedColorDrag}, transparent) !important;
			}
		`);
            }
            // Adjust gradient for active tab background (focused and unfocused editor groups)
            const makeTabActiveBackgroundRule = (color, colorDrag, hasFocus = false) => `
				.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${hasFocus ? '.active' : ':not(.active)'} > .title .tabs-container > .tab.sizing-shrink.active:not(.dragged) > .tab-label::after {
					background: linear-gradient(to left, ${color}, transparent);
				}

				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${hasFocus ? '.active' : ':not(.active)'} > .title .tabs-container > .tab.sizing-shrink.active:not(.dragged) > .tab-label::after {
					background: linear-gradient(to left, ${colorDrag}, transparent);
				}
		`;
            // Adjust gradient for unfocused active tab background
            const tabActiveBackground = theme.getColor(theme_1.TAB_ACTIVE_BACKGROUND);
            if (tabActiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabActiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabActiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabActiveBackgroundRule(adjustedColor, adjustedColorDrag, true));
            }
            // Adjust gradient for unfocused active tab background
            const tabUnfocusedActiveBackground = theme.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_BACKGROUND);
            if (tabUnfocusedActiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabUnfocusedActiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabUnfocusedActiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabActiveBackgroundRule(adjustedColor, adjustedColorDrag));
            }
            // Adjust gradient for inactive tab background
            const tabInactiveBackground = theme.getColor(theme_1.TAB_INACTIVE_BACKGROUND);
            if (tabInactiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabInactiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabInactiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(`
			.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container > .title .tabs-container > .tab.sizing-shrink:not(.dragged) > .tab-label::after {
				background: linear-gradient(to left, ${adjustedColor}, transparent);
			}

			.monaco-workbench .part.editor > .content.dragged-over .editor-group-container > .title .tabs-container > .tab.sizing-shrink:not(.dragged) > .tab-label::after {
				background: linear-gradient(to left, ${adjustedColorDrag}, transparent);
			}
		`);
            }
        }
    });
});
//# sourceMappingURL=tabsTitleControl.js.map