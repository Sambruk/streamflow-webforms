/*
 *
 * Copyright 2009-2015 Jayway Products AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var View = (function() {
	var inner = {};
	var messages = {};
	var templates;

	inner.error = function(message) {
		var node = inner.clone('alert', "inserted_alert");
		node.addClass("alert-error");
		node.append(message);
		var breadcrumbNode = $('#inserted_content').find('ul.breadcrumb');
		node.insertAfter(breadcrumbNode);
	};

	inner.discard = function(args) {
		RequestModule.discard();
		FormModule.destroy();

		var container = $('#container').empty();
		var node = inner.clone('thank_you_div');
		var alert = inner.clone('alert');
		alert.addClass("alert-info");
		alert.append(texts.formdiscarded);
		node.prepend(alert);

		new inner.Button(node).name(texts.restart).href("#");
		container.append(node);
	};

	inner.submit = function() {
		RequestModule.submitAndSend();
		var caseName = RequestModule.getCaseName();
		var printUrl = UrlModule.getPrintUrl(FormModule.getFormId());
		FormModule.destroy();

		var container = $('#container').empty();
		var node = inner.clone('thank_you_div');

		if (typeof (caseName) != "undefined") {
			node.find('#thank-you-message').text(texts.formSubmittedThankYou);
			node.find('#caseid_message').text(texts.caseidmessage);
			node.find('#caseid').text(caseName);
		}
		new inner.Button(node).image('print').name(texts.print).href(printUrl).attr('target', '_blank');
		container.append(node);
	};

	inner.formPage = function(args) {
		var page = parseInt(args.segment);
		createPageContent(args.segment, function(node) {
			var form = inner.clone("form");
			var fieldset = form.children("fieldset");
			fieldset.children("legend").text(FormModule.pages()[page].title);
			FormModule.foldEditPage(page, function(field) {
				foldEditField(fieldset, field);
			});
			$.each(FormModule.pages()[page].fields, function(i, field) {
				if (field.fieldGroup) {
					var group = form.find("#" + field.fieldGroup);
					group.append(form.find("#Field" + field.id));
				}
			});
			node.append(form);
		});
        // Init each GeoLocationField
        $.each( FormModule.pages()[ page ].fields, function(index, field ) {
        	if (field.fieldType == 'GeoLocationFieldValue') {
				field.initMap();
        	}
        });
	};

	inner.summary = function(args) {
		createPageContent(getSummary(), function(node) {
			FormModule.fold(function(page) {
				return inner.foldPage(node, page);
			});
			inner.addMailNotification(node, RequestModule);
			addSecondSignatureDiv(node);
			addSignaturesDiv(node);
		});
	};

	inner.missing = function(args) {
		var container = $('#container').empty();
		var node = inner.clone('thank_you_div');
		var alert = inner.clone('alert');
		alert.addClass("alert-info");
		alert.append(texts.missingEid);
		node.prepend(alert);

		container.append(node);
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
		inner.addHeader(container);
		var node = inner.clone('row');
		container.append(node);
		var content = inner.clone('content', 'inserted_content');
		node.append(content);
		addProgressbar(page, FormModule.pages(), content);

		contentFunction(content);

		RulesModule.evaluateRules();

		addButtons(content, page);
		inner.addFooter(container);

		RulesModule.applyVisibility(FormModule.pages()[page], false);
	}

	function foldEditField(node, field) {
		var fieldNode = inner.clone('formfield', 'Field' + field.id).appendTo(node);
		var controlsNode = fieldNode.find('div.controls');
		FieldTypeModule.createFieldUI(field, controlsNode);

		if (field.fieldType === "CommentFieldValue")
			fieldNode.find('.control-label').remove();
		else {
			var fieldHeader = fieldNode.find('.control-label');
			fieldHeader.append(field.name);
			if (field.fieldType !== "FieldGroupFieldValue") {
				mandatory(fieldHeader, field);
				hint(fieldHeader, field);
				help(fieldHeader, field);
			}
		}
		field.refreshUI();
	}

	function mandatory(node, field) {
		if (field.field.field.mandatory) {
			inner.clone('mandatory').appendTo(node);
		}
	}

	function hint(node, field) {
		if (field.fieldValue.hint) {
			inner.clone('hint', 'hint' + field.id).text(' (' + field.fieldValue.hint + ')').appendTo(node);
		}
	}

	inner.foldPage = function(node, page) {
		var pageDiv = inner.clone('form_page_summary', "form_page_summary" + page.index).appendTo(node);
		pageDiv.children('h2').append(inner.clone("link").attr('href', getPage(page.index)).text(page.title));
		pageDiv.children('table').attr("title", page.title);

		return function(field) {
			foldField(pageDiv.children('table'), field);
		};
	};

	function foldField(node, field) {
		if (field.fieldType == "CommentFieldValue")
			return;

		var row = inner.clone('field_summary', "Field" + field.id).appendTo(node);
		var label = $('<td class="field_label" />').append(field.name).appendTo(row);
		if (field.fieldType == "FieldGroupFieldValue") {
			label.attr("colspan", "2").addClass("field_group");
		} else {
		    if (field.fieldType == "GeoLocationFieldValue") {
	        	if (field.mapValue.isPoint) {
	        		$('<td class="field_value"/>').append( inner.clone( 'map_point') ).append(texts.mapPoint).appendTo( row );
	        	} else if (field.mapValue.isPolyline){
	        		$('<td class="field_value"/>').append( inner.clone( 'map_polyline') ).append(texts.mapPolyline).appendTo( row );
	        	} else if (field.mapValue.isPolygon) {
	        			$('<td class="field_value"/>').append( inner.clone( 'map_polygon') ).append(texts.mapPolygon).appendTo( row );
	        	}
	        } else {
	        	$('<td class="field_value"/>').append( field.formattedValue ).appendTo( row );
	        }
		}
		if (field.fieldGroup) {
			label.addClass("field_group_field");
		}
		if (field.field.field.mandatory && !field.formattedValue) {
			row.addClass('validation-missing');
			row.append($('<td class="field_message pull-right" />').append(inner.clone('label_missing')));
		} else if (field.invalidformat) {
			row.addClass('validation-error');
			row.append($('<td class="field_message pull-right" />').append(inner.clone('label_error')));
		}
	}

	function help(node, field) {
		if (field.field.field.note != "" && field.fieldType != "CommentFieldValue")
			inner.clone('help-block').append(field.field.field.note).insertAfter(node);
	}

	function enableSecondSignatureFields(secondSignature) {
		var enable = false;
		var signature = inner.getSignature(FormModule.getRequiredSignatures()[0].name, FormModule.getSignatures());
		signature ? enable = false : enable = true;
		var inputArray = secondSignature.find('input');
		for ( var i = 0; i < inputArray.length; i++) {
			if (enable) {
				inputArray[i].disabled ? inputArray[i].removeAttr("disabled") : '';
			} else {
				inputArray[i].disabled = "disabled";
			}
		}
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

	inner.updateField = function(fieldId, fieldValue) {
		var fieldDTO = {
			field : fieldId,
			value : fieldValue
		};
		var image = $('#Field' + fieldId + ' .fieldwaiting > img').show();
		try {
			if (FormModule.isSecondSigningFlow())
				return TaskRequestModule.updateField(fieldDTO);

			return RequestModule.updateField(fieldDTO);
		} catch (e) {
			message = {
				error : e.info
			};
			showMessages();

			return "";
		} finally {
			image.hide();
		}
	};

	inner.addHeader = function(node) {
		var header = inner.clone('form_header');
		header.find('h1').text(FormModule.title());
		node.prepend(header);
	};

	function addButtons(node, page) {
		var buttons = inner.clone("buttons");
		var previousBtn = new inner.Button(buttons, "button_previous").name(texts.previous).href(
				inner.getPrevious(page));
		new inner.Button(buttons, "button_next").name(texts.next).href(inner.getNext(page))
				.enable(page != getSummary());

		if (!FormModule.isSecondSigningFlow()) {
			previousBtn.enable(page != 0);
			var dialogElement = createDiscardDialog(node);
			new inner.Button(buttons).name(texts.discard).confirm('#' + dialogElement.attr('id'))
					.addClass("btn-danger");
		} else {
			previousBtn.enable(page != getIncoming());
		}

		if (page == getSummary()) {
			var button = new inner.Button(buttons, "button_submit").name(texts.submit).href(getSubmit());
			if (FormModule.canSubmit()) {
				button.addClass("btn-primary");
			} else {
				button.enable(false);
			}
		}
		node.append(buttons);
	}

	function createDiscardDialog(node) {
		var dialog = inner.clone('modal', 'confirmAbortModal');
		dialog.find('.modal-header').prepend(texts.discard);
		dialog.find('.modal-body').append(texts.confirmDiscard);
		dialog.find('.modal-footer').append();
		var button = new inner.Button(dialog.find('.modal-footer')).name(texts.no).attr({
			'data-dismiss' : 'modal'
		});
		var button = new inner.Button(dialog.find('.modal-footer')).name(texts.yes).attr({
			'data-dismiss' : 'modal'
		}).href(getDiscard()).click(function() {
			inner.discard();
			dialog.modal('hide');
		});
		node.append(dialog);

		return dialog;
	}

	inner.addFooter = function(node) {
		var footer = inner.clone('footer');
		node.append(footer);
	};

	inner.getPrevious = function(segment) {
		var current = parseInt(segment);
		if (current === 0) {
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
		var current = parseInt(segment);
		if (isNaN(current)) {
			return getSummary();
		} else {
			for ( var next = current + 1; next < FormModule.pageCount(); next++) {
				if (FormModule.pages()[next].visible !== false) {
					return getPage(next);
				}
			}

			return getSummary();
		}
	};

	function getPage(page) {
		return '#' + Contexts.findUrl(inner.formPage, [ page ]);
	}

	function getIncoming() {
		return '#incoming';
	}

	function getSummary() {
		return '#summary';
	}

	function getSecondSignSummary() {
		return '#' + Contexts.findUrl(inner.secondSignSummary);
	}

	function getSubmit() {
		return '#' + Contexts.findUrl(inner.submit);
	}

	function getDiscard() {
		return '#' + Contexts.findUrl(inner.discard);
	}

    function getFinishSigning() {
        return '#' + Contexts.findUrl(inner.finishSigning);
    }

	inner.addMailNotification = function(node, requestModule) {
		var message = FormModule.getMailSelectionMessage();
		if (message) {
			var notification = inner.clone('mailNotification', "insertedMailNotification");
			var controls = notification.find('#mailControls');
			var inputs = notification.find('#mailInputs');

			var checkbox = inner.clone('checkbox', 'mailCheckbox').attr("for", "mailCheckboxInput");
			checkbox.find('input').attr("id", "mailCheckboxInput")
					.prop('checked', FormModule.mailNotificationEnabled());

			checkbox.append(message);
			controls.append(checkbox);

			inputs.find('#confirmation-email-label').text(texts.email);
			inputs.find('#confirmation-email-confirm-label').text(texts.confirmEmail);
			var emailField = inputs.find('#confirmation-email');
			var emailConfirmField = inputs.find('#confirmation-email-confirm');

			emailField.val(FormModule.confirmationEmail());
			emailField.blur(function() {
				// update server
				var stringDTO = {};
				stringDTO.string = emailField.val();
				requestModule.setConfirmationEmail(stringDTO);
				FormModule.setConfirmationEmail(stringDTO.string);
			});
			// Fill with value that is temporary stored in the application while
			// running.
			// Not persisted on the server
			emailConfirmField.val(FormModule.confirmationEmailConfirm());
			emailConfirmField.blur(function() {
				FormModule.setConfirmationEmailConfirm(emailConfirmField.val());
			});

			var emailFunction = function() {
				// if not match show error and disable submit-button
				if (emailConfirmField.val() != emailField.val()) {
					inputs.addClass('error');
					inputs.find('#confirmation-help').append(texts.emailMismatch);
					toggleSubmitButton(false);

					emailConfirmField.focus(function() {
						// Remove old error messages and enable submit button
						inputs.removeClass("error");
						inputs.find('#confirmation-help').text("");
						emailConfirmField.focus(function() {
						});
					});
				} else if (emailField.val()) {
					toggleSubmitButton(true);
				}
			};

			if (FormModule.mailNotificationEnabled()) {
				toggleSubmitButton(false);
				emailFunction.call();
			} else {
				inputs.hide();
			}

			checkbox.find('input').click(function() {
				var checked = checkbox.find('input').prop('checked');
				requestModule.setMailNotificationEnablement(checked);
				FormModule.setMailNotificationEnabled(checked);

				if (checked) {
					inputs.show('slow');
					toggleSubmitButton(false);
					emailFunction.call();
				} else {
					inputs.hide('slow');
					toggleSubmitButton(true);
				}

			});
			emailConfirmField.blur(emailFunction);

			node.append(notification);
		}
	}

	function toggleSubmitButton(enabled) {
		if (enabled && FormModule.canSubmit()) {
			inner.enable($('#button_submit'), true);
			$('#button_submit').addClass("btn-primary");
		} else {
			inner.enable($('#button_submit'), false);
			$('#button_submit').removeClass("btn-primary");
		}
	}

	function addSignaturesDiv(node) {
		if (FormModule.formNeedsSigning()) {
			var reqSign = FormModule.getRequiredSignatures()[0];

			var signaturesNode = inner.clone('form_signatures');
			signaturesNode.addClass('well');
			signaturesNode.find("h2").append(texts.signature);

			var table = signaturesNode.find('table').attr("title", texts.signatures);
			var idx = 0;
			var row = $('<tr/>');
			table.append(row);
			row.addClass("signature-row");
			row.append($('<td/>').append(reqSign.name + ":"));
			var signature = inner.getSignature(reqSign.name, FormModule.getSignatures());
			if (signature) {
				row.append($('<td/>').append(signature.signerName).addClass('signer-name'));
			} else {
				var buttonCell = $('<td/>').addClass('sign-button');
                if(FormModule.signWithGrp()){
                    var grpSigningModal = createGrpSigningDialog(node);
                    new inner.Button(buttonCell).attr('id', 'signButton').name(texts.sign).modal('#' + grpSigningModal.attr('id'))
                        .image('icon-pencil').enable(true);
                } else if(FormModule.signWithAuthify()){
                    new inner.Button(buttonCell).attr('id', 'signButton').name(texts.sign).image('icon-pencil').enable(true)
                        .click(function(event) {
                            if(isSignButtonEnabled()){ //Button could be disabled due to incorrect data in second signature form
                                openAuthifySigningDialog(event);
                                return false;
                            } else {
                                event.preventDefault();
                            }
                        });
                }
				row.append(buttonCell);
			}
			node.append(signaturesNode);
            toggleSignButton(false);
		}
	}

    function createGrpSigningDialog(node) {
        if(!FormModule.grpEIdProvidersInitialized()){
            FormModule.setGrpEIdProviders(RequestModule.getGrpEIdProviders());
        }
        var dialog = inner.clone('modal', 'signingModal');
        dialog.find('.modal-header').prepend(texts.signature);

        renderGrpSigningDialogFirstStep(dialog);

        dialog.on('show.bs.modal', function(event) {
            if(isSignButtonEnabled()){ //Button could be disabled due to incorrect data in second signature form
                try {
                    verifySigning();
                } catch(e) {
                    event.preventDefault();
                    messages.error = e.error;
                    showMessages();
                    $(window).scrollTop(0);
                }
            } else {
                event.preventDefault();
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
            var alert = inner.clone('alert');
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
        var cancelButton = new inner.Button(dialogFooter, 'grpCancelButton')
            .name(texts.cancel)
            .click(function() {
                dialog.modal('hide');
                return false;
            });
        var signButton = new inner.Button(dialogFooter, 'grpSignButton')
            .name(texts.sign)
            .image('icon-pencil')
            .click(function() {
                if(inner.isEnabled($(this))){
                    grpSigningPerform(dialog);
                }
                return false;
            })
            .enable(false);
    }

    function grpEIdProvidersCombo() {
        var comboBox = inner.clone('eidProviders').attr({
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
                inner.enable(button, false);
            } else if(this.selectedIndex !== 0) {
                inner.enable(button, true);
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
            inner.enable(dialogFooter.find('#grpSignButton'), false);

            //Dialog body
            var waiting = inner.clone('waiting', 'grpSigningWaiting');
            var bodyContent = inner.clone('grpSigningModalPerformBody');
            bodyContent.find('#signingStatus').prepend(waiting);
            var openBankIDManually = bodyContent.find("#openBankIDManually").hide();
            openBankIDManually.find('#openBankIDMessage').append(texts.eidOpenBankIDHelp);

            var openBankIDButton = new inner.Button(openBankIDManually, 'grpBankIdButton')
                .name(texts.eidOpenBankIDApp)
                .enable(false)
                .click(function () {
                    var thisButton = $(this);
                    if (inner.isEnabled(thisButton)) {
                        inner.enable(thisButton, false);
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
            var signResponse = RequestModule.grpSign(signDTO);

            //Add iframe opening BankID application
            var bankIDAppUrl = "bankid:///?autostarttoken=" + signResponse.autoStartToken + "&redirect=null";
            var bankIDIFrame = inner.clone('iframe', 'bankIDIframe')
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
                    collectResponse = RequestModule.grpCollect(collectDTO);
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
        return RequestModule.getAuthifySigningInfo();
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
        var closeButton = new inner.Button(dialogFooter, 'signingModalCloseButton')
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

        RequestModule.saveSignature(saveSignatureDTO);

        //Store the email etc before reloading the formdraft
        var confirmationEmail = FormModule.confirmationEmail();
        var confirmationEmailConfirm = FormModule.confirmationEmailConfirm();

        if (FormModule.formNeedsSecondSignature()) {
            var secondSignatureName = FormModule.secondSignatureName();
            var secondSignaturePhoneNumber = FormModule.secondSignaturePhoneNumber();
            var secondSignatureSocialSecurityNumber = FormModule.secondSignatureSocialSecurityNumber();
            var secondSignatureEmail = FormModule.secondSignatureEmail();
            var secondSignatureEmailConfirm = FormModule.secondSignatureEmailConfirm();
            var secondSignatureSingleSignature = FormModule.secondSignatureSingleSignature();
            if (!FormModule.secondSignatureSingleSignature()) {
                RequestModule.setSecondSignatureSingleSignature(false);
                FormModule.setSecondSignatureSingleSignature(false);
                secondSignatureSingleSignature = FormModule.secondSignatureSingleSignature();
            }
        }

        //Reload form draft
        FormModule.init(RequestModule.getFormDraft());
        FormModule.setConfirmationEmail(confirmationEmail);
        FormModule.setConfirmationEmailConfirm(confirmationEmailConfirm);

        if (FormModule.formNeedsSecondSignature()) {
            FormModule.setSecondSignatureName(secondSignatureName);
            FormModule.setSecondSignaturePhoneNumber(secondSignaturePhoneNumber);
            FormModule.setSecondSignatureSocialSecurityNumber(secondSignatureSocialSecurityNumber);
            FormModule.setSecondSignatureEmail(secondSignatureEmail);
            FormModule.setSecondSignatureEmailConfirm(secondSignatureEmailConfirm);
            FormModule.setSecondSignatureSingleSignature(secondSignatureSingleSignature);
        }
    }

	function addSecondSignatureDiv(node) {
		if (FormModule.formNeedsSecondSignature()) {
			var reqSign = FormModule.getRequiredSignatures()[1];
			var secondSignature = inner.clone('second_signature');
			var signatureFields = secondSignature.find('#secondsignature_fields');

			secondSignature.find('#secondsignature-label').text(reqSign.name);
			secondSignature.find('#secondsignaturetext').text(texts.secondSignatureComment);

			secondSignature.find('#name-label').text(texts.name);
			secondSignature.find('#socialsecuritynumber-label').text(texts.socialSecurityNumber);
			secondSignature.find('#phonenumber-label').text(texts.phonenumber);

			secondSignature.find('#email-label').text(texts.email);
			secondSignature.find('#emailconfirm-label').text(texts.confirmEmail);

			if (!reqSign.mandatory) {
				var singleSignatureCheckboxLabel = secondSignature.find('#singlesignaturecheckbox-label');
				var isChecked = FormModule.secondSignatureSingleSignature();
				singleSignatureCheckboxLabel.append(reqSign.question);
				secondSignature.find('#singlesignaturecheckbox').prop('checked', isChecked);

				isChecked ? signatureFields.hide() : '';

				secondSignature.find('#singlesignaturecheckbox').click(function() {
					var checked = secondSignature.find('#singlesignaturecheckbox').prop('checked');
					RequestModule.setSecondSignatureSingleSignature(checked);
					FormModule.setSecondSignatureSingleSignature(checked);
					if (checked) {
						signatureFields.hide('slow');
					} else {
						signatureFields.show('slow');
					}
					toggleSignButton(false);
				});
			} else {
				secondSignature.find('#singlesignaturecheckbox-label').hide();
			}

			updateSecondSignatureName(secondSignature.find('#name'));
			setMandatory(secondSignature.find('#name-label'), secondSignature.find('#name'));
			updateSecondSignaturePhoneNumber(secondSignature.find('#phonenumber'));
			setMandatory(secondSignature.find('#phonenumber-label'), secondSignature.find('#phonenumber'));
			updateSecondSignatureSocialSecurityNumber(secondSignature.find('#socialsecuritynumber'));
			setMandatory(secondSignature.find('#socialsecuritynumber-label'), secondSignature
					.find('#socialsecuritynumber'));
			setHint(secondSignature.find('#socialsecuritynumber-label'), secondSignature.find('#socialsecuritynumber'),
					texts.socialSecurityNumberHint);
			updateSecondSignatureEmail(secondSignature.find('#emailfields'));
			setMandatory(secondSignature.find('#email-label'), secondSignature.find('#email'));
			updateSecondSignatureEmailConfirm(secondSignature.find('#emailfields'));
			setMandatory(secondSignature.find('#emailconfirm-label'), secondSignature.find('#emailconfirm'));

			enableSecondSignatureFields(secondSignature);

			node.append(secondSignature);
		}
	}

	function validateSecondSignatureEmail(emailField) {
		var disableSignButton = false;
		var email = emailField.find('#email');
		var emailconfirm = emailField.find('#emailconfirm');
		if (email.val() !== emailconfirm.val()) {
			emailField.addClass('error');
			emailField.find('#confirmation-help').append(texts.emailMismatch);
			disableSignButton = true;
		} else if (email.hasClass('validation-error')) {
			emailField.addClass('error');
			emailField.find('#confirmation-help').append(texts.emailNotAnEmail);
			disableSignButton = true;
		} else {
			emailField.removeClass('error');
		}
		toggleSignButton(disableSignButton);
	}

	function updateSecondSignatureName(nameField) {
		nameField.val(FormModule.secondSignatureName());
		nameField.blur(function() {
			var disableSignButton = false;
			var stringDTO = {};
			stringDTO.string = nameField.val();
			try {
				RequestModule.setSecondSignatureName(stringDTO);
				nameField.parent().removeClass('error');
				nameField.parent().find('#name-help').text("");
				FormModule.setSecondSignatureName(stringDTO.string);
			} catch (errorMessage) {
				FormModule.setSecondSignatureName("");
				nameField.parent().addClass('error');
				nameField.parent().find('#name-help').text(texts.invalidformat);
				disableSignButton = true;
			}
			toggleSignButton(disableSignButton);
		});
	}

	function updateSecondSignaturePhoneNumber(phoneNumberField) {
		phoneNumberField.val(FormModule.secondSignaturePhoneNumber());
		phoneNumberField.blur(function() {
			var disableSignButton = false;
			var stringDTO = {};
			stringDTO.string = phoneNumberField.val();
			try {
				RequestModule.setSecondSignaturePhoneNumber(stringDTO);
				phoneNumberField.parent().removeClass('error');
				phoneNumberField.parent().find('#phonenumber-help').text("");
				FormModule.setSecondSignaturePhoneNumber(stringDTO.string);
			} catch (errorMessage) {
				FormModule.setSecondSignaturePhoneNumber("");
				phoneNumberField.parent().addClass('error');
				phoneNumberField.parent().find('#phonenumber-help').text(texts.invalidformat);
				disableSignButton = true;
			}
			toggleSignButton(disableSignButton);
		});
	}

	function updateSecondSignatureSocialSecurityNumber(socialSecurityField) {
		socialSecurityField.val(FormModule.secondSignatureSocialSecurityNumber());
		socialSecurityField.blur(function() {
			var disableSignButton = false;
			var stringDTO = {};
			stringDTO.string = socialSecurityField.val();
			try {
				RequestModule.setSecondSignatureSocialSecurityNumber(stringDTO);
				socialSecurityField.parent().removeClass('error');
				socialSecurityField.parent().find('#socialsecuritynumber-help').text("");
				FormModule.setSecondSignatureSocialSecurityNumber(stringDTO.string);
			} catch (errorMessage) {
				FormModule.setSecondSignatureSocialSecurityNumber("");
				socialSecurityField.parent().addClass('error');
				socialSecurityField.parent().find('#socialsecuritynumber-help').text(texts.invalidformat);
				disableSignButton = true;
			}
			toggleSignButton(disableSignButton);
		});
	}

	function updateSecondSignatureEmail(emailField) {
		var email = emailField.find('#email');
		email.val(FormModule.secondSignatureEmail());
		email.blur(function() {
			var stringDTO = {};
			stringDTO.string = email.val();
			try {
				RequestModule.setSecondSignatureEmail(stringDTO);
				email.removeClass('validation-error');
				FormModule.setSecondSignatureEmail(stringDTO.string);
			} catch (errorMessage) {
				FormModule.setSecondSignatureEmail("");
				email.addClass('validation-error');
			}
			if (emailField.find('#emailconfirm').val() != "") {
				validateSecondSignatureEmail(emailField);
			}
		});
		email.focus(function() {
			email.removeClass('validation-error');
			emailField.find('#confirmation-help').text("");
		});
	}

	function updateSecondSignatureEmailConfirm(emailField) {
		var email = emailField.find('#emailconfirm')
		email.val(FormModule.secondSignatureEmailConfirm());
		email.blur(function() {
			FormModule.setSecondSignatureEmailConfirm(email.val());
			validateSecondSignatureEmail(emailField);
		});
		email.focus(function() {
			emailField.find('#confirmation-help').text("");
		});
	}

	function setMandatory(node, field) {
		inner.clone('mandatory').appendTo(node);
	}

	function setHint(node, field, hintText) {
		inner.clone('hint', 'hint_' + field.attr('id')).text(' (' + hintText + ')').appendTo(node);
	}

	function toggleSignButton(disable) {
        var button = $('#signButton');
        (disable || !FormModule.isSecondSignatureReady()) ? inner.enable(button,
                false) : inner.enable(button, true);
	}

    function isSignButtonEnabled() {
        var signButton = $('#signButton');
        return inner.isEnabled(signButton);
    }

	inner.getSignature = function(name, signatures) {
		var match;
		$.each(signatures, function(idxSign, signature) {
			if (name == signature.name)
				match = signature;
		});

		return match;
	};

	function redirect(view) {
		location.hash = view;
	}

	function showMessages() {
		if (messages.info || messages.warning || messages.error) {
			var node = inner.clone('alert');
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
		var progress = inner.clone('progress');
		if (FormModule.isSecondSigningFlow()) {
			progress
					.append(createProgressItem(current == getIncoming(), getIncoming(), texts.incomingform, "Incoming"));
		}
		$.each(pages, function(idx, page) {
			progress.append(createProgressItem(idx == current, getPage(idx), page.title, idx));
		});

		progress.append(createProgressItem(current == getSummary(), getSummary(), texts.summary, "Summary"));
		progress.find('li').last().find('.divider').remove();
		contentNode.append(progress);
	}

	function createProgressItem(selected, href, title, idx) {
		if (selected) {
			var pageElm = inner.clone('progressItemActive');
			pageElm.prepend(title);
			pageElm.addClass("active");

			return pageElm;
		} else {
			var pageElm = inner.clone('progressItem', 'progressItem' + idx);
			pageElm.find('a').append(title).attr({
				'href' : href
			});

			return pageElm;
		}
	}

	inner.Button = function(placeholder, id) {
		this.elm = inner.clone('button', id);
		placeholder.append(this.elm);

		return this;
	};

	inner.Button.prototype.confirm = function(modalElement) {
		var button = this.elm;
		button.attr({
			'href' : modalElement,
			'data-toggle' : 'modal',
			'data-backdrop' : false
		});

		return this;
	};

    inner.Button.prototype.modal = function(modalElement) {
        var button = this.elm;
        button.attr({
            'href' : modalElement,
            'data-toggle' : 'modal',
            'data-backdrop' : 'static'
        });

        return this;
    };

	inner.Button.prototype.small = function() {
		this.elm.addClass('btn-small');

		return this;
	};

	inner.Button.prototype.attr = function(key, value) {
		this.elm.attr(key, value);

		return this;
	};

	inner.Button.prototype.addClass = function(clazz) {
		this.elm.addClass(clazz);

		return this;
	};

	inner.Button.prototype.image = function(imageClass) {
		this.elm.prepend('<i class="' + imageClass + '"/> ');

		return this;
	};

	inner.Button.prototype.name = function(title) {
		this.elm.append(title);

		return this;
	};

	inner.Button.prototype.href = function(href) {
		this.elm.attr('href', href);

		return this;
	};

	inner.Button.prototype.enable = function(_enable) {
		inner.enable(this.elm, _enable);

		return this;
	};

	inner.Button.prototype.click = function(fn) {
		this.elm.click(fn);

		return this;
	};

    inner.Button.prototype.show = function() {
        this.elm.show();

        return this;
    };

    inner.Button.prototype.hide = function() {
        this.elm.hide();

        return this;
    };

	inner.enable = function(button, _enable) {
		if (_enable) {
			button.removeClass('disabled');
			button.removeAttr("onclick");
		} else {
			button.addClass('disabled');
			button.attr("onClick", "return false;");
		}
	};

    inner.isEnabled = function(button){
        return !button.hasClass('disabled');
    };

	inner.clone = function(id, newId) {
		if (!newId)
			return templates.find('#' + id).clone().removeAttr('id');

		return templates.find('#' + id).clone().attr('id', newId);
	};

	inner.setTemplates = function(_templates) {
		templates = _templates;
	};

	return inner;
}());
