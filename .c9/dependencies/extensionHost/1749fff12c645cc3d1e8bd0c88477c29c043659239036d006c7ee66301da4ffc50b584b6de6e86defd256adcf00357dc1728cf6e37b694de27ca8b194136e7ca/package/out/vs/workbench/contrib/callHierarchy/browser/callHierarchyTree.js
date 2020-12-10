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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/filters", "vs/base/browser/ui/iconLabel/iconLabel", "vs/editor/common/modes", "vs/editor/common/core/range", "vs/base/common/hash"], function (require, exports, cancellation_1, filters_1, iconLabel_1, modes_1, range_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Call {
        constructor(item, locations, parent) {
            this.item = item;
            this.locations = locations;
            this.parent = parent;
        }
    }
    exports.Call = Call;
    class SingleDirectionDataSource {
        constructor(provider, getDirection) {
            this.provider = provider;
            this.getDirection = getDirection;
        }
        hasChildren() {
            return true;
        }
        getChildren(element) {
            return __awaiter(this, void 0, void 0, function* () {
                if (element instanceof Call) {
                    try {
                        const direction = this.getDirection();
                        const calls = yield this.provider.resolveCallHierarchyItem(element.item, direction, cancellation_1.CancellationToken.None);
                        if (!calls) {
                            return [];
                        }
                        return calls.map(([item, locations]) => new Call(item, locations, element));
                    }
                    catch (_a) {
                        return [];
                    }
                }
                else {
                    // 'root'
                    return [new Call(element, [{ uri: element.uri, range: range_1.Range.lift(element.range).collapseToStart() }], undefined)];
                }
            });
        }
    }
    exports.SingleDirectionDataSource = SingleDirectionDataSource;
    class IdentityProvider {
        getId(element) {
            return hash_1.hash(element.item.uri.toString(), hash_1.hash(JSON.stringify(element.item.range))).toString() + (element.parent ? this.getId(element.parent) : '');
        }
    }
    exports.IdentityProvider = IdentityProvider;
    class CallRenderingTemplate {
        constructor(iconLabel) {
            this.iconLabel = iconLabel;
        }
    }
    class CallRenderer {
        constructor() {
            this.templateId = CallRenderer.id;
        }
        renderTemplate(container) {
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            return new CallRenderingTemplate(iconLabel);
        }
        renderElement(node, _index, template) {
            const { element, filterData } = node;
            template.iconLabel.setLabel(element.item.name, element.item.detail, {
                labelEscapeNewLines: true,
                matches: filters_1.createMatches(filterData),
                extraClasses: [modes_1.symbolKindToCssClass(element.item.kind, true)]
            });
        }
        disposeTemplate(template) {
            template.iconLabel.dispose();
        }
    }
    CallRenderer.id = 'CallRenderer';
    exports.CallRenderer = CallRenderer;
    class VirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(_element) {
            return CallRenderer.id;
        }
    }
    exports.VirtualDelegate = VirtualDelegate;
});
//# sourceMappingURL=callHierarchyTree.js.map