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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/actions/browser/menuEntryActionViewItem"], function (require, exports, contextkey_1, actions_1, contextView_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CommentMenus = class CommentMenus {
        constructor(controller, contextKeyService, menuService, contextMenuService) {
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            const commentControllerKey = this.contextKeyService.createKey('commentController', undefined);
            commentControllerKey.set(controller.contextValue);
        }
        getCommentThreadTitleActions(commentThread, contextKeyService) {
            return this.getMenu(39 /* CommentThreadTitle */, contextKeyService);
        }
        getCommentThreadActions(commentThread, contextKeyService) {
            return this.getMenu(40 /* CommentThreadActions */, contextKeyService);
        }
        getCommentTitleActions(comment, contextKeyService) {
            return this.getMenu(41 /* CommentTitle */, contextKeyService);
        }
        getCommentActions(comment, contextKeyService) {
            return this.getMenu(42 /* CommentActions */, contextKeyService);
        }
        getMenu(menuId, contextKeyService) {
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));
            return menu;
        }
        dispose() {
        }
    };
    CommentMenus = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_1.IMenuService),
        __param(3, contextView_1.IContextMenuService)
    ], CommentMenus);
    exports.CommentMenus = CommentMenus;
});
//# sourceMappingURL=commentMenus.js.map