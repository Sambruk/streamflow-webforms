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
jQuery(document).ready(function() {
	RulesModule.setViewModule(TaskView);

	function login(contextRoot, task) {
		TaskRequestModule.init(contextRoot, task);
		Contexts.init(contexts);

		setupView();
	}

	update = function(id, value) {
		handleEvents(View.updateField(id, value));
	};

	/** Setup functions * */

	function setupForm() {
		if (FormModule.initialized())
			return;
		FormModule.init(TaskRequestModule.getTaskFormDraft(), TaskRequestModule.getMailSelectionMessage());
	}

	function setupRequiredSignatures() {
		FormModule.setRequiredSignatures(TaskRequestModule.getFormSignatures());
	}

    function setupSigningService() {
        if (FormModule.formNeedsSigning()) {
            FormModule.setSigningService(TaskRequestModule.getSigningServiceApi());
        }
    }

	function setupIncomingFormSummary() {
		FormModule.setupIncomingFormSummaryPage(TaskRequestModule.getTaskSubmittedFormSummary());
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

	function validateNumber(number, max, ifError) {
		var nr = parseInt(number);
		if (isNaN(nr) || nr < 0 || nr >= max) {
			throw ifError;
		}
	}

	function handleEvents(eventMap) {
		if (!eventMap.events)
			return;
		$.each(eventMap.events, function(idx, event) {
			var params = $.parseJSON(event.parameters);
			if (event.name == "createdCase") {
				TaskUrlModule.createCaseUrl(params['param1']);
			} else if (event.name == "changedFormDraft") {
				TaskUrlModule.createFormDraftUrl(event.entity);
				FormModule.init($.parseJSON(params['param1']));
			} else if (event.name == "changedFieldValue") {
				FormModule.getField(params['param1']).setUIValue(params['param2']);
			}
		});
	}

	function setupView() {
		TaskView.runView(Contexts.findView(location.hash));
	}

	function rootView() {
		// since we have no root view redirect to first page of
		// form
		throw {
			redirect : Contexts.findUrl(TaskView.incoming)
		}
	}

	var contexts = {
		view : rootView,
		init : [ setupForm, setupIncomingFormSummary, setupRequiredSignatures ],
		subContexts : {
			'incoming' : {
				view : TaskView.incoming,
				init : []
			},
			'idContext' : {
				view : View.formPage,
				init : [ verifyPage, verifyFormEditing ]
			},
			'summary' : {
				view : TaskView.summary,
				init : [ setupSigningService ],
				subContexts : {
					'submit' : {
						view : TaskView.submit,
						init : [ verifySubmit ]
					},
                    'finishSigning' : {
                        view : TaskView.finishSigning
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
			login(contextRoot, task);
		} catch (e) {
			View.error(e);
		}
	});
});
