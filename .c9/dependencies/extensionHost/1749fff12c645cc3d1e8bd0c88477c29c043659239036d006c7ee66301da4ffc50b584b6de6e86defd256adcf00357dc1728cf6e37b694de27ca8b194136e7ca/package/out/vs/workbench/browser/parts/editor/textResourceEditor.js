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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/common/editor/resourceEditorInput", "vs/workbench/common/editor/textEditorModel", "vs/workbench/common/editor/untitledEditorInput", "vs/workbench/browser/parts/editor/textEditor", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/resourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/event", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/windows/common/windows"], function (require, exports, nls, types, resourceEditorInput_1, textEditorModel_1, untitledEditorInput_1, textEditor_1, telemetry_1, storage_1, resourceConfiguration_1, instantiation_1, themeService_1, textfiles_1, event_1, editorGroupsService_1, editorService_1, windows_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An editor implementation that is capable of showing the contents of resource inputs. Uses
     * the TextEditor widget to show the contents.
     */
    let AbstractTextResourceEditor = class AbstractTextResourceEditor extends textEditor_1.BaseTextEditor {
        constructor(id, telemetryService, instantiationService, storageService, configurationService, themeService, editorGroupService, textFileService, editorService, windowService) {
            super(id, telemetryService, instantiationService, storageService, configurationService, themeService, textFileService, editorService, editorGroupService, windowService);
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return nls.localize('textEditor', "Text Editor");
        }
        setInput(input, options, token) {
            const _super = Object.create(null, {
                setInput: { get: () => super.setInput }
            });
            return __awaiter(this, void 0, void 0, function* () {
                // Remember view settings if input changes
                this.saveTextResourceEditorViewState(this.input);
                // Set input and resolve
                yield _super.setInput.call(this, input, options, token);
                const resolvedModel = yield input.resolve();
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Assert Model instance
                if (!(resolvedModel instanceof textEditorModel_1.BaseTextEditorModel)) {
                    throw new Error('Unable to open file as text');
                }
                // Set Editor Model
                const textEditor = this.getControl();
                const textEditorModel = resolvedModel.textEditorModel;
                textEditor.setModel(textEditorModel);
                // Apply Options from TextOptions
                let optionsGotApplied = false;
                const textOptions = options;
                if (textOptions && types.isFunction(textOptions.apply)) {
                    optionsGotApplied = textOptions.apply(textEditor, 1 /* Immediate */);
                }
                // Otherwise restore View State
                if (!optionsGotApplied) {
                    this.restoreTextResourceEditorViewState(input);
                }
            });
        }
        restoreTextResourceEditorViewState(input) {
            if (input instanceof untitledEditorInput_1.UntitledEditorInput || input instanceof resourceEditorInput_1.ResourceEditorInput) {
                const viewState = this.loadTextEditorViewState(input.getResource());
                if (viewState) {
                    this.getControl().restoreViewState(viewState);
                }
            }
        }
        setOptions(options) {
            const textOptions = options;
            if (textOptions && types.isFunction(textOptions.apply)) {
                textOptions.apply(this.getControl(), 0 /* Smooth */);
            }
        }
        getConfigurationOverrides() {
            const options = super.getConfigurationOverrides();
            options.readOnly = !(this.input instanceof untitledEditorInput_1.UntitledEditorInput); // all resource editors are readonly except for the untitled one;
            return options;
        }
        getAriaLabel() {
            const input = this.input;
            const isReadonly = !(this.input instanceof untitledEditorInput_1.UntitledEditorInput);
            let ariaLabel;
            const inputName = input && input.getName();
            if (isReadonly) {
                ariaLabel = inputName ? nls.localize('readonlyEditorWithInputAriaLabel', "{0}. Readonly text editor.", inputName) : nls.localize('readonlyEditorAriaLabel', "Readonly text editor.");
            }
            else {
                ariaLabel = inputName ? nls.localize('untitledFileEditorWithInputAriaLabel', "{0}. Untitled file text editor.", inputName) : nls.localize('untitledFileEditorAriaLabel', "Untitled file text editor.");
            }
            return ariaLabel;
        }
        /**
         * Reveals the last line of this editor if it has a model set.
         */
        revealLastLine() {
            const codeEditor = this.getControl();
            const model = codeEditor.getModel();
            if (model) {
                const lastLine = model.getLineCount();
                codeEditor.revealPosition({ lineNumber: lastLine, column: model.getLineMaxColumn(lastLine) }, 0 /* Smooth */);
            }
        }
        clearInput() {
            // Keep editor view state in settings to restore when coming back
            this.saveTextResourceEditorViewState(this.input);
            // Clear Model
            this.getControl().setModel(null);
            super.clearInput();
        }
        saveState() {
            // Save View State (only for untitled)
            if (this.input instanceof untitledEditorInput_1.UntitledEditorInput) {
                this.saveTextResourceEditorViewState(this.input);
            }
            super.saveState();
        }
        saveTextResourceEditorViewState(input) {
            if (!(input instanceof untitledEditorInput_1.UntitledEditorInput) && !(input instanceof resourceEditorInput_1.ResourceEditorInput)) {
                return; // only enabled for untitled and resource inputs
            }
            const resource = input.getResource();
            // Clear view state if input is disposed
            if (input.isDisposed()) {
                super.clearTextEditorViewState([resource]);
            }
            // Otherwise save it
            else {
                super.saveTextEditorViewState(resource);
                // Make sure to clean up when the input gets disposed
                event_1.Event.once(input.onDispose)(() => {
                    super.clearTextEditorViewState([resource]);
                });
            }
        }
    };
    AbstractTextResourceEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, textfiles_1.ITextFileService),
        __param(8, editorService_1.IEditorService),
        __param(9, windows_1.IWindowService)
    ], AbstractTextResourceEditor);
    exports.AbstractTextResourceEditor = AbstractTextResourceEditor;
    let TextResourceEditor = class TextResourceEditor extends AbstractTextResourceEditor {
        constructor(telemetryService, instantiationService, storageService, configurationService, themeService, textFileService, editorService, editorGroupService, windowService) {
            super(TextResourceEditor.ID, telemetryService, instantiationService, storageService, configurationService, themeService, editorGroupService, textFileService, editorService, windowService);
        }
    };
    TextResourceEditor.ID = 'workbench.editors.textResourceEditor';
    TextResourceEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, resourceConfiguration_1.ITextResourceConfigurationService),
        __param(4, themeService_1.IThemeService),
        __param(5, textfiles_1.ITextFileService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, windows_1.IWindowService)
    ], TextResourceEditor);
    exports.TextResourceEditor = TextResourceEditor;
});
//# sourceMappingURL=textResourceEditor.js.map