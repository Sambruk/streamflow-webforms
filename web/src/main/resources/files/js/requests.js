/*
 *
 * Copyright 2009-2010 Streamsource AB
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
var RequestModule = (function() {
    var inner = {};
    var error;

    var urls = {
        proxy:      "proxy/",
        surface:    "surface/",
	    eid:        "eidproxy/"
    };

    function request(type, url) {
        return {type:type, url:url, async:false, cache:false, error:errorPopup, dataType:'json'};
    }

    function getData( parameters ) {
        var data;
        parameters.success = function(arg) { data = arg; };
        $.ajax(parameters);
        return data;
    }

    function errorPopup() {
        alert( texts.erroroccurred );
        throw "http call failed";
    }

    inner.setErrorHandler = function( errorHandler ) {
        error = errorHandler;
    }

    inner.updateAccesspoint = function( accesspoint ) {
        if ( !accesspoint ) error( texts.invalidaccesspoint );
        urls.accesspoint = 'accesspoints/' + accesspoint + '/endusers/';
    }

    inner.createUserUrl = function( user ) {
        urls.user = urls.accesspoint + user + '/';
    }

    inner.createCaseUrl = function( caze ) {
        if ( !urls.user ) throw "URL to user not defined";
        urls.caze = urls.user + caze + '/';
        urls.draft = null;
    }

    inner.createFormDraftUrl = function( form ) {
        if ( !urls.caze ) throw "URL to case not defined";
        urls.draft = urls.caze + 'formdrafts/' + form + '/';
    }

    inner.verifyAccessPoint = function() {
        var parameters = request('GET', urls.proxy + urls.accesspoint + '.json');
        parameters.error = function() { error( texts.invalidaccesspoint ); };
        $.ajax( parameters );
    }

    inner.selectEndUser = function() {
        var parameters = request('POST', urls.surface + urls.accesspoint + 'selectenduser.json');
        parameters.error = function() { error( texts.loginfailed ); };
        $.ajax( parameters );
    }

    inner.getUser = function() {
        var params = request('GET', urls.surface + urls.accesspoint + 'userreference.json');
        params.error = function() { error( texts.loginfailed ); };
        return getData( params );
    }

    inner.getCaseForm = function() {
        var parameters = request('GET', urls.proxy + urls.user + 'findcasewithform.json');
        parameters.error = null;
        return getData( parameters );
    }

    inner.getFormDraft = function() {
        var params = request('GET', urls.proxy + urls.draft + 'index.json');
        return getData( params );
    }

    inner.createCaseWithForm = function() {
        var parameters = request('POST', urls.proxy + urls.user + 'createcasewithform.json');
        return getData( parameters );
    }

    inner.updateField = function( fieldDTO ) {
        var parameters = request('PUT', urls.proxy + urls.draft + 'updatefield.json');
        parameters.data = fieldDTO;     
        parameters.error = function(args){
        	alert(""+args);
        };
        return getData( parameters );
    }

    inner.submitAndSend = function() {
        var parameters = request('POST', urls.proxy + urls.draft + 'summary/submitandsend.json');
        $.ajax( parameters );
    }

    inner.discard = function() {
        var parameters = request('POST', urls.proxy + urls.draft + 'discard.json');
        $.ajax( parameters );
    }

    inner.getFormSignatures = function() {
        var parameters = request('GET', urls.proxy + urls.draft + 'summary/signatures.json');
        return getData( parameters ).signatures;
    }

    inner.getProviders = function() {
        var parameters = request('GET', urls.eid + 'sign/providers.json');
        return getData( parameters );
    }

    inner.getCaseName = function() {
        var parameters = request('GET', urls.proxy + urls.caze + 'index.json');
        return getData( parameters ).caseId;
    }

    inner.getCaseUrl = function() {
        return urls.proxy + urls.caze;
    }

    inner.sign = function( signDTO ) {
        var parameters = request('GET', urls.eid + 'sign/sign.htm');
        parameters.dataType = null;
        parameters.data = signDTO;        
        parameters.error = function(args){
        	alert(""+args);
        };
        return getData( parameters );
    }

    inner.verify = function( verifyDTO ) {
        var parameters = request('POST', urls.eid + 'sign/verify.json');
        parameters.data = verifyDTO;
        return getData( parameters );
    }

    inner.addSignature = function( signatureDTO ) {
        var parameters = request('PUT', urls.proxy + urls.draft + 'addsignature.json');
        parameters.data = signatureDTO;   
        $.ajax( parameters );
    }

    inner.attach = function( attachmentDTO ) {
        attachmentDTO.error = errorPopup;
        attachmentDTO.url = urls.surface + urls.draft + 'createattachment';
        $.ajaxFileUpload( attachmentDTO );
    }

    inner.refreshField = function( fieldId ) {
        var parameters = request('GET', urls.proxy + urls.draft + 'fieldvalue.json');
        parameters.data = { string: fieldId };
        var fieldDTO = getData( parameters );
        return fieldDTO.value;
    }

    return inner;
}());