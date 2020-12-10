var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/decorators", "vs/base/common/uri", "vs/workbench/common/editor"], function (require, exports, dom, decorators_1, uri_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WebviewIconsManager {
        constructor() {
            this._icons = new Map();
        }
        get _styleElement() {
            const element = dom.createStyleSheet();
            element.className = 'webview-icons';
            return element;
        }
        setIcons(webviewId, iconPath) {
            if (iconPath) {
                this._icons.set(webviewId, iconPath);
            }
            else {
                this._icons.delete(webviewId);
            }
            this.updateStyleSheet();
        }
        updateStyleSheet() {
            const cssRules = [];
            this._icons.forEach((value, key) => {
                const webviewSelector = `.show-file-icons .webview-${key}-name-file-icon::before`;
                if (uri_1.URI.isUri(value)) {
                    cssRules.push(`${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value)}; }`);
                }
                else {
                    cssRules.push(`.vs ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.light)}; }`);
                    cssRules.push(`.vs-dark ${webviewSelector} { content: ""; background-image: ${dom.asCSSUrl(value.dark)}; }`);
                }
            });
            this._styleElement.innerHTML = cssRules.join('\n');
        }
    }
    __decorate([
        decorators_1.memoize
    ], WebviewIconsManager.prototype, "_styleElement", null);
    class WebviewEditorInput extends editor_1.EditorInput {
        constructor(id, viewType, name, extension, webview) {
            super();
            this.id = id;
            this.viewType = viewType;
            this.extension = extension;
            this._name = name;
            this.extension = extension;
            this._webview = this._register(webview.acquire()); // The input owns this webview
        }
        getTypeId() {
            return WebviewEditorInput.typeId;
        }
        getResource() {
            return uri_1.URI.from({
                scheme: 'webview-panel',
                path: `webview-panel/webview-${this.id}`
            });
        }
        getName() {
            return this._name;
        }
        getTitle() {
            return this.getName();
        }
        getDescription() {
            return undefined;
        }
        setName(value) {
            this._name = value;
            this._onDidChangeLabel.fire();
        }
        get webview() {
            return this._webview;
        }
        get iconPath() {
            return this._iconPath;
        }
        set iconPath(value) {
            this._iconPath = value;
            WebviewEditorInput.iconsManager.setIcons(this.id, value);
        }
        matches(other) {
            return other === this;
        }
        get group() {
            return this._group;
        }
        resolve() {
            return __awaiter(this, void 0, void 0, function* () {
                return new editor_1.EditorModel();
            });
        }
        supportsSplitEditor() {
            return false;
        }
        updateGroup(group) {
            this._group = group;
        }
    }
    WebviewEditorInput.typeId = 'workbench.editors.webviewInput';
    WebviewEditorInput.iconsManager = new WebviewIconsManager();
    exports.WebviewEditorInput = WebviewEditorInput;
    class RevivedWebviewEditorInput extends WebviewEditorInput {
        constructor(id, viewType, name, extension, reviver, webview) {
            super(id, viewType, name, extension, webview);
            this.reviver = reviver;
            this._revived = false;
        }
        resolve() {
            const _super = Object.create(null, {
                resolve: { get: () => super.resolve }
            });
            return __awaiter(this, void 0, void 0, function* () {
                if (!this._revived) {
                    this._revived = true;
                    yield this.reviver(this);
                }
                return _super.resolve.call(this);
            });
        }
    }
    exports.RevivedWebviewEditorInput = RevivedWebviewEditorInput;
});
//# sourceMappingURL=webviewEditorInput.js.map