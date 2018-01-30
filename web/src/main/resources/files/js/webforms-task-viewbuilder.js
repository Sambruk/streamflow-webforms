/*
 *
 * Copyright
 * 2009-2015 Jayway Products AB
 * 2016-2018 Föreningen Sambruk
 *
 * Licensed under AGPL, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.gnu.org/licenses/agpl.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var TaskView = (function() {
	var inner = {};
	var messages = {};
	var fieldGroups = {};

	inner.submit = function() {
		TaskRequestModule.submitAndSend();
		var caseName = TaskRequestModule.getCaseName();
		var printUrl = TaskUrlModule.getPrintUrl(FormModule.getFormId());
		FormModule.destroy();

		var container = $('#container').empty();
		var node = View.clone('thank_you_div');

		if (typeof (caseName) != "undefined") {
			node.find('#thank-you-message').text(texts.formSubmittedThankYou);
			node.find('#caseid_message').text(texts.caseidmessage);
			node.find('#caseid').text(caseName);
		}
		new View.Button(node).image('print').name(texts.print).href(printUrl).attr('target', '_blank');
		container.append(node);
	};

	inner.summary = function(args) {
		createPageContent(getSummary(), function(node) {
			FormModule.foldIncoming(function(page) {
				return foldIncomingPage(node, page);
			});
			FormModule.fold(function(page) {
				return View.foldPage(node, page);
			});
			View.addMailNotification(node, TaskRequestModule);
			addSignaturesDiv(node);
		});
	};

	inner.incoming = function(args) {
		createPageContent(getIncoming(), function(node) {
			// compose previous form summary view here.
			FormModule.foldIncoming(function(page) {
				return foldIncomingPage(node, page);
			});
		});
		messages.info = texts.doublesignaturepreviousmessage.replace('{0}', FormModule.incomingSignerName());
	};

    inner.finishSigning = function(args) {
        $('#signingModal').modal('hide');
        throw {
            info : texts.formSigned,
            redirect : getSummary()
        };
    };

	function createPageContent(page, contentFunction) {
		var errors = $('#inserted_alert');
		var container = $('#container').empty();
		View.addHeader(container);
		var node = View.clone('row');
		container.append(node);
		var content = View.clone('content', 'inserted_content');
		node.append(content);
		addProgressbar(page, FormModule.pages(), content);

		contentFunction(content);

		RulesModule.evaluateRules();

		addButtons(content, page);
		View.addFooter(container);

		RulesModule.applyVisibility(FormModule.pages()[page], false);
	}

	function foldIncomingPage(node, page) {
		var pageDiv = View.clone('previous_form_summary').appendTo(node);
		pageDiv.children('h2').append(page.name);
		pageDiv.children('table').attr("title", page.name);

		return function(field) {
			foldPreviousSummaryField(pageDiv.children('table'), field);
		};
	}

	function foldPreviousSummaryField(node, field) {
		var row = View.clone('field_summary').appendTo(node);
		$('<td class="field_label" />').append(field.field).appendTo(row);
		$('<td class="field_value" />').append(field.value).appendTo(row);
	}

	inner.runView = function(view) {
		try {
			view();
			showMessages();
			$(window).scrollTop(0);
		} catch (e) {
			if (e.message) {
				console.log(e.message);
			}
			messages = {};
			if (e.info)
				messages.info = e.info;
			else if (e.warning)
				messages.warning = e.warning;
			else if (e.error)
				messages.error = e.error;
			else if (e.message)
				messages.error = e.message + ', ' + e.fileName + '(' + e.lineNumber + ')';

			if (e.redirect) {
				redirect(e.redirect);
			} else {
				redirect(getSummary());
			}
		}
	};

	function addButtons(node, page) {
		var buttons = View.clone("buttons");
		new View.Button(buttons, "button_previous").name(texts.previous).href(inner.getPrevious(page)).enable(
				page != getIncoming());
		new View.Button(buttons, "button_next").name(texts.next).href(inner.getNext(page)).enable(page != getSummary());

		if (page == getSummary()) {
			var button = new View.Button(buttons, "button_submit").name(texts.submit).href(getSubmit());
			if (FormModule.canSubmit()) {
				button.addClass("btn-primary");
			} else {
				button.enable(false);
			}
		}
		node.append(buttons);
	}

	inner.getPrevious = function(segment) {
		var current = parseInt(segment);
		if (current === 0 || segment == getIncoming()) {
			return getIncoming();
		}
		for ( var previous = isNaN(current) ? FormModule.pageCount() - 1 : current - 1; previous > 0; previous--) {
			if (FormModule.pages()[previous].visible !== false) {
				return getPage(previous);
			}
		}

		return getPage(0);
	};

	inner.getNext = function(segment) {
		if (segment == getIncoming()) {
			return getPage(0);
		}
		var current = parseInt(segment);
		if (isNaN(current)) {
			return getSummary();
		} else {
			for ( var next = current + 1; next < FormModule.pageCount(); next++) {
				if (FormModule.pages()[next].visible !== false) {
					return getPage(next);
				}
			}
		}

		return getSummary();
	};

	function getPage(page) {
		return '#' + page;
	}

	function getIncoming() {
		return '#' + Contexts.findUrl(inner.incoming);
	}

	function getSummary() {
		return '#' + Contexts.findUrl(inner.summary);
	}

	function getSubmit() {
		return '#' + Contexts.findUrl(inner.submit);
	}

    function getFinishSigning() {
        return '#' + Contexts.findUrl(inner.finishSigning);
    }

	function addSignaturesDiv(node) {
		if (FormModule.formNeedsSigning()) {
			var reqSign = FormModule.getRequiredSignatures()[0];

			var signaturesNode = View.clone('form_signatures');
			signaturesNode.addClass('well');
			signaturesNode.find("h2").append(texts.signature);

			var table = signaturesNode.find('table').attr("title", texts.signatures);
			var idx = 0;
			var row = $('<tr/>');
			table.append(row);
			row.addClass("signature-row");
			row.append($('<td/>').append(reqSign.name + ":"));
			var signature = View.getSignature(reqSign.name, FormModule.getSignatures());
			if (signature) {
				row.append($('<td/>').append(signature.signerName).addClass('signer-name'));
			} else {
                var buttonCell = $('<td/>').addClass('sign-button');
                if(FormModule.signWithGrp()){
                    var grpSigningModal = createGrpSigningDialog(node);
                    new View.Button(buttonCell).attr('id', 'signButton').name(texts.sign).modal('#' + grpSigningModal.attr('id'))
                        .image('icon-pencil').enable(true);
                } else if(FormModule.signWithAuthify()){
                    new View.Button(buttonCell).attr('id', 'signButton').name(texts.sign).image('icon-pencil').enable(true)
                        .click(function(event) {
                            openAuthifySigningDialog(event);
                            return false;
                        });
                }
                row.append(buttonCell);
			}
			node.append(signaturesNode);
		}
	}

    function createGrpSigningDialog(node) {
        if(!FormModule.grpEIdProvidersInitialized()){
            FormModule.setGrpEIdProviders(TaskRequestModule.getGrpEIdProviders());
        }
        var dialog = View.clone('modal', 'signingModal');
        dialog.find('.modal-header').prepend(texts.signature);

        renderGrpSigningDialogFirstStep(dialog);

        dialog.on('show.bs.modal', function(event) {
            try {
                verifySigning();
            } catch(e) {
                event.preventDefault();
                messages.error = e.error;
                showMessages();
                $(window).scrollTop(0);
            }
        });

        dialog.on('hidden.bs.modal', function(event) {
            restartGrpSigningDialog(dialog);
        });

        node.append(dialog);

        return dialog;
    }

    function renderGrpSigningDialogFirstStep(dialog, signingMessages){
        //Dialog body
        dialog.find('.modal-body').empty().append(grpEIdProvidersCombo()).addClass('grp-signing-modal-body');
        if(signingMessages && (signingMessages.info || signingMessages.warning || signingMessages.error)){
            var alert = View.clone('alert');
            alert.insertBefore(dialog.find('#grpEIdProvidersCombo'));

            if (signingMessages.info) {
                alert.append(signingMessages.info);
                alert.addClass("alert-info");
            }
            if (signingMessages.warning) {
                alert.append(signingMessages.warning);
            }
            if (signingMessages.error) {
                alert.append(signingMessages.error);
                alert.addClass("alert-error");
            }
        }

        //Dialog footer
        var dialogFooter = dialog.find('.modal-footer').empty();
        var cancelButton = new View.Button(dialogFooter, 'grpCancelButton')
            .name(texts.cancel)
            .click(function() {
                dialog.modal('hide');
                return false;
            });
        var signButton = new View.Button(dialogFooter, 'grpSignButton')
            .name(texts.sign)
            .image('icon-pencil')
            .click(function() {
                if(View.isEnabled($(this))){
                    grpSigningPerform(dialog);
                }
                return false;
            })
            .enable(false);
    }

    function grpEIdProvidersCombo() {
        var comboBox = View.clone('eidProviders').attr({
            name : 'grpEIdProvidersCombo',
            id : 'grpEIdProvidersCombo',
            title : texts.eidProviders
        });
        comboBox.append($('<option>/').append(texts.provider));
        $.each(FormModule.getGrpEIdProviders(), function(idx, provider) {
            comboBox.append($('<option />').attr({
                value : provider.id
            }).text(provider.name));
        });
        comboBox.change(function() {
            var button = $('#grpSignButton');
            if (this.selectedIndex == 0) {
                View.enable(button, false);
            } else if(this.selectedIndex !== 0) {
                View.enable(button, true);
            }
        });

        return comboBox;
    }

    function restartGrpSigningDialog(dialog, signingMessages) {
        if(dialog.collectTimer){
            clearTimeout(dialog.collectTimer);
            dialog.collectTimer = null;
        }
        renderGrpSigningDialogFirstStep(dialog, signingMessages);
    }

    function grpSigningPerform(dialog) {
        var selectedEIdProvider = dialog.find('#grpEIdProvidersCombo').val();
        FormModule.setRequiredSignature(0);

        try {
            verifyGrpProvider(selectedEIdProvider);

            var dialogBody = dialog.find('.modal-body').empty();
            var dialogFooter = dialog.find('.modal-footer');

            //Dialog footer
            View.enable(dialogFooter.find('#grpSignButton'), false);

            //Dialog body
            var waiting = View.clone('waiting', 'grpSigningWaiting');
            var bodyContent = View.clone('grpSigningModalPerformBody');
            bodyContent.find('#signingStatus').prepend(waiting);
            var openBankIDManually = bodyContent.find("#openBankIDManually").hide();
            openBankIDManually.find('#openBankIDMessage').append(texts.eidOpenBankIDHelp);

            var openBankIDButton = new View.Button(openBankIDManually, 'grpBankIdButton')
                .name(texts.eidOpenBankIDApp)
                .enable(false)
                .click(function () {
                    var thisButton = $(this);
                    if (View.isEnabled(thisButton)) {
                        View.enable(thisButton, false);
                    } else {
                        return false;
                    }
                });
            dialogBody.append(bodyContent);

            //Call sign@API
            //TODO (?): Add client IP to sign request (recommended even if not used yet) - how to obtain?
            var signDTO = {
                transactionId:FormModule.getFormId() + (new Date()).getTime(),
                text:FormModule.getFormTBS(),
                provider:selectedEIdProvider
            };
            var signResponse = TaskRequestModule.grpSign(signDTO);

            //Add iframe opening BankID application
            var bankIDAppUrl = "bankid:///?autostarttoken=" + signResponse.autoStartToken + "&redirect=null";
            var bankIDIFrame = View.clone('iframe', 'bankIDIframe')
                .attr('src', bankIDAppUrl)
                .attr('width', 0 + 'px')
                .attr('height', 0 + 'px')
                .hide();
            dialogBody.append(bankIDIFrame);

            //Show button opening BankID manually
            setTimeout(function () {
                openBankIDButton.href(bankIDAppUrl).enable(true);
                openBankIDManually.show();
            }, 5000);

            //Call collect@API (getting signing status)
            var collectDTO = {
                transactionId:signResponse.transactionId,
                orderRef:signResponse.orderRef,
                provider:signResponse.provider
            };

            var collectResponse;
            dialog.collectTimer = setTimeout(function () {
                try {
                    collectResponse = TaskRequestModule.grpCollect(collectDTO);
                    if (collectResponse.progressStatus === 'COMPLETE') {
                        grpSigningDone(dialog, signResponse.provider, collectResponse);
                    } else if (collectResponse.progressStatus === 'STARTED') {
                        var messageKey = "grpstatus-" + collectResponse.progressStatus;
                        restartGrpSigningDialog(dialog, {error:texts[messageKey]});
                    } else {
                        var messageKey = "grpstatus-" + collectResponse.progressStatus;
                        bodyContent.find('#signingStatusMessage').text(texts[messageKey]);
                        dialog.collectTimer = setTimeout(arguments.callee, signResponse.collectIntervalMs);
                    }
                } catch (e) {
                    restartGrpSigningDialog(dialog, e);
                }
            }, signResponse.collectIntervalMs);

        } catch (e) {
            restartGrpSigningDialog(dialog, e);
        }
    }

    function verifyGrpProvider(chosenProvider) {
        var match = $.grep(FormModule.getGrpEIdProviders(), function(provider, idx) {
            return (provider.id === chosenProvider);
        });
        if (match.length == 0) {
            throw {
                error : texts.unknownEidProvider
            };
        }
    }

    function openAuthifySigningDialog(event) {
        try {
            verifySigning();

            var authifySigningInfo = getAuthifySigningInfo();
            var dataToSign = FormModule.getFormTBS();
            verifyAuthifySigningData(dataToSign, authifySigningInfo.invalidCharacters);

            FormModule.setRequiredSignature(0);

            var params = {
                'data_to_sign' : dataToSign,
                'callback_page' : contextRoot + '/?authify_callback=1'
            };
            openWindowWithPost(authifySigningInfo.url, 'width=450, height=350, scrollbars=yes, resizable=yes, top=10, left=10', 'authifysigning', params);
        } catch(e) {
            event.preventDefault();
            messages.error = e.error;
            showMessages();
            $(window).scrollTop(0);
        }
    }

    function verifyAuthifySigningData(dataToSign, invalidCharacters) {
        $.each(invalidCharacters, function(idx, character) {
            if(dataToSign.indexOf(character) != -1) {
                throw {
                    error : texts.invalidCharacterForAuthifySigning
                };
            }
        });
    }

    function getAuthifySigningInfo() {
        return TaskRequestModule.getAuthifySigningInfo();
    }

    function openWindowWithPost(url, windowoptions, name, params) {
        var form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', url);
        form.setAttribute('target', name);
        for (var i in params) {
            if (params.hasOwnProperty(i)) {
                var input = document.createElement('input');
                input.type = 'hidden';
                input.name = i;
                input.value = params[i];
                form.appendChild(input);
            }
        }
        document.body.appendChild(form);
        window.open(contextRoot + '/static/blank.html', name, windowoptions);
        form.submit();
        document.body.removeChild(form);
    }

    inner.handleAuthifyCallback = function (signingData) {
        saveSignature(signingData, signingData.provider);
        redirect(getFinishSigning());
    };

    function verifySigning() {
        if (!FormModule.formNeedsSigning())
            throw {
                error : texts.noRequiredSignatures
            };

        if (FormModule.hasErrors()){
            throw {
                error : texts.fillBeforeSign
            };
        }
    }

    function grpSigningDone(dialog, provider, signingData) {
        saveSignature(signingData, provider);

        var dialogBody = dialog.find('.modal-body').empty();
        var dialogFooter = dialog.find('.modal-footer').empty();

        //Dialog body
        dialogBody.append(texts.signOk);

        //Dialog footer
        var closeButton = new View.Button(dialogFooter, 'signingModalCloseButton')
            .name(texts.close)
            .href(getFinishSigning());

        //X button in dialog header (should do the same as closeButton above in this step)
        dialog.find('.modal-header a.close').removeAttr('data-dismiss').attr('href', getFinishSigning());
    }

    function saveSignature(signingData, provider) {
        var saveSignatureDTO = {};
        saveSignatureDTO.name = FormModule.getRequiredSignature();
        saveSignatureDTO.form = FormModule.getFormTBS();
        saveSignatureDTO.encodedTbs = signingData.encodedText;
        saveSignatureDTO.signature = signingData.signature;
        saveSignatureDTO.provider = provider;
        saveSignatureDTO.signerId = signingData.signerId;
        saveSignatureDTO.signerName = signingData.signerName;

        TaskRequestModule.saveSignature(saveSignatureDTO);

        //Store the email etc before reloading the formdraft
        var confirmationEmail = FormModule.confirmationEmail();
        var confirmationEmailConfirm = FormModule.confirmationEmailConfirm();

        //Reload form draft
        FormModule.init(TaskRequestModule.getFormDraft());
        FormModule.setConfirmationEmail(confirmationEmail);
        FormModule.setConfirmationEmailConfirm(confirmationEmailConfirm);
    }

	function redirect(view) {
		location.hash = view;
	}

	function showMessages() {
		if (messages.info || messages.warning || messages.error) {
			var node = View.clone('alert', "inserted_alert");
			var content = $('#inserted_content');
			var breadcrumb = content.find('ul.breadcrumb');
			node.insertAfter(breadcrumb);

			if (messages.info) {
				node.append(messages.info);
				node.addClass("alert-info");
			}
			if (messages.warning) {
				node.append(messages.warning);
			}
			if (messages.error) {
				node.append(messages.error);
				node.addClass("alert-error");
			}
		}
		messages = {};
	}

	function addProgressbar(current, pages, contentNode) {
		var progress = View.clone('progress');
		progress.append(createProgressItem(current == getIncoming(), getIncoming(), texts.incomingform, "Incoming"));
		$.each(pages, function(idx, page) {
			progress.append(createProgressItem(idx == current, getPage(idx), page.title, idx));
		});

		progress.append(createProgressItem(current == getSummary(), getSummary(), texts.summary, "Summary"));
		progress.find('li').last().find('.divider').remove();
		contentNode.append(progress);
	}

	function createProgressItem(selected, href, title, idx) {
		if (selected) {
			var pageElm = View.clone('progressItemActive');
			pageElm.prepend(title);
			pageElm.addClass("active");

			return pageElm;
		} else {
			var pageElm = View.clone('progressItem', 'progressItem' + idx);
			pageElm.find('a').append(title).attr('href', href);

			return pageElm;
		}
	}

	return inner;
}());
