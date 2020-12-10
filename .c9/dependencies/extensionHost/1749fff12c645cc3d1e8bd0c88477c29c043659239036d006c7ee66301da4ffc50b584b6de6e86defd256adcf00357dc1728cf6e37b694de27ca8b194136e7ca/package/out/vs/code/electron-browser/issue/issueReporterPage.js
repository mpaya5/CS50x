/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/nls"], function (require, exports, strings_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = () => `
<div id="issue-reporter">
	<div id="english" class="input-group hidden">${strings_1.escape(nls_1.localize('completeInEnglish', "Please complete the form in English."))}</div>

	<div class="section">
		<div class="input-group">
			<label class="inline-label" for="issue-type">${strings_1.escape(nls_1.localize('issueTypeLabel', "This is a"))}</label>
			<select id="issue-type" class="inline-form-control">
				<!-- To be dynamically filled -->
			</select>
		</div>

		<div class="input-group" id="problem-source">
			<label class="inline-label" for="issue-source">${strings_1.escape(nls_1.localize('issueSourceLabel', "File on"))}<span class="required-input">*</span></label>
			<select id="issue-source" class="inline-form-control" required>
				<!-- To be dynamically filled -->
			</select>
			<div id="problem-source-help-text" class="instructions hidden">${strings_1.escape(nls_1.localize('disableExtensionsLabelText', "Try to reproduce the problem after {0}. If the problem only reproduces when extensions are active, it is likely an issue with an extension."))
        .replace('{0}', `<span tabIndex=0 role="button" id="disableExtensions" class="workbenchCommand">${strings_1.escape(nls_1.localize('disableExtensions', "disabling all extensions and reloading the window"))}</span>`)}
			</div>

			<div id="extension-selection">
				<label class="inline-label" for="extension-selector">${strings_1.escape(nls_1.localize('chooseExtension', "Extension"))} <span class="required-input">*</span></label>
				<select id="extension-selector" class="inline-form-control">
					<!-- To be dynamically filled -->
				</select>
			</div>
		</div>

		<div class="input-group">
			<label class="inline-label" for="issue-title">${strings_1.escape(nls_1.localize('issueTitleLabel', "Title"))} <span class="required-input">*</span></label>
			<input id="issue-title" type="text" class="inline-form-control" placeholder="${strings_1.escape(nls_1.localize('issueTitleRequired', "Please enter a title."))}" required>
			<div id="issue-title-length-validation-error" class="validation-error hidden" role="alert">${strings_1.escape(nls_1.localize('titleLengthValidation', "The title is too long."))}</div>
			<small id="similar-issues">
				<!-- To be dynamically filled -->
			</small>
		</div>

	</div>

	<div class="input-group description-section">
		<label for="description" id="issue-description-label">
			<!-- To be dynamically filled -->
		</label>
		<div class="instructions" id="issue-description-subtitle">
			<!-- To be dynamically filled -->
		</div>
		<div class="block-info-text">
			<textarea name="description" id="description" placeholder="${strings_1.escape(nls_1.localize('details', "Please enter details."))}" required></textarea>
		</div>
	</div>

	<div class="system-info" id="block-container">
		<div class="block block-system">
			<input class="sendData" type="checkbox" id="includeSystemInfo" checked/>
			<label class="caption" for="includeSystemInfo">${strings_1.escape(nls_1.localize({
        key: 'sendSystemInfo',
        comment: ['{0} is either "show" or "hide" and is a button to toggle the visibility of the system information']
    }, "Include my system information ({0})")).replace('{0}', `<a href="#" class="showInfo">${strings_1.escape(nls_1.localize('show', "show"))}</a>`)}</label>
			<div class="block-info hidden">
				<!-- To be dynamically filled -->
			</div>
		</div>
		<div class="block block-process">
			<input class="sendData" type="checkbox" id="includeProcessInfo" checked/>
			<label class="caption" for="includeProcessInfo">${strings_1.escape(nls_1.localize({
        key: 'sendProcessInfo',
        comment: ['{0} is either "show" or "hide" and is a button to toggle the visibility of the process info']
    }, "Include my currently running processes ({0})")).replace('{0}', `<a href="#" class="showInfo">${strings_1.escape(nls_1.localize('show', "show"))}</a>`)}</label>
			<pre class="block-info hidden">
				<code>
				<!-- To be dynamically filled -->
				</code>
			</pre>
		</div>
		<div class="block block-workspace">
			<input class="sendData" type="checkbox" id="includeWorkspaceInfo" checked/>
			<label class="caption" for="includeWorkspaceInfo">${strings_1.escape(nls_1.localize({
        key: 'sendWorkspaceInfo',
        comment: ['{0} is either "show" or "hide" and is a button to toggle the visibility of the workspace information']
    }, "Include my workspace metadata ({0})")).replace('{0}', `<a href="#" class="showInfo">${strings_1.escape(nls_1.localize('show', "show"))}</a>`)}</label>
			<pre id="systemInfo" class="block-info hidden">
				<code>
				<!-- To be dynamically filled -->
				</code>
			</pre>
		</div>
		<div class="block block-extensions">
			<input class="sendData" type="checkbox" id="includeExtensions" checked/>
			<label class="caption" for="includeExtensions">${strings_1.escape(nls_1.localize({
        key: 'sendExtensions',
        comment: ['{0} is either "show" or "hide" and is a button to toggle the visibility of the enabled extensions list']
    }, "Include my enabled extensions ({0})")).replace('{0}', `<a href="#" class="showInfo">${strings_1.escape(nls_1.localize('show', "show"))}</a>`)}</label>
			<div id="systemInfo" class="block-info hidden">
				<!-- To be dynamically filled -->
			</div>
		</div>
		<div class="block block-searchedExtensions">
			<input class="sendData" type="checkbox" id="includeSearchedExtensions" checked/>
			<label class="caption" for="includeSearchedExtensions">${strings_1.escape(nls_1.localize({
        key: 'sendSearchedExtensions',
        comment: ['{0} is either "show" or "hide" and is a button to toggle the visibility of the searched extensions']
    }, "Send searched extensions ({0})")).replace('{0}', `<a href="#" class="showInfo">${strings_1.escape(nls_1.localize('show', "show"))}</a>`)}</label>
			<div class="block-info hidden">
				<!-- To be dynamically filled -->
			</div>
		</div>
		<div class="block block-settingsSearchResults">
			<input class="sendData" type="checkbox" id="includeSettingsSearchDetails" checked/>
			<label class="caption" for="includeSettingsSearchDetails">${strings_1.escape(nls_1.localize({
        key: 'sendSettingsSearchDetails',
        comment: ['{0} is either "show" or "hide" and is a button to toggle the visibility of the search details']
    }, "Send settings search details ({0})")).replace('{0}', `<a href="#" class="showInfo">${strings_1.escape(nls_1.localize('show', "show"))}</a>`)}</label>
			<div class="block-info hidden">
				<!-- To be dynamically filled -->
			</div>
		</div>
	</div>
</div>`;
});
//# sourceMappingURL=issueReporterPage.js.map