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
define(["require", "exports", "vs/nls", "vs/base/common/mime", "vs/base/browser/dom", "vs/base/common/map", "vs/base/common/network", "vs/base/common/numbers", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/base/common/actions", "vs/base/common/decorators", "vs/base/common/platform", "vs/platform/statusbar/common/statusbar", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/css!./media/resourceviewer"], function (require, exports, nls, mimes, DOM, map_1, network_1, numbers_1, contextView_1, lifecycle_1, actions_1, decorators_1, platform, statusbar_1, editorService_1, instantiation_1, themeService_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BinarySize {
        static formatSize(size) {
            if (size < BinarySize.KB) {
                return nls.localize('sizeB', "{0}B", size);
            }
            if (size < BinarySize.MB) {
                return nls.localize('sizeKB', "{0}KB", (size / BinarySize.KB).toFixed(2));
            }
            if (size < BinarySize.GB) {
                return nls.localize('sizeMB', "{0}MB", (size / BinarySize.MB).toFixed(2));
            }
            if (size < BinarySize.TB) {
                return nls.localize('sizeGB', "{0}GB", (size / BinarySize.GB).toFixed(2));
            }
            return nls.localize('sizeTB', "{0}TB", (size / BinarySize.TB).toFixed(2));
        }
    }
    BinarySize.KB = 1024;
    BinarySize.MB = BinarySize.KB * BinarySize.KB;
    BinarySize.GB = BinarySize.MB * BinarySize.KB;
    BinarySize.TB = BinarySize.GB * BinarySize.KB;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const borderColor = theme.getColor(theme_1.IMAGE_PREVIEW_BORDER);
        collector.addRule(`.monaco-resource-viewer.image img { border : 1px solid ${borderColor ? borderColor.toString() : ''}; }`);
    });
    /**
     * Helper to actually render the given resource into the provided container. Will adjust scrollbar (if provided) automatically based on loading
     * progress of the binary resource.
     */
    class ResourceViewer {
        static show(descriptor, fileService, container, scrollbar, delegate, instantiationService) {
            // Ensure CSS class
            container.className = 'monaco-resource-viewer';
            // Images
            if (ResourceViewer.isImageResource(descriptor)) {
                return ImageView.create(container, descriptor, fileService, scrollbar, delegate, instantiationService);
            }
            // Large Files
            if (descriptor.size > ResourceViewer.MAX_OPEN_INTERNAL_SIZE) {
                return FileTooLargeFileView.create(container, descriptor, scrollbar, delegate);
            }
            // Seemingly Binary Files
            else {
                return FileSeemsBinaryFileView.create(container, descriptor, scrollbar, delegate);
            }
        }
        static isImageResource(descriptor) {
            const mime = getMime(descriptor);
            // Chrome does not support tiffs
            return mime.indexOf('image/') >= 0 && mime !== 'image/tiff';
        }
    }
    ResourceViewer.MAX_OPEN_INTERNAL_SIZE = BinarySize.MB * 200; // max size until we offer an action to open internally
    exports.ResourceViewer = ResourceViewer;
    class ImageView {
        static create(container, descriptor, fileService, scrollbar, delegate, instantiationService) {
            if (ImageView.shouldShowImageInline(descriptor)) {
                return InlineImageView.create(container, descriptor, fileService, scrollbar, delegate, instantiationService);
            }
            return LargeImageView.create(container, descriptor, delegate);
        }
        static shouldShowImageInline(descriptor) {
            let skipInlineImage;
            // Data URI
            if (descriptor.resource.scheme === network_1.Schemas.data) {
                const base64MarkerIndex = descriptor.resource.path.indexOf(ImageView.BASE64_MARKER);
                const hasData = base64MarkerIndex >= 0 && descriptor.resource.path.substring(base64MarkerIndex + ImageView.BASE64_MARKER.length).length > 0;
                skipInlineImage = !hasData || descriptor.size > ImageView.MAX_IMAGE_SIZE || descriptor.resource.path.length > ImageView.MAX_IMAGE_SIZE;
            }
            // File URI
            else {
                skipInlineImage = typeof descriptor.size !== 'number' || descriptor.size > ImageView.MAX_IMAGE_SIZE;
            }
            return !skipInlineImage;
        }
    }
    ImageView.MAX_IMAGE_SIZE = BinarySize.MB * 10; // showing images inline is memory intense, so we have a limit
    ImageView.BASE64_MARKER = 'base64,';
    class LargeImageView {
        static create(container, descriptor, delegate) {
            const size = BinarySize.formatSize(descriptor.size);
            delegate.metadataClb(size);
            DOM.clearNode(container);
            const disposables = new lifecycle_1.DisposableStore();
            const label = document.createElement('p');
            label.textContent = nls.localize('largeImageError', "The image is not displayed in the editor because it is too large ({0}).", size);
            container.appendChild(label);
            const openExternal = delegate.openExternalClb;
            if (descriptor.resource.scheme === network_1.Schemas.file && openExternal) {
                const link = DOM.append(label, DOM.$('a.embedded-link'));
                link.setAttribute('role', 'button');
                link.textContent = nls.localize('resourceOpenExternalButton', "Open image using external program?");
                disposables.add(DOM.addDisposableListener(link, DOM.EventType.CLICK, () => openExternal(descriptor.resource)));
            }
            return disposables;
        }
    }
    class FileTooLargeFileView {
        static create(container, descriptor, scrollbar, delegate) {
            const size = BinarySize.formatSize(descriptor.size);
            delegate.metadataClb(size);
            DOM.clearNode(container);
            const label = document.createElement('span');
            label.textContent = nls.localize('nativeFileTooLargeError', "The file is not displayed in the editor because it is too large ({0}).", size);
            container.appendChild(label);
            scrollbar.scanDomNode();
            return lifecycle_1.Disposable.None;
        }
    }
    class FileSeemsBinaryFileView {
        static create(container, descriptor, scrollbar, delegate) {
            delegate.metadataClb(typeof descriptor.size === 'number' ? BinarySize.formatSize(descriptor.size) : '');
            DOM.clearNode(container);
            const disposables = new lifecycle_1.DisposableStore();
            const label = document.createElement('p');
            label.textContent = nls.localize('nativeBinaryError', "The file is not displayed in the editor because it is either binary or uses an unsupported text encoding.");
            container.appendChild(label);
            if (descriptor.resource.scheme !== network_1.Schemas.data) {
                const link = DOM.append(label, DOM.$('a.embedded-link'));
                link.setAttribute('role', 'button');
                link.textContent = nls.localize('openAsText', "Do you want to open it anyway?");
                disposables.add(DOM.addDisposableListener(link, DOM.EventType.CLICK, () => delegate.openInternalClb(descriptor.resource)));
            }
            scrollbar.scanDomNode();
            return disposables;
        }
    }
    let ZoomStatusbarItem = class ZoomStatusbarItem extends lifecycle_1.Disposable {
        constructor(onSelectScale, editorService, contextMenuService, statusbarService) {
            super();
            this.onSelectScale = onSelectScale;
            this.contextMenuService = contextMenuService;
            this.statusbarService = statusbarService;
            this._register(editorService.onDidActiveEditorChange(() => {
                if (this.statusbarItem) {
                    this.statusbarItem.dispose();
                    this.statusbarItem = undefined;
                }
            }));
        }
        updateStatusbar(scale) {
            const entry = {
                text: this.zoomLabel(scale)
            };
            if (!this.statusbarItem) {
                this.statusbarItem = this.statusbarService.addEntry(entry, 'status.imageZoom', nls.localize('status.imageZoom', "Image Zoom"), 1 /* RIGHT */, 101 /* to the left of editor status (100) */);
                this._register(this.statusbarItem);
                const element = document.getElementById('status.imageZoom');
                this._register(DOM.addDisposableListener(element, DOM.EventType.CLICK, (e) => {
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => element,
                        getActions: () => this.zoomActions
                    });
                }));
            }
            else {
                this.statusbarItem.update(entry);
            }
        }
        get zoomActions() {
            const scales = [10, 5, 2, 1, 0.5, 0.2, 'fit'];
            return scales.map(scale => new actions_1.Action(`zoom.${scale}`, this.zoomLabel(scale), undefined, undefined, () => {
                this.updateStatusbar(scale);
                if (this.onSelectScale) {
                    this.onSelectScale(scale);
                }
                return Promise.resolve(undefined);
            }));
        }
        zoomLabel(scale) {
            return scale === 'fit'
                ? nls.localize('zoom.action.fit.label', 'Whole Image')
                : `${Math.round(scale * 100)}%`;
        }
    };
    __decorate([
        decorators_1.memoize
    ], ZoomStatusbarItem.prototype, "zoomActions", null);
    ZoomStatusbarItem = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, statusbar_1.IStatusbarService)
    ], ZoomStatusbarItem);
    exports.ZoomStatusbarItem = ZoomStatusbarItem;
    class InlineImageView {
        static create(container, descriptor, fileService, scrollbar, delegate, instantiationService) {
            const disposables = new lifecycle_1.DisposableStore();
            const zoomStatusbarItem = disposables.add(instantiationService.createInstance(ZoomStatusbarItem, newScale => updateScale(newScale)));
            const context = {
                layout(dimension) { },
                dispose: () => disposables.dispose()
            };
            const cacheKey = `${descriptor.resource.toString()}:${descriptor.etag}`;
            let ctrlPressed = false;
            let altPressed = false;
            const initialState = InlineImageView.imageStateCache.get(cacheKey) || { scale: 'fit', offsetX: 0, offsetY: 0 };
            let scale = initialState.scale;
            let image = null;
            function updateScale(newScale) {
                if (!image || !image.parentElement) {
                    return;
                }
                if (newScale === 'fit') {
                    scale = 'fit';
                    DOM.addClass(image, 'scale-to-fit');
                    DOM.removeClass(image, 'pixelated');
                    image.style.minWidth = 'auto';
                    image.style.width = 'auto';
                    InlineImageView.imageStateCache.delete(cacheKey);
                }
                else {
                    const oldWidth = image.width;
                    const oldHeight = image.height;
                    scale = numbers_1.clamp(newScale, InlineImageView.MIN_SCALE, InlineImageView.MAX_SCALE);
                    if (scale >= InlineImageView.PIXELATION_THRESHOLD) {
                        DOM.addClass(image, 'pixelated');
                    }
                    else {
                        DOM.removeClass(image, 'pixelated');
                    }
                    const { scrollTop, scrollLeft } = image.parentElement;
                    const dx = (scrollLeft + image.parentElement.clientWidth / 2) / image.parentElement.scrollWidth;
                    const dy = (scrollTop + image.parentElement.clientHeight / 2) / image.parentElement.scrollHeight;
                    DOM.removeClass(image, 'scale-to-fit');
                    image.style.minWidth = `${(image.naturalWidth * scale)}px`;
                    image.style.width = `${(image.naturalWidth * scale)}px`;
                    const newWidth = image.width;
                    const scaleFactor = (newWidth - oldWidth) / oldWidth;
                    const newScrollLeft = ((oldWidth * scaleFactor * dx) + scrollLeft);
                    const newScrollTop = ((oldHeight * scaleFactor * dy) + scrollTop);
                    scrollbar.setScrollPosition({
                        scrollLeft: newScrollLeft,
                        scrollTop: newScrollTop,
                    });
                    InlineImageView.imageStateCache.set(cacheKey, { scale: scale, offsetX: newScrollLeft, offsetY: newScrollTop });
                }
                zoomStatusbarItem.updateStatusbar(scale);
                scrollbar.scanDomNode();
            }
            function firstZoom() {
                if (!image) {
                    return;
                }
                scale = image.clientWidth / image.naturalWidth;
                updateScale(scale);
            }
            disposables.add(DOM.addDisposableListener(window, DOM.EventType.KEY_DOWN, (e) => {
                if (!image) {
                    return;
                }
                ctrlPressed = e.ctrlKey;
                altPressed = e.altKey;
                if (platform.isMacintosh ? altPressed : ctrlPressed) {
                    DOM.removeClass(container, 'zoom-in');
                    DOM.addClass(container, 'zoom-out');
                }
            }));
            disposables.add(DOM.addDisposableListener(window, DOM.EventType.KEY_UP, (e) => {
                if (!image) {
                    return;
                }
                ctrlPressed = e.ctrlKey;
                altPressed = e.altKey;
                if (!(platform.isMacintosh ? altPressed : ctrlPressed)) {
                    DOM.removeClass(container, 'zoom-out');
                    DOM.addClass(container, 'zoom-in');
                }
            }));
            disposables.add(DOM.addDisposableListener(container, DOM.EventType.CLICK, (e) => {
                if (!image) {
                    return;
                }
                if (e.button !== 0) {
                    return;
                }
                // left click
                if (scale === 'fit') {
                    firstZoom();
                }
                if (!(platform.isMacintosh ? altPressed : ctrlPressed)) { // zoom in
                    let i = 0;
                    for (; i < InlineImageView.zoomLevels.length; ++i) {
                        if (InlineImageView.zoomLevels[i] > scale) {
                            break;
                        }
                    }
                    updateScale(InlineImageView.zoomLevels[i] || InlineImageView.MAX_SCALE);
                }
                else {
                    let i = InlineImageView.zoomLevels.length - 1;
                    for (; i >= 0; --i) {
                        if (InlineImageView.zoomLevels[i] < scale) {
                            break;
                        }
                    }
                    updateScale(InlineImageView.zoomLevels[i] || InlineImageView.MIN_SCALE);
                }
            }));
            disposables.add(DOM.addDisposableListener(container, DOM.EventType.WHEEL, (e) => {
                if (!image) {
                    return;
                }
                const isScrollWheelKeyPressed = platform.isMacintosh ? altPressed : ctrlPressed;
                if (!isScrollWheelKeyPressed && !e.ctrlKey) { // pinching is reported as scroll wheel + ctrl
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                if (scale === 'fit') {
                    firstZoom();
                }
                let delta = e.deltaY > 0 ? 1 : -1;
                updateScale(scale * (1 - delta * InlineImageView.SCALE_PINCH_FACTOR));
            }));
            disposables.add(DOM.addDisposableListener(container, DOM.EventType.SCROLL, () => {
                if (!image || !image.parentElement || scale === 'fit') {
                    return;
                }
                const entry = InlineImageView.imageStateCache.get(cacheKey);
                if (entry) {
                    const { scrollTop, scrollLeft } = image.parentElement;
                    InlineImageView.imageStateCache.set(cacheKey, { scale: entry.scale, offsetX: scrollLeft, offsetY: scrollTop });
                }
            }));
            DOM.clearNode(container);
            DOM.addClasses(container, 'image', 'zoom-in');
            image = DOM.append(container, DOM.$('img.scale-to-fit'));
            image.style.visibility = 'hidden';
            disposables.add(DOM.addDisposableListener(image, DOM.EventType.LOAD, e => {
                if (!image) {
                    return;
                }
                if (typeof descriptor.size === 'number') {
                    delegate.metadataClb(nls.localize('imgMeta', '{0}x{1} {2}', image.naturalWidth, image.naturalHeight, BinarySize.formatSize(descriptor.size)));
                }
                else {
                    delegate.metadataClb(nls.localize('imgMetaNoSize', '{0}x{1}', image.naturalWidth, image.naturalHeight));
                }
                scrollbar.scanDomNode();
                image.style.visibility = 'visible';
                updateScale(scale);
                if (initialState.scale !== 'fit') {
                    scrollbar.setScrollPosition({
                        scrollLeft: initialState.offsetX,
                        scrollTop: initialState.offsetY,
                    });
                }
            }));
            InlineImageView.imageSrc(descriptor, fileService).then(src => {
                const img = container.querySelector('img');
                if (img) {
                    if (typeof src === 'string') {
                        img.src = src;
                    }
                    else {
                        const url = URL.createObjectURL(src);
                        disposables.add(lifecycle_1.toDisposable(() => URL.revokeObjectURL(url)));
                        img.src = url;
                    }
                }
            });
            return context;
        }
        static imageSrc(descriptor, fileService) {
            return __awaiter(this, void 0, void 0, function* () {
                if (descriptor.resource.scheme === network_1.Schemas.data) {
                    return descriptor.resource.toString(true /* skip encoding */);
                }
                const { value } = yield fileService.readFile(descriptor.resource);
                return new Blob([value.buffer], { type: getMime(descriptor) });
            });
        }
    }
    InlineImageView.SCALE_PINCH_FACTOR = 0.075;
    InlineImageView.MAX_SCALE = 20;
    InlineImageView.MIN_SCALE = 0.1;
    InlineImageView.zoomLevels = [
        0.1,
        0.2,
        0.3,
        0.4,
        0.5,
        0.6,
        0.7,
        0.8,
        0.9,
        1,
        1.5,
        2,
        3,
        5,
        7,
        10,
        15,
        20
    ];
    /**
     * Enable image-rendering: pixelated for images scaled by more than this.
     */
    InlineImageView.PIXELATION_THRESHOLD = 3;
    /**
     * Store the scale and position of an image so it can be restored when changing editor tabs
     */
    InlineImageView.imageStateCache = new map_1.LRUCache(100);
    __decorate([
        __param(5, instantiation_1.IInstantiationService)
    ], InlineImageView, "create", null);
    function getMime(descriptor) {
        let mime = descriptor.mime;
        if (!mime && descriptor.resource.scheme !== network_1.Schemas.data) {
            mime = mimes.getMediaMime(descriptor.resource.path);
        }
        return mime || mimes.MIME_BINARY;
    }
});
//# sourceMappingURL=resourceViewer.js.map