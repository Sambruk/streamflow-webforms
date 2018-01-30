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
/**
 * Module for handling all outgoing requests
 */
var RequestModule = (function() {
	var inner = {};

	function request(type, url) {
		return {
			type : type,
			url : url,
			async : false,
			cache : false,
			error : handleError,
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

	function handleError(jqXHR, textStatus, errorThrown) {
		if (jqXHR.responseText) {
			if (texts[jqXHR.responseText])
				throw {
					error : texts[jqXHR.responseText]
				};
			else
				throw {
                    error : texts.erroroccurred
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

	inner.init = function(contextRoot, accesspoint) {
		UrlModule.init(contextRoot, accesspoint);
		verifyAccessPoint();
		selectEndUser();
		UrlModule.setUserUrl(getUser());
	};

	function verifyAccessPoint() {
		var parameters = request('GET', UrlModule.verifyAccessPoint());
		invoke($.ajax, parameters, texts.invalidaccesspoint);
	}

	function selectEndUser() {
		var parameters = request('POST', UrlModule.selectEndUser());
		invoke($.ajax, parameters, texts.loginfailed);
	}

	function getUser() {
		var parameters = request('GET', UrlModule.getUser());

		return invoke(getData, parameters, texts.loginfailed).entity;
	}

	inner.getCaseForm = function() {
		var parameters = request('GET', UrlModule.getCaseForm());
		parameters.error = null;

		return getData(parameters);
	};

	inner.getMailSelectionMessage = function() {
		var params = request('GET', UrlModule.getMailSelectionMessage());

		return getData(params).string;
	};

	inner.getFormDraft = function() {
		var params = request('GET', UrlModule.getFormDraft());

		return getData(params);
	};

	inner.createCaseWithForm = function() {
		var parameters = request('POST', UrlModule.createCaseWithForm());

		return getData(parameters);
	};

	inner.updateField = function(fieldDTO) {
		var parameters = request('POST', UrlModule.updateField());
		parameters.data = fieldDTO;

		return getData(parameters);
	};

	inner.deleteAttachment = function(attachmentId) {
		var parameters = request('POST', UrlModule.deleteAttachment(attachmentId));
		$.ajax(parameters);
	};

	inner.submitAndSend = function() {
		var parameters = request('POST', UrlModule.submitAndSend());
		$.ajax(parameters);
	};

	inner.discard = function() {
		var parameters = request('POST', UrlModule.discard());
		$.ajax(parameters);
	};

	inner.settings = function() {
		var parameters = request('GET', UrlModule.settings());
		return getData(parameters);
	}

	inner.getFormSignatures = function() {
		var parameters = request('GET', UrlModule.getFormSignatures());

		return getData(parameters).signatures;
	};

    //Error handling is not working correctly (if error - no message is shown and view is not rendered correctly)
    inner.getSigningServiceApi = function() {
        var parameters = request('GET', UrlModule.getSigningServiceApi());
        return invoke(getData, parameters, { error : texts.eidServiceUnavailable});
    };

    //Error handling is not working correctly (if error - no message is shown and view is not rendered correctly)
    inner.getGrpEIdProviders = function() {
        var parameters = request('GET', UrlModule.getGrpEIdProviders());
        return invoke(getData, parameters, texts.eidServiceUnavailable);
    };

    inner.grpSign = function(signDTO) {
        var parameters = request('POST', UrlModule.grpSign());
        parameters.data = signDTO;

        return getData(parameters);
    };

    inner.grpCollect = function(collectDTO) {
        var parameters = request('GET', UrlModule.grpCollect());
        parameters.data = collectDTO;

        return getData(parameters);
    };

    inner.getAuthifySigningInfo = function() {
        var parameters = request('GET', UrlModule.getAuthifySigningInfo());
        return invoke(getData, parameters, texts.eidServiceUnavailable);
    };

    inner.saveSignature = function(saveSignatureDTO){
        var parameters = request('POST', UrlModule.saveSignature());
        parameters.data = saveSignatureDTO;
        invoke($.ajax, parameters, {
            error : texts.savesignaturefailed
        });
    };

	inner.getCaseName = function() {
		var parameters = request('GET', UrlModule.getCaseName());

		return getData(parameters).caseId;
	};

	inner.setMailNotificationEnablement = function(value) {
		var parameters;
		if (value) {
			parameters = request('POST', UrlModule.enableMailNotification());
		} else {
			parameters = request('POST', UrlModule.disableMailNotification());
		}
		$.ajax(parameters);
	};

	inner.setConfirmationEmail = function(stringDTO) {
		var parameters = request('POST', UrlModule.setConfirmationEmail());
		parameters.data = stringDTO;
		$.ajax(parameters);
	};

	inner.refreshField = function(fieldId) {
		var parameters = request('GET', UrlModule.refreshField());
		parameters.data = {
			string : fieldId
		};

		return getData(parameters).value;
	};

	inner.setSecondSignatureName = function(stringDTO) {
		var parameters = request('POST', UrlModule.setSecondSignatureName());
		parameters.data = stringDTO;
		invoke($.ajax, parameters, texts.secondSignatureError);
	};

	inner.setSecondSignaturePhoneNumber = function(stringDTO) {
		var parameters = request('POST', UrlModule.setSecondSignaturePhoneNumber());
		parameters.data = stringDTO;
		invoke($.ajax, parameters, texts.secondSignatureError);
	};

	inner.setSecondSignatureSocialSecurityNumber = function(stringDTO) {
		var parameters = request('POST', UrlModule.setSecondSignatureSocialSecurityNumber());
		parameters.data = stringDTO;
		invoke($.ajax, parameters, texts.secondSignatureError);
	};

	inner.setSecondSignatureEmail = function(stringDTO) {
		var parameters = request('POST', UrlModule.setSecondSignatureEmail());
		parameters.data = stringDTO;
		invoke($.ajax, parameters, texts.secondSignatureError);
	};

	inner.setSecondSignatureSingleSignature = function(enabled) {
		var parameters = request('POST', UrlModule.setSecondSignatureSingleSignature());
		var stringDTO = {};
		enabled ? stringDTO.string = 'true' : stringDTO.string = 'false';
		parameters.data = stringDTO;
		$.ajax(parameters);
	};

	return inner;
}());
