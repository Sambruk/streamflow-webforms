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
/**
 * Module for handling all outgoing requests
 */
var TaskRequestModule = (function() {
	var inner = {};

	function request(type, url) {
		return {
			type : type,
			url : url,
			async : false,
			cache : false,
			error : errorPopup,
			dataType : 'json'
		};
	}

	function getData(parameters) {
		var data;
		parameters.success = function(arg) {
			data = arg;
		};
		$.ajax(parameters);

		return data;
	}

	function errorPopup(jqXHR, textStatus, errorThrown) {
		if (jqXHR.responseText) {
			if (texts[jqXHR.responseText])
				throw {
					error : texts[jqXHR.responseText]
				};
			else
				throw {
					error : texts[jqXHR.responseText]
				};
		} else {
			throw {
				error : texts.erroroccurred + "<br/>Status: " + textStatus + "<br/>Error: " + errorThrown
			};
		}
	}

	function invoke(fn, arguments, message) {
		var failed = false;
		arguments.error = function() {
			failed = true;
		};
		var result = fn(arguments);
		if (failed) {
			throw message;
		}

		return result;
	}

	inner.init = function(contextRoot, task) {
		TaskUrlModule.init(contextRoot, task);
		verifyTask();
	};

	function verifyTask() {
		var parameters = request('GET', TaskUrlModule.verifyTask());
		invoke($.ajax, parameters, texts.invalidtask);
	}

	function selectEndUser() {
		var parameters = request('POST', TaskUrlModule.selectEndUser());
		invoke($.ajax, parameters, texts.loginfailed);
	}

	function getUser() {
		var parameters = request('GET', TaskUrlModule.getUser());

		return invoke(getData, parameters, texts.loginfailed).entity;
	}

	inner.getTaskSubmittedFormSummary = function() {
		var parameters = request('GET', TaskUrlModule.getTaskSubmittedFormSummary());
		parameters.error = null;

		return getData(parameters);
	};

	inner.getTaskFormDraft = function() {
		var parameters = request('GET', TaskUrlModule.getTaskFormDraftUrl());
		parameters.error = null;

		return getData(parameters);
	};

	inner.getMailSelectionMessage = function() {
		var params = request('GET', TaskUrlModule.getMailSelectionMessage());

		return getData(params).string;
	};

	inner.getFormDraft = function() {
		var params = request('GET', TaskUrlModule.getFormDraft());

		return getData(params);
	};

	inner.createCaseWithForm = function() {
		var parameters = request('POST', TaskUrlModule.createCaseWithForm());

		return getData(parameters);
	};

	inner.updateField = function(fieldDTO) {
		var parameters = request('POST', TaskUrlModule.updateField());
		parameters.data = fieldDTO;

		return getData(parameters);
	};

	inner.deleteAttachment = function(attachmentId) {
		var parameters = request('POST', TaskUrlModule.deleteAttachment(attachmentId));
		$.ajax(parameters);
	};

	inner.submitAndSend = function() {
		var parameters = request('POST', TaskUrlModule.submitAndSend());
		$.ajax(parameters);
	};

	inner.discard = function() {
		var parameters = request('POST', TaskUrlModule.discard());
		$.ajax(parameters);
	}

	inner.getFormSignatures = function() {
		var parameters = request('GET', TaskUrlModule.getFormSignatures());

		return getData(parameters).signatures;
	};

	inner.getProviders = function() {
		var parameters = request('GET', TaskUrlModule.getProviders());

		return getData(parameters);
	};

	inner.getHeader = function() {
		var parameters = request('GET', TaskUrlModule.getHeader());
		parameters.dataType = null;

		return invoke(getData, parameters, texts.eidServiceUnavailable);
	};

	inner.getCaseName = function() {
		var parameters = request('GET', TaskUrlModule.getCaseName());

		return getData(parameters).string;
	};

	inner.setMailNotificationEnablement = function(value) {
		var parameters;
		if (value) {
			parameters = request('POST', TaskUrlModule.enableMailNotification());
		} else {
			parameters = request('POST', TaskUrlModule.disableMailNotification());
		}
		$.ajax(parameters);
	};

	inner.setConfirmationEmail = function(stringDTO) {
		var parameters = request('POST', TaskUrlModule.setConfirmationEmail());
		parameters.data = stringDTO;
		$.ajax(parameters);
	};

	inner.sign = function(signDTO) {
		var parameters = request('GET', TaskUrlModule.sign());
		parameters.dataType = null;
		parameters.data = signDTO;

		return getData(parameters);
	};

	inner.verify = function(verifyDTO) {
		var parameters = request('POST', TaskUrlModule.verify());
		parameters.data = verifyDTO;
		invoke($.ajax, parameters, {
			error : texts.verifyfailed,
			redirect : 'summary'
		});
	};

	inner.refreshField = function(fieldId) {
		var parameters = request('GET', TaskUrlModule.refreshField());
		parameters.data = {
			string : fieldId
		};

		return getData(parameters).value;
	};

	return inner;
}());
