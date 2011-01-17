

var UrlModule = (function() {
    var inner = {};

    var urls = {
        proxy:      "proxy/",
        surface:    "surface/",
	    eid:        "eidproxy/"
    };


    inner.setAccessPoint = function( accesspoint ) {
        urls.accesspoint = 'accesspoints/' + accesspoint + '/endusers/';
    }

    inner.verifyAccessPoint = function() {
        return urls.proxy + urls.accesspoint + '.json';
    }

    inner.selectEndUser = function() {
        return urls.surface + urls.accesspoint + 'selectenduser.json';
    }

    inner.getUser = function() {
        return urls.surface + urls.accesspoint + 'userreference.json';
    }

    inner.setUserUrl = function( user ) {
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

    inner.getCaseForm = function() {
        return urls.proxy + urls.user + 'findcasewithform.json';
    }

    inner.getFormDraft = function() {
        return urls.proxy + urls.draft + 'index.json';
    }

    inner.createCaseWithForm = function() {
        return urls.proxy + urls.user + 'createcasewithform.json';
    }

    inner.updateField = function( ) {
        return urls.proxy + urls.draft + 'updatefield.json';
    }

    inner.submitAndSend = function() {
        return urls.proxy + urls.draft + 'summary/submitandsend.json';
    }

    inner.discard = function() {
        return urls.proxy + urls.draft + 'discard.json';
    }

    inner.getFormSignatures = function() {
        return urls.proxy + urls.draft + 'summary/signatures.json';
    }

    inner.getProviders = function() {
        return urls.eid + 'sign/providers.json';
    }

    inner.getHeader = function() {
        return urls.eid + 'sign/header.htm';
    }

    inner.getCaseName = function() {
        return urls.proxy + urls.caze + 'index.json';
    }

    inner.getCaseUrl = function() {
        return urls.proxy + urls.caze;
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

    inner.refreshField = function( ) {
        return urls.proxy + urls.draft + 'fieldvalue.json';
    }

    inner.getPrintUrl = function( formId ) {
        return inner.getCaseUrl() +'submittedforms/'+ formId + '/generateformaspdf';
    }

    return inner;
}());