/*
 *
 * Copyright 2009-2012 Jayway Products AB
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
jQuery(document).ready(function() {
	var settings;
	RulesModule.setViewModule(View);

	function login(contextRoot, accesspoint) {
		RequestModule.init(contextRoot, accesspoint);
		Contexts.init(contexts);

		setupView();
		loadEidPlugins();
	}

	function loadEidPlugins() {
		if (FormModule.formNeedsSigning()) {
			$("#signerDiv").append(RequestModule.getHeader());
			addSigners($("#signerDiv"));
		}
	}

	update = function(id, value) {
		handleEvents(View.updateField(id, value));
	};

	/** Setup functions * */

	function setupCaseAndForm() {
		if (FormModule.initialized())
			return;
		var data = RequestModule.getCaseForm();
		if (data.caze && data.form) {
			UrlModule.createCaseUrl(data.caze);
			UrlModule.createFormDraftUrl(data.form);
			settings = RequestModule.settings();
			FormModule.init(RequestModule.getFormDraft(), RequestModule.getMailSelectionMessage(), settings);
		} else {
			handleEvents(RequestModule.createCaseWithForm());
		}
	}

	function setupRequiredSignatures() {
		FormModule.setRequiredSignatures(RequestModule.getFormSignatures());
	}

	function setupRequiredSignature(args) {
		FormModule.setRequiredSignature(args.segment);
	}

	function setupProviders() {
		if (!FormModule.providersInitialized() && FormModule.formNeedsSigning()) {
			FormModule.setProviders(RequestModule.getProviders());
		}
	}

	/** Verify functions * */

	function verifySubmit() {
		formIsFilled({
			error : texts.missingMandatoryFields
		});

		if (FormModule.formNeedsSigning() && !FormModule.isFormSigned()) {
			throw {
				error : texts.signBeforeSubmit
			};
		}
	}

	function formIsFilled(ifError) {
		if (FormModule.hasErrors())
			throw ifError;
	}

	function verifyPage(args) {
		validateNumber(args.segment, FormModule.pageCount(), {
			error : texts.invalidpage + args.segment
		});
	}

	function verifyFormEditing() {
		if (FormModule.hasSignatures())
			throw {
				error : texts.signedFormNotEditable
			};
	}

	function verifySigner(args) {
		if (!FormModule.formNeedsSigning())
			throw {
				error : texts.noRequiredSignatures
			};

		formIsFilled({
			error : texts.fillBeforeSign
		});

		validateNumber(args.segment, FormModule.requiredSignedSignaturesCount(), {
			error : texts.requiredSignatureNotValid + args.segment
		});
	}

	function validateNumber(number, max, ifError) {
		var nr = parseInt(number);
		if (isNaN(nr) || nr < 0 || nr >= max) {
			throw ifError;
		}
	}

	function verifyProvider(args) {
		var match = $.grep(FormModule.providerLinks(), function(link, idx) {
			return (link.provider == args.provider);
		});
		if (match.length == 0) {
			throw {
				error : texts.unknownEidProvider
			};
		}
	}

	function handleEvents(eventMap) {
		if (!eventMap.events)
			return;
		$.each(eventMap.events, function(idx, event) {
			var params = $.parseJSON(event.parameters);
			if (event.name == "createdCase") {
				UrlModule.createCaseUrl(params['param1']);
			} else if (event.name == "changedFormDraft") {
				UrlModule.createFormDraftUrl(event.entity);
				FormModule.init($.parseJSON(params['param1']), RequestModule.getMailSelectionMessage());
			} else if (event.name == "changedFieldValue") {
				FormModule.getField(params['param1']).setUIValue(params['param2']);
			}
		});
	}

	function setupView() {
		View.runView(Contexts.findView(location.hash));
	}

	function rootView() {
		// since we have no root view redirect to first page of
		// form
		throw {
			redirect : Contexts.findUrl(View.formPage, [ '0' ])
		}
	}

	var contexts = {
		view : rootView,
		init : [ setupCaseAndForm, setupRequiredSignatures ],
		subContexts : {
			'discard' : {
				view : View.discard
			},
			'idContext' : {
				view : View.formPage,
				init : [ verifyPage, verifyFormEditing ]
			},
			'summary' : {
				view : View.summary,
				init : [ setupProviders ],
				subContexts : {
					'submit' : {
						view : View.submit,
						init : [ verifySubmit ]
					},
					'idContext' : {
						view : View.sign,
						init : [ verifySigner, verifyProvider, setupRequiredSignature ]
					}
				}
			}
		}
	};

	var components = $('#components').hide();
	FieldTypeModule.setTemplates(components);
	View.setTemplates(components);
	components.load(contextRoot + '/static/webforms-components.html', function() {
		try {
			components.detach();
			$(window).hashchange(setupView);
			login(contextRoot, accesspoint);
		} catch (e) {
			View.error(e);
		}
	});
});
