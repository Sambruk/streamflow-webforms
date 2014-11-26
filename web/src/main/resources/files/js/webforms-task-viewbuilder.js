/*
 *
 * Copyright 2009-2014 Jayway Products AB
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

	inner.sign = function(args) {
		var retVal = doSign();
		if (retVal != 0) {
			var errorKey = "eid-" + retVal;
			throw {
				warning : texts.eiderrormessage + ": " + texts[errorKey],
				redirect : getSummary()
			};
		} else {
			// strip parameters
			var verifyDTO = {};
			$.each($('#eIdPlugin').find('form > input:hidden'), function(idx, value) {
				if (value.name) {
					verifyDTO[value.name] = value.value;
				}
			});
			verifyDTO.name = FormModule.getRequiredSignature();
			verifyDTO.form = FormModule.getFormTBS();
			TaskRequestModule.verify(verifyDTO);

			// Store the email etc before reloading the formdraft
			var confirmationEmail = FormModule.confirmationEmail();
			var confirmationEmailConfirm = FormModule.confirmationEmailConfirm();

			FormModule.init(TaskRequestModule.getFormDraft());
			FormModule.setConfirmationEmail(confirmationEmail);
			FormModule.setConfirmationEmailConfirm(confirmationEmailConfirm);

			// signing success redirect to summary
			throw {
				info : texts.formSigned,
				redirect : getSummary()
			};
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

	function getSign(idx) {
		return '#' + Contexts.findUrl(inner.sign, [ idx ]);
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
				row.append($('<td/>').append(eidProviders(idx)));
				var buttonCell = $('<td/>');
				new View.Button(buttonCell).name(texts.sign).href(getSign(idx)).attr('id', "link_" + idx).image(
						'icon-pencil').enable(false);
				row.append(buttonCell);
			}
			node.append(signaturesNode);
		}
	}

	function toggleSignButton() {
		var selectedEid = FormModule.selectedEid();
		var value = selectedEid.value;
		if (typeof selectedEid !== 'undefined' && value !== texts.provider) {
			var button = $('#link_' + selectedEid.name);
			(selectedEid.selectedIndex == 0 || !FormModule.isSecondSignatureReady()) ? View.enable(button, false)
					: View.enable(button, true);
		}
	}

	function eidProviders(signatureId) {
		var comboBox = View.clone('eidProviders').attr({
			name : signatureId,
			id : "eIdProvider_" + signatureId,
			title : texts.eidProviders
		});
		comboBox.change(function() {
			FormModule.setSelectedEid(this);
			var button = $('#link_' + this.name);
			if (this.selectedIndex == 0 || !FormModule.isSecondSignatureReady()) {
				View.enable(button, false);
			}

			var value = this.value;
			button.attr('href', function() {
				return this.href.split('?provider=')[0] + "?provider=" + value;
			});
			if (this.selectedIndex !== 0 && FormModule.isSecondSignatureReady()) {
				View.enable(button, true);
			}
			var signDTO = {
				transactionId : FormModule.getFormId(),
				tbs : FormModule.getIncomingFormTBS() + FormModule.getFormTBS(),
				provider : value,
				successUrl : "verify",
				errorUrl : "error"
			};

			var htmlSnippet = TaskRequestModule.sign(signDTO);
			$('#eIdPlugin').html(htmlSnippet).hide();
		});
		comboBox.append($('<option>/').append(texts.provider));
		$.each(FormModule.osifProviderLinks(), function(idx, link) {
			comboBox.append($('<option />').attr({
				value : link.provider
			}).text(link.text));
		});

		return comboBox;
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
