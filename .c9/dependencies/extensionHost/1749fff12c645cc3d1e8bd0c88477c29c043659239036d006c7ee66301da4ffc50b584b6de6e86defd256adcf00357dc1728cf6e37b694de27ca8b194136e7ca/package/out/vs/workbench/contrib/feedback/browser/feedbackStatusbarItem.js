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
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/feedback/browser/feedback", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/product/common/product", "vs/platform/statusbar/common/statusbar", "vs/nls", "vs/platform/commands/common/commands", "vs/base/common/uri"], function (require, exports, lifecycle_1, feedback_1, contextView_1, instantiation_1, product_1, statusbar_1, nls_1, commands_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TwitterFeedbackService {
        combineHashTagsAsString() {
            return TwitterFeedbackService.HASHTAGS.join(',');
        }
        submitFeedback(feedback, openerService) {
            const queryString = `?${feedback.sentiment === 1 ? `hashtags=${this.combineHashTagsAsString()}&` : null}ref_src=twsrc%5Etfw&related=twitterapi%2Ctwitter&text=${encodeURIComponent(feedback.feedback)}&tw_p=tweetbutton&via=${TwitterFeedbackService.VIA_NAME}`;
            const url = TwitterFeedbackService.TWITTER_URL + queryString;
            openerService.open(uri_1.URI.parse(url));
        }
        getCharacterLimit(sentiment) {
            let length = 0;
            if (sentiment === 1) {
                TwitterFeedbackService.HASHTAGS.forEach(element => {
                    length += element.length + 2;
                });
            }
            if (TwitterFeedbackService.VIA_NAME) {
                length += ` via @${TwitterFeedbackService.VIA_NAME}`.length;
            }
            return 280 - length;
        }
    }
    TwitterFeedbackService.TWITTER_URL = 'https://twitter.com/intent/tweet';
    TwitterFeedbackService.VIA_NAME = 'code';
    TwitterFeedbackService.HASHTAGS = ['HappyCoding'];
    let FeedbackStatusbarConribution = class FeedbackStatusbarConribution extends lifecycle_1.Disposable {
        constructor(statusbarService, productService, instantiationService, contextViewService) {
            super();
            this.instantiationService = instantiationService;
            this.contextViewService = contextViewService;
            if (productService.sendASmile) {
                this.entry = this._register(statusbarService.addEntry(this.getStatusEntry(), 'status.feedback', nls_1.localize('status.feedback', "Tweet Feedback"), 1 /* RIGHT */, -100 /* towards the end of the right hand side */));
                commands_1.CommandsRegistry.registerCommand('_feedback.open', () => this.toggleFeedback());
            }
        }
        toggleFeedback() {
            if (!this.dropdown) {
                const statusContainr = document.getElementById('status.feedback');
                if (statusContainr) {
                    this.dropdown = this._register(this.instantiationService.createInstance(feedback_1.FeedbackDropdown, statusContainr.getElementsByClassName('octicon').item(0), {
                        contextViewProvider: this.contextViewService,
                        feedbackService: this.instantiationService.createInstance(TwitterFeedbackService),
                        onFeedbackVisibilityChange: visible => this.entry.update(this.getStatusEntry(visible))
                    }));
                }
            }
            if (this.dropdown) {
                if (!this.dropdown.isVisible()) {
                    this.dropdown.show();
                }
                else {
                    this.dropdown.hide();
                }
            }
        }
        getStatusEntry(showBeak) {
            return {
                text: '$(smiley)',
                command: '_feedback.open',
                showBeak
            };
        }
    };
    FeedbackStatusbarConribution = __decorate([
        __param(0, statusbar_1.IStatusbarService),
        __param(1, product_1.IProductService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextViewService)
    ], FeedbackStatusbarConribution);
    exports.FeedbackStatusbarConribution = FeedbackStatusbarConribution;
});
//# sourceMappingURL=feedbackStatusbarItem.js.map