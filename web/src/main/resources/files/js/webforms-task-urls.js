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
var TaskUrlModule = (function() {
    var inner = {};

    var urls = {
        proxy:      "/proxy/",
        surface:    "/surface/",
	    eid:        "/eidproxy/"
    };


    inner.init = function( contextRoot, task ) {
    	urls.proxy = contextRoot + urls.proxy;
    	urls.surface = contextRoot + urls.surface;
    	urls.eid = contextRoot + urls.eid;
        urls.task = 'tasks/' + task + '/';
    }

    inner.verifyTask = function() {
        return urls.proxy + urls.task + '.json';
    }

    inner.selectEndUser = function() {
        return urls.surface + urls.task + 'selectenduser.json';
    }

    inner.getUser = function() {
        return urls.surface + urls.task + 'userreference.json';
    }
    
    inner.setUserUrl = function( user ) {
        urls.user = urls.task + user + '/';
        urls.proxyuser = urls.task + user + '/drafts/';
    }

    inner.getTaskFormDraftUrl = function( form ) {
        if ( !urls.task ) throw "URL to task not defined";
        urls.draft = urls.task + 'formdraft/';
        urls.proxydraft = urls.task + 'formdraft/';
        return urls.proxy + urls.draft + 'index.json';        
    }

    inner.getTaskSubmittedFormSummary = function () {
    	return urls.proxy + urls.task + 'submittedform/summary/index.json';
    }
    
    inner.getTaskForm = function() {
        return urls.proxy + urls.proxyuser + 'findcasewithform.json';
    }

    inner.getFormDraft = function() {
        return urls.proxy + urls.proxydraft + 'index.json';
    }

    inner.getMailSelectionMessage = function() {
        return urls.proxy + urls.proxydraft + 'summary/mailselectionmessage.json';
    }

    inner.createCaseWithForm = function() {
        return urls.proxy + urls.proxyuser + 'createcasewithform.json';
    }

    inner.updateField = function( ) {
        return urls.proxy + urls.proxydraft + 'updatefield.json';
    }

    inner.enableMailNotification = function() {
        return urls.proxy + urls.proxydraft + 'summary/enablemailmessage.json';
    }

    inner.disableMailNotification = function() {
        return urls.proxy + urls.proxydraft + 'summary/disablemailmessage.json';
    }

    inner.setConfirmationEmail = function() {
        return urls.proxy + urls.proxydraft + 'summary/changeemailstobenotified.json';
    }

    inner.submitAndSend = function() {
        return urls.proxy + urls.proxydraft + 'summary/submitandsend.json';
    }

    inner.discard = function() {
        return urls.proxy + urls.proxydraft + 'discard.json';
    }

    inner.getFormSignatures = function() {
        return urls.proxy + urls.proxydraft + 'summary/signatures.json';
    }

    inner.getProviders = function() {
        return urls.eid + 'sign/providers.json';
    }

    inner.getHeader = function() {
        return urls.eid + 'sign/header.htm';
    }

    inner.getCaseName = function() {
        return urls.proxy + urls.proxycaze + 'index.json';
    }

    inner.getCaseUrl = function() {
        return urls.proxy + urls.proxycaze;
    }

    inner.sign = function() {
        return urls.eid + 'sign/surface.htm';
    }

    inner.verify = function( ) {
        return urls.surface + urls.draft + 'verify.json';
    }

    inner.attach = function( ) {
        return urls.surface + urls.draft + 'createattachment';
    }

    inner.deleteAttachment = function( attachmentId ) {
    	return urls.proxy + urls.proxydraft + 'attachments/' + attachmentId + '/delete';
    }
    
    inner.refreshField = function( ) {
        return urls.proxy + urls.proxydraft + 'fieldvalue.json';
    }

    inner.getPrintUrl = function( formId ) {
        return inner.getCaseUrl() +'submittedforms/'+ formId + '/generateformaspdf';
    }

    return inner;
}());