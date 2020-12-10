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
define(["require", "exports", "vs/base/browser/ui/sash/sash", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/storage/common/storage", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/platform/theme/common/themeService", "vs/base/common/platform", "vs/base/common/decorators", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/browser"], function (require, exports, sash_1, layoutService_1, viewlet_1, storage_1, contextView_1, lifecycle_1, themeService_1, platform_1, decorators_1, dom_1, editorGroupsService_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const TITLE_BAR_HEIGHT = platform_1.isMacintosh && !platform_1.isWeb ? 22 : 30;
    const STATUS_BAR_HEIGHT = 22;
    const ACTIVITY_BAR_WIDTH = 48;
    const MIN_SIDEBAR_PART_WIDTH = 170;
    const DEFAULT_SIDEBAR_PART_WIDTH = 300;
    const HIDE_SIDEBAR_WIDTH_THRESHOLD = 50;
    const MIN_PANEL_PART_HEIGHT = 77;
    const MIN_PANEL_PART_WIDTH = 300;
    const DEFAULT_PANEL_PART_SIZE = 350;
    const DEFAULT_PANEL_SIZE_COEFFICIENT = 0.4;
    const PANEL_SIZE_BEFORE_MAXIMIZED_BOUNDARY = 0.7;
    const HIDE_PANEL_HEIGHT_THRESHOLD = 50;
    const HIDE_PANEL_WIDTH_THRESHOLD = 100;
    /**
     * @deprecated to be replaced by new Grid layout
     */
    let WorkbenchLegacyLayout = class WorkbenchLegacyLayout extends lifecycle_1.Disposable {
        constructor(parent, workbenchContainer, parts, storageService, contextViewService, layoutService, viewletService, themeService, editorGroupService) {
            super();
            this.parent = parent;
            this.workbenchContainer = workbenchContainer;
            this.parts = parts;
            this.storageService = storageService;
            this.contextViewService = contextViewService;
            this.layoutService = layoutService;
            this.viewletService = viewletService;
            this.themeService = themeService;
            this.editorGroupService = editorGroupService;
            // Restore state
            this.restorePreviousState();
            // Create layout sashes
            this.sashXOne = new sash_1.Sash(this.workbenchContainer, this);
            this.sashXTwo = new sash_1.Sash(this.workbenchContainer, this);
            this.sashY = new sash_1.Sash(this.workbenchContainer, this, { orientation: 1 /* HORIZONTAL */ });
            this.registerListeners();
        }
        restorePreviousState() {
            this._sidebarWidth = Math.max(this.partLayoutInfo.sidebar.minWidth, this.storageService.getNumber(WorkbenchLegacyLayout.sashXOneWidthSettingsKey, 0 /* GLOBAL */, DEFAULT_SIDEBAR_PART_WIDTH));
            this._panelWidth = Math.max(this.partLayoutInfo.panel.minWidth, this.storageService.getNumber(WorkbenchLegacyLayout.sashXTwoWidthSettingsKey, 0 /* GLOBAL */, DEFAULT_PANEL_PART_SIZE));
            this._panelHeight = Math.max(this.partLayoutInfo.panel.minHeight, this.storageService.getNumber(WorkbenchLegacyLayout.sashYHeightSettingsKey, 0 /* GLOBAL */, DEFAULT_PANEL_PART_SIZE));
            this.panelMaximized = false;
            this.panelSizeBeforeMaximized = this.storageService.getNumber(WorkbenchLegacyLayout.panelSizeBeforeMaximizedKey, 0 /* GLOBAL */, 0);
        }
        registerListeners() {
            this._register(this.themeService.onThemeChange(_ => this.layout()));
            this._register(this.parts.editor.onDidSizeConstraintsChange(() => this.onDidEditorSizeConstraintsChange()));
            this.registerSashListeners();
        }
        onDidEditorSizeConstraintsChange() {
            if (this.workbenchSize && (this.sidebarWidth || this.panelHeight)) {
                if (this.editorGroupService.count > 1) {
                    const minimumEditorPartSize = new dom_1.Dimension(this.parts.editor.minimumWidth, this.parts.editor.minimumHeight);
                    const sidebarOverflow = this.workbenchSize.width - this.sidebarWidth < minimumEditorPartSize.width;
                    let panelOverflow = false;
                    if (this.layoutService.getPanelPosition() === 1 /* RIGHT */) {
                        panelOverflow = this.workbenchSize.width - this.panelWidth - this.sidebarWidth < minimumEditorPartSize.width;
                    }
                    else {
                        panelOverflow = this.workbenchSize.height - this.panelHeight < minimumEditorPartSize.height;
                    }
                    // Trigger a layout if we detect that either sidebar or panel overflow
                    // as a matter of a new editor group being added to the editor part
                    if (sidebarOverflow || panelOverflow) {
                        this.layout();
                    }
                }
            }
        }
        get activitybarWidth() {
            if (this.layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */)) {
                return this.partLayoutInfo.activitybar.width;
            }
            return 0;
        }
        get panelHeight() {
            const panelPosition = this.layoutService.getPanelPosition();
            if (panelPosition === 1 /* RIGHT */) {
                return this.sidebarHeight;
            }
            return this._panelHeight;
        }
        set panelHeight(value) {
            this._panelHeight = Math.min(this.computeMaxPanelHeight(), Math.max(this.partLayoutInfo.panel.minHeight, value));
        }
        get panelWidth() {
            const panelPosition = this.layoutService.getPanelPosition();
            if (panelPosition === 2 /* BOTTOM */) {
                return this.workbenchSize.width - this.activitybarWidth - this.sidebarWidth;
            }
            return this._panelWidth;
        }
        set panelWidth(value) {
            this._panelWidth = Math.min(this.computeMaxPanelWidth(), Math.max(this.partLayoutInfo.panel.minWidth, value));
        }
        computeMaxPanelWidth() {
            let minSidebarWidth;
            if (this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                if (this.layoutService.getSideBarPosition() === 0 /* LEFT */) {
                    minSidebarWidth = this.partLayoutInfo.sidebar.minWidth;
                }
                else {
                    minSidebarWidth = this.sidebarWidth;
                }
            }
            else {
                minSidebarWidth = 0;
            }
            return Math.max(this.partLayoutInfo.panel.minWidth, this.workbenchSize.width - this.parts.editor.minimumWidth - minSidebarWidth - this.activitybarWidth);
        }
        computeMaxPanelHeight() {
            return Math.max(this.partLayoutInfo.panel.minHeight, this.sidebarHeight /* simplification for: window.height - status.height - title-height */ - this.parts.editor.minimumHeight);
        }
        get sidebarWidth() {
            if (this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                return this._sidebarWidth;
            }
            return 0;
        }
        set sidebarWidth(value) {
            const panelMinWidth = this.layoutService.getPanelPosition() === 1 /* RIGHT */ && this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */) ? this.partLayoutInfo.panel.minWidth : 0;
            const maxSidebarWidth = this.workbenchSize.width - this.activitybarWidth - this.parts.editor.minimumWidth - panelMinWidth;
            this._sidebarWidth = Math.max(this.partLayoutInfo.sidebar.minWidth, Math.min(maxSidebarWidth, value));
        }
        get partLayoutInfo() {
            return {
                titlebar: {
                    height: TITLE_BAR_HEIGHT
                },
                activitybar: {
                    width: ACTIVITY_BAR_WIDTH
                },
                sidebar: {
                    minWidth: MIN_SIDEBAR_PART_WIDTH
                },
                panel: {
                    minHeight: MIN_PANEL_PART_HEIGHT,
                    minWidth: MIN_PANEL_PART_WIDTH
                },
                statusbar: {
                    height: STATUS_BAR_HEIGHT
                }
            };
        }
        registerSashListeners() {
            let startX = 0;
            let startY = 0;
            let startXTwo = 0;
            let startSidebarWidth;
            let startPanelHeight;
            let startPanelWidth;
            this._register(this.sashXOne.onDidStart((e) => {
                startSidebarWidth = this.sidebarWidth;
                startX = e.startX;
            }));
            this._register(this.sashY.onDidStart((e) => {
                startPanelHeight = this.panelHeight;
                startY = e.startY;
            }));
            this._register(this.sashXTwo.onDidStart((e) => {
                startPanelWidth = this.panelWidth;
                startXTwo = e.startX;
            }));
            this._register(this.sashXOne.onDidChange((e) => {
                let doLayout = false;
                let sidebarPosition = this.layoutService.getSideBarPosition();
                let isSidebarVisible = this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
                let newSashWidth = (sidebarPosition === 0 /* LEFT */) ? startSidebarWidth + e.currentX - startX : startSidebarWidth - e.currentX + startX;
                // Sidebar visible
                if (isSidebarVisible) {
                    // Automatically hide side bar when a certain threshold is met
                    if (newSashWidth + HIDE_SIDEBAR_WIDTH_THRESHOLD < this.partLayoutInfo.sidebar.minWidth) {
                        let dragCompensation = this.partLayoutInfo.sidebar.minWidth - HIDE_SIDEBAR_WIDTH_THRESHOLD;
                        this.layoutService.setSideBarHidden(true);
                        startX = (sidebarPosition === 0 /* LEFT */) ? Math.max(this.activitybarWidth, e.currentX - dragCompensation) : Math.min(e.currentX + dragCompensation, this.workbenchSize.width - this.activitybarWidth);
                        this.sidebarWidth = startSidebarWidth; // when restoring sidebar, restore to the sidebar width we started from
                    }
                    // Otherwise size the sidebar accordingly
                    else {
                        this.sidebarWidth = Math.max(this.partLayoutInfo.sidebar.minWidth, newSashWidth); // Sidebar can not become smaller than MIN_PART_WIDTH
                        doLayout = newSashWidth >= this.partLayoutInfo.sidebar.minWidth;
                    }
                }
                // Sidebar hidden
                else {
                    if ((sidebarPosition === 0 /* LEFT */ && e.currentX - startX >= this.partLayoutInfo.sidebar.minWidth) ||
                        (sidebarPosition === 1 /* RIGHT */ && startX - e.currentX >= this.partLayoutInfo.sidebar.minWidth)) {
                        startSidebarWidth = this.partLayoutInfo.sidebar.minWidth - (sidebarPosition === 0 /* LEFT */ ? e.currentX - startX : startX - e.currentX);
                        this.sidebarWidth = this.partLayoutInfo.sidebar.minWidth;
                        this.layoutService.setSideBarHidden(false);
                    }
                }
                if (doLayout) {
                    this.layout({ source: "workbench.parts.sidebar" /* SIDEBAR_PART */ });
                }
            }));
            this._register(this.sashY.onDidChange((e) => {
                let doLayout = false;
                let isPanelVisible = this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */);
                let newSashHeight = startPanelHeight - (e.currentY - startY);
                // Panel visible
                if (isPanelVisible) {
                    // Automatically hide panel when a certain threshold is met
                    if (newSashHeight + HIDE_PANEL_HEIGHT_THRESHOLD < this.partLayoutInfo.panel.minHeight) {
                        let dragCompensation = this.partLayoutInfo.panel.minHeight - HIDE_PANEL_HEIGHT_THRESHOLD;
                        this.layoutService.setPanelHidden(true);
                        startY = Math.min(this.sidebarHeight - this.statusbarHeight - this.titlebarHeight, e.currentY + dragCompensation);
                        this.panelHeight = startPanelHeight; // when restoring panel, restore to the panel height we started from
                    }
                    // Otherwise size the panel accordingly
                    else {
                        this.panelHeight = Math.max(this.partLayoutInfo.panel.minHeight, newSashHeight); // Panel can not become smaller than MIN_PART_HEIGHT
                        doLayout = newSashHeight >= this.partLayoutInfo.panel.minHeight;
                    }
                }
                // Panel hidden
                else {
                    if (startY - e.currentY >= this.partLayoutInfo.panel.minHeight) {
                        startPanelHeight = 0;
                        this.panelHeight = this.partLayoutInfo.panel.minHeight;
                        this.layoutService.setPanelHidden(false);
                    }
                }
                if (doLayout) {
                    this.layout({ source: "workbench.parts.panel" /* PANEL_PART */ });
                }
            }));
            this._register(this.sashXTwo.onDidChange((e) => {
                let doLayout = false;
                let isPanelVisible = this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */);
                let newSashWidth = startPanelWidth - (e.currentX - startXTwo);
                // Panel visible
                if (isPanelVisible) {
                    // Automatically hide panel when a certain threshold is met
                    if (newSashWidth + HIDE_PANEL_WIDTH_THRESHOLD < this.partLayoutInfo.panel.minWidth) {
                        let dragCompensation = this.partLayoutInfo.panel.minWidth - HIDE_PANEL_WIDTH_THRESHOLD;
                        this.layoutService.setPanelHidden(true);
                        startXTwo = Math.min(this.workbenchSize.width - this.activitybarWidth, e.currentX + dragCompensation);
                        this.panelWidth = startPanelWidth; // when restoring panel, restore to the panel height we started from
                    }
                    // Otherwise size the panel accordingly
                    else {
                        this.panelWidth = newSashWidth;
                        doLayout = newSashWidth >= this.partLayoutInfo.panel.minWidth;
                    }
                }
                // Panel hidden
                else {
                    if (startXTwo - e.currentX >= this.partLayoutInfo.panel.minWidth) {
                        startPanelWidth = 0;
                        this.panelWidth = this.partLayoutInfo.panel.minWidth;
                        this.layoutService.setPanelHidden(false);
                    }
                }
                if (doLayout) {
                    this.layout({ source: "workbench.parts.panel" /* PANEL_PART */ });
                }
            }));
            this._register(this.sashXOne.onDidEnd(() => {
                this.storageService.store(WorkbenchLegacyLayout.sashXOneWidthSettingsKey, this.sidebarWidth, 0 /* GLOBAL */);
            }));
            this._register(this.sashY.onDidEnd(() => {
                this.storageService.store(WorkbenchLegacyLayout.sashYHeightSettingsKey, this.panelHeight, 0 /* GLOBAL */);
            }));
            this._register(this.sashXTwo.onDidEnd(() => {
                this.storageService.store(WorkbenchLegacyLayout.sashXTwoWidthSettingsKey, this.panelWidth, 0 /* GLOBAL */);
            }));
            this._register(this.sashY.onDidReset(() => {
                this.panelHeight = this.sidebarHeight * DEFAULT_PANEL_SIZE_COEFFICIENT;
                this.storageService.store(WorkbenchLegacyLayout.sashYHeightSettingsKey, this.panelHeight, 0 /* GLOBAL */);
                this.layout();
            }));
            this._register(this.sashXOne.onDidReset(() => {
                const activeViewlet = this.viewletService.getActiveViewlet();
                const optimalWidth = activeViewlet ? activeViewlet.getOptimalWidth() : null;
                this.sidebarWidth = typeof optimalWidth === 'number' ? Math.max(optimalWidth, DEFAULT_SIDEBAR_PART_WIDTH) : DEFAULT_SIDEBAR_PART_WIDTH;
                this.storageService.store(WorkbenchLegacyLayout.sashXOneWidthSettingsKey, this.sidebarWidth, 0 /* GLOBAL */);
                this.layoutService.setSideBarHidden(false);
                this.layout();
            }));
            this._register(this.sashXTwo.onDidReset(() => {
                this.panelWidth = (this.workbenchSize.width - this.sidebarWidth - this.activitybarWidth) * DEFAULT_PANEL_SIZE_COEFFICIENT;
                this.storageService.store(WorkbenchLegacyLayout.sashXTwoWidthSettingsKey, this.panelWidth, 0 /* GLOBAL */);
                this.layout();
            }));
        }
        layout(options) {
            this.workbenchSize = dom_1.getClientArea(this.parent);
            const isActivityBarHidden = !this.layoutService.isVisible("workbench.parts.activitybar" /* ACTIVITYBAR_PART */);
            const isTitlebarHidden = !this.layoutService.isVisible("workbench.parts.titlebar" /* TITLEBAR_PART */);
            const isPanelHidden = !this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */);
            const isStatusbarHidden = !this.layoutService.isVisible("workbench.parts.statusbar" /* STATUSBAR_PART */);
            const isSidebarHidden = !this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */);
            const sidebarPosition = this.layoutService.getSideBarPosition();
            const panelPosition = this.layoutService.getPanelPosition();
            const menubarVisibility = this.layoutService.getMenubarVisibility();
            // Sidebar
            if (this.sidebarWidth === -1) {
                this.sidebarWidth = this.workbenchSize.width / 5;
            }
            this.statusbarHeight = isStatusbarHidden ? 0 : this.partLayoutInfo.statusbar.height;
            this.titlebarHeight = isTitlebarHidden ? 0 : this.partLayoutInfo.titlebar.height / (platform_1.isMacintosh || !menubarVisibility || menubarVisibility === 'hidden' ? browser_1.getZoomFactor() : 1); // adjust for zoom prevention
            this.sidebarHeight = this.workbenchSize.height - this.statusbarHeight - this.titlebarHeight;
            let sidebarSize = new dom_1.Dimension(this.sidebarWidth, this.sidebarHeight);
            // Activity Bar
            let activityBarSize = new dom_1.Dimension(this.activitybarWidth, sidebarSize.height);
            // Panel part
            let panelHeight;
            let panelWidth;
            const maxPanelHeight = this.computeMaxPanelHeight();
            const maxPanelWidth = this.computeMaxPanelWidth();
            if (isPanelHidden) {
                panelHeight = 0;
                panelWidth = 0;
            }
            else if (panelPosition === 2 /* BOTTOM */) {
                if (this.panelHeight > 0) {
                    panelHeight = Math.min(maxPanelHeight, Math.max(this.partLayoutInfo.panel.minHeight, this.panelHeight));
                }
                else {
                    panelHeight = sidebarSize.height * DEFAULT_PANEL_SIZE_COEFFICIENT;
                }
                panelWidth = this.workbenchSize.width - sidebarSize.width - activityBarSize.width;
                if (options && options.toggleMaximizedPanel) {
                    panelHeight = this.panelMaximized ? Math.max(this.partLayoutInfo.panel.minHeight, Math.min(this.panelSizeBeforeMaximized, maxPanelHeight)) : maxPanelHeight;
                }
                this.panelMaximized = panelHeight === maxPanelHeight;
                if (panelHeight / maxPanelHeight < PANEL_SIZE_BEFORE_MAXIMIZED_BOUNDARY) {
                    this.panelSizeBeforeMaximized = panelHeight;
                }
            }
            else {
                panelHeight = sidebarSize.height;
                if (this.panelWidth > 0) {
                    panelWidth = Math.min(maxPanelWidth, Math.max(this.partLayoutInfo.panel.minWidth, this.panelWidth));
                }
                else {
                    panelWidth = (this.workbenchSize.width - activityBarSize.width - sidebarSize.width) * DEFAULT_PANEL_SIZE_COEFFICIENT;
                }
                if (options && options.toggleMaximizedPanel) {
                    panelWidth = this.panelMaximized ? Math.max(this.partLayoutInfo.panel.minWidth, Math.min(this.panelSizeBeforeMaximized, maxPanelWidth)) : maxPanelWidth;
                }
                this.panelMaximized = panelWidth === maxPanelWidth;
                if (panelWidth / maxPanelWidth < PANEL_SIZE_BEFORE_MAXIMIZED_BOUNDARY) {
                    this.panelSizeBeforeMaximized = panelWidth;
                }
            }
            this.storageService.store(WorkbenchLegacyLayout.panelSizeBeforeMaximizedKey, this.panelSizeBeforeMaximized, 0 /* GLOBAL */);
            const panelDimension = new dom_1.Dimension(panelWidth, panelHeight);
            // Editor
            let editorSize = {
                width: 0,
                height: 0
            };
            editorSize.width = this.workbenchSize.width - sidebarSize.width - activityBarSize.width - (panelPosition === 1 /* RIGHT */ ? panelDimension.width : 0);
            editorSize.height = sidebarSize.height - (panelPosition === 2 /* BOTTOM */ ? panelDimension.height : 0);
            // Adjust for Editor Part minimum width
            const minimumEditorPartSize = new dom_1.Dimension(this.parts.editor.minimumWidth, this.parts.editor.minimumHeight);
            if (editorSize.width < minimumEditorPartSize.width) {
                const missingPreferredEditorWidth = minimumEditorPartSize.width - editorSize.width;
                let outstandingMissingPreferredEditorWidth = missingPreferredEditorWidth;
                // Take from Panel if Panel Position on the Right and Visible
                if (!isPanelHidden && panelPosition === 1 /* RIGHT */ && (!options || options.source !== "workbench.parts.panel" /* PANEL_PART */)) {
                    const oldPanelWidth = panelDimension.width;
                    panelDimension.width = Math.max(this.partLayoutInfo.panel.minWidth, panelDimension.width - outstandingMissingPreferredEditorWidth);
                    outstandingMissingPreferredEditorWidth -= oldPanelWidth - panelDimension.width;
                }
                // Take from Sidebar if Visible
                if (!isSidebarHidden && outstandingMissingPreferredEditorWidth > 0) {
                    const oldSidebarWidth = sidebarSize.width;
                    sidebarSize.width = Math.max(this.partLayoutInfo.sidebar.minWidth, sidebarSize.width - outstandingMissingPreferredEditorWidth);
                    outstandingMissingPreferredEditorWidth -= oldSidebarWidth - sidebarSize.width;
                }
                editorSize.width += missingPreferredEditorWidth - outstandingMissingPreferredEditorWidth;
                if (!isPanelHidden && panelPosition === 2 /* BOTTOM */) {
                    panelDimension.width = editorSize.width; // ensure panel width is always following editor width
                }
            }
            // Adjust for Editor Part minimum height
            if (editorSize.height < minimumEditorPartSize.height) {
                const missingPreferredEditorHeight = minimumEditorPartSize.height - editorSize.height;
                let outstandingMissingPreferredEditorHeight = missingPreferredEditorHeight;
                // Take from Panel if Panel Position on the Bottom and Visible
                if (!isPanelHidden && panelPosition === 2 /* BOTTOM */) {
                    const oldPanelHeight = panelDimension.height;
                    panelDimension.height = Math.max(this.partLayoutInfo.panel.minHeight, panelDimension.height - outstandingMissingPreferredEditorHeight);
                    outstandingMissingPreferredEditorHeight -= oldPanelHeight - panelDimension.height;
                }
                editorSize.height += missingPreferredEditorHeight - outstandingMissingPreferredEditorHeight;
            }
            if (!isSidebarHidden) {
                this.sidebarWidth = sidebarSize.width;
                this.storageService.store(WorkbenchLegacyLayout.sashXOneWidthSettingsKey, this.sidebarWidth, 0 /* GLOBAL */);
            }
            if (!isPanelHidden) {
                if (panelPosition === 2 /* BOTTOM */) {
                    this.panelHeight = panelDimension.height;
                    this.storageService.store(WorkbenchLegacyLayout.sashYHeightSettingsKey, this.panelHeight, 0 /* GLOBAL */);
                }
                else {
                    this.panelWidth = panelDimension.width;
                    this.storageService.store(WorkbenchLegacyLayout.sashXTwoWidthSettingsKey, this.panelWidth, 0 /* GLOBAL */);
                }
            }
            // Workbench
            dom_1.position(this.workbenchContainer, 0, 0, 0, 0, 'relative');
            dom_1.size(this.workbenchContainer, this.workbenchSize.width, this.workbenchSize.height);
            // Bug on Chrome: Sometimes Chrome wants to scroll the workbench container on layout changes. The fix is to reset scrolling in this case.
            // uses set time to ensure this happens in th next frame (RAF will be at the end of this JS time slice and we don't want that)
            setTimeout(() => {
                const workbenchContainer = this.workbenchContainer;
                if (workbenchContainer.scrollTop > 0) {
                    workbenchContainer.scrollTop = 0;
                }
                if (workbenchContainer.scrollLeft > 0) {
                    workbenchContainer.scrollLeft = 0;
                }
            });
            // Title Part
            const titleContainer = this.parts.titlebar.getContainer();
            if (isTitlebarHidden) {
                dom_1.hide(titleContainer);
            }
            else {
                dom_1.show(titleContainer);
            }
            // Editor Part and Panel part
            const editorContainer = this.parts.editor.getContainer();
            const panelContainer = this.parts.panel.getContainer();
            dom_1.size(editorContainer, editorSize.width, editorSize.height);
            dom_1.size(panelContainer, panelDimension.width, panelDimension.height);
            if (panelPosition === 2 /* BOTTOM */) {
                if (sidebarPosition === 0 /* LEFT */) {
                    dom_1.position(editorContainer, this.titlebarHeight, 0, this.statusbarHeight + panelDimension.height, sidebarSize.width + activityBarSize.width);
                    dom_1.position(panelContainer, editorSize.height + this.titlebarHeight, 0, this.statusbarHeight, sidebarSize.width + activityBarSize.width);
                }
                else {
                    dom_1.position(editorContainer, this.titlebarHeight, sidebarSize.width, this.statusbarHeight + panelDimension.height, 0);
                    dom_1.position(panelContainer, editorSize.height + this.titlebarHeight, sidebarSize.width, this.statusbarHeight, 0);
                }
            }
            else {
                if (sidebarPosition === 0 /* LEFT */) {
                    dom_1.position(editorContainer, this.titlebarHeight, panelDimension.width, this.statusbarHeight, sidebarSize.width + activityBarSize.width);
                    dom_1.position(panelContainer, this.titlebarHeight, 0, this.statusbarHeight, sidebarSize.width + activityBarSize.width + editorSize.width);
                }
                else {
                    dom_1.position(editorContainer, this.titlebarHeight, sidebarSize.width + activityBarSize.width + panelWidth, this.statusbarHeight, 0);
                    dom_1.position(panelContainer, this.titlebarHeight, sidebarSize.width + activityBarSize.width, this.statusbarHeight, editorSize.width);
                }
            }
            // Activity Bar Part
            const activitybarContainer = this.parts.activitybar.getContainer();
            dom_1.size(activitybarContainer, null, activityBarSize.height);
            if (sidebarPosition === 0 /* LEFT */) {
                this.parts.activitybar.getContainer().style.right = '';
                dom_1.position(activitybarContainer, this.titlebarHeight, undefined, 0, 0);
            }
            else {
                this.parts.activitybar.getContainer().style.left = '';
                dom_1.position(activitybarContainer, this.titlebarHeight, 0, 0, undefined);
            }
            if (isActivityBarHidden) {
                dom_1.hide(activitybarContainer);
            }
            else {
                dom_1.show(activitybarContainer);
            }
            // Sidebar Part
            const sidebarContainer = this.parts.sidebar.getContainer();
            dom_1.size(sidebarContainer, sidebarSize.width, sidebarSize.height);
            const editorAndPanelWidth = editorSize.width + (panelPosition === 1 /* RIGHT */ ? panelWidth : 0);
            if (sidebarPosition === 0 /* LEFT */) {
                dom_1.position(sidebarContainer, this.titlebarHeight, editorAndPanelWidth, this.statusbarHeight, activityBarSize.width);
            }
            else {
                dom_1.position(sidebarContainer, this.titlebarHeight, activityBarSize.width, this.statusbarHeight, editorAndPanelWidth);
            }
            // Statusbar Part
            const statusbarContainer = this.parts.statusbar.getContainer();
            dom_1.position(statusbarContainer, this.workbenchSize.height - this.statusbarHeight);
            if (isStatusbarHidden) {
                dom_1.hide(statusbarContainer);
            }
            else {
                dom_1.show(statusbarContainer);
            }
            // Sashes
            this.sashXOne.layout();
            if (panelPosition === 2 /* BOTTOM */) {
                this.sashXTwo.hide();
                this.sashY.layout();
                this.sashY.show();
            }
            else {
                this.sashY.hide();
                this.sashXTwo.layout();
                this.sashXTwo.show();
            }
            // Propagate to Part Layouts
            this.parts.titlebar.layout(this.workbenchSize.width, this.titlebarHeight);
            this.parts.editor.layout(editorSize.width, editorSize.height);
            this.parts.sidebar.layout(sidebarSize.width, sidebarSize.height);
            this.parts.panel.layout(panelDimension.width, panelDimension.height);
            this.parts.activitybar.layout(activityBarSize.width, activityBarSize.height);
            // Propagate to Context View
            this.contextViewService.layout();
        }
        getVerticalSashTop(sash) {
            return this.titlebarHeight;
        }
        getVerticalSashLeft(sash) {
            let sidebarPosition = this.layoutService.getSideBarPosition();
            if (sash === this.sashXOne) {
                if (sidebarPosition === 0 /* LEFT */) {
                    return this.sidebarWidth + this.activitybarWidth;
                }
                return this.workbenchSize.width - this.sidebarWidth - this.activitybarWidth;
            }
            return this.workbenchSize.width - this.panelWidth - (sidebarPosition === 1 /* RIGHT */ ? this.sidebarWidth + this.activitybarWidth : 0);
        }
        getVerticalSashHeight(sash) {
            if (sash === this.sashXTwo && !this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                return 0;
            }
            return this.sidebarHeight;
        }
        getHorizontalSashTop(sash) {
            const offset = 2; // Horizontal sash should be a bit lower than the editor area, thus add 2px #5524
            return offset + (this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */) ? this.sidebarHeight - this.panelHeight + this.titlebarHeight : this.sidebarHeight + this.titlebarHeight);
        }
        getHorizontalSashLeft(sash) {
            if (this.layoutService.getSideBarPosition() === 1 /* RIGHT */) {
                return 0;
            }
            return this.sidebarWidth + this.activitybarWidth;
        }
        getHorizontalSashWidth(sash) {
            return this.panelWidth;
        }
        isPanelMaximized() {
            return this.panelMaximized;
        }
        resizePart(part, sizeChange) {
            const panelPosition = this.layoutService.getPanelPosition();
            const sizeChangePxWidth = this.workbenchSize.width * (sizeChange / 100);
            const sizeChangePxHeight = this.workbenchSize.height * (sizeChange / 100);
            let doLayout = false;
            switch (part) {
                case "workbench.parts.sidebar" /* SIDEBAR_PART */:
                    this.sidebarWidth = this.sidebarWidth + sizeChangePxWidth; // Sidebar can not become smaller than MIN_PART_WIDTH
                    if (this.workbenchSize.width - this.sidebarWidth < this.parts.editor.minimumWidth) {
                        this.sidebarWidth = this.workbenchSize.width - this.parts.editor.minimumWidth;
                    }
                    doLayout = true;
                    break;
                case "workbench.parts.panel" /* PANEL_PART */:
                    if (panelPosition === 2 /* BOTTOM */) {
                        this.panelHeight = this.panelHeight + sizeChangePxHeight;
                    }
                    else if (panelPosition === 1 /* RIGHT */) {
                        this.panelWidth = this.panelWidth + sizeChangePxWidth;
                    }
                    doLayout = true;
                    break;
                case "workbench.parts.editor" /* EDITOR_PART */:
                    // If we have one editor we can cheat and resize sidebar with the negative delta
                    // If the sidebar is not visible and panel is, resize panel main axis with negative Delta
                    if (this.editorGroupService.count === 1) {
                        if (this.layoutService.isVisible("workbench.parts.sidebar" /* SIDEBAR_PART */)) {
                            this.sidebarWidth = this.sidebarWidth - sizeChangePxWidth;
                            doLayout = true;
                        }
                        else if (this.layoutService.isVisible("workbench.parts.panel" /* PANEL_PART */)) {
                            if (panelPosition === 2 /* BOTTOM */) {
                                this.panelHeight = this.panelHeight - sizeChangePxHeight;
                            }
                            else if (panelPosition === 1 /* RIGHT */) {
                                this.panelWidth = this.panelWidth - sizeChangePxWidth;
                            }
                            doLayout = true;
                        }
                    }
                    else {
                        const activeGroup = this.editorGroupService.activeGroup;
                        const { width, height } = this.editorGroupService.getSize(activeGroup);
                        this.editorGroupService.setSize(activeGroup, { width: width + sizeChangePxWidth, height: height + sizeChangePxHeight });
                    }
            }
            if (doLayout) {
                this.layout();
            }
        }
    };
    WorkbenchLegacyLayout.sashXOneWidthSettingsKey = 'workbench.sidebar.width';
    WorkbenchLegacyLayout.sashXTwoWidthSettingsKey = 'workbench.panel.width';
    WorkbenchLegacyLayout.sashYHeightSettingsKey = 'workbench.panel.height';
    WorkbenchLegacyLayout.panelSizeBeforeMaximizedKey = 'workbench.panel.sizeBeforeMaximized';
    __decorate([
        decorators_1.memoize
    ], WorkbenchLegacyLayout.prototype, "partLayoutInfo", null);
    WorkbenchLegacyLayout = __decorate([
        __param(3, storage_1.IStorageService),
        __param(4, contextView_1.IContextViewService),
        __param(5, layoutService_1.IWorkbenchLayoutService),
        __param(6, viewlet_1.IViewletService),
        __param(7, themeService_1.IThemeService),
        __param(8, editorGroupsService_1.IEditorGroupsService)
    ], WorkbenchLegacyLayout);
    exports.WorkbenchLegacyLayout = WorkbenchLegacyLayout;
});
//# sourceMappingURL=legacyLayout.js.map