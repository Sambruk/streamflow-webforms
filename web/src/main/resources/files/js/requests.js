
/**
 * Module for handling all outgoing requests
 */
var RequestModule = (function() {
    var inner = {};

    var urls = {
        streamflow: "proxy/accesspoints/",
	    surface:    "surface/accesspoints/",
	    eid:        "eidproxy/",
    };

    function errorPopup() {
        alert( texts.erroroccurred );
        throw "http call failed";
    }

    function request(type, url) {
        return {type:type, url:url, async:false, cache:false, error:errorPopup};
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

    inner.updateAccesspoint = function( accesspoint ) {
        if ( !accesspoint ) error( texts.invalidaccesspoint );
        urls.surface += accesspoint + '/endusers/';
        urls.streamflow += accesspoint + '/endusers/';
    }

    inner.createUserUrl = function( user ) {
        urls.user = urls.streamflow + user + '/';

    }

    inner.createCaseUrl = function( caze ) {
        if ( !urls.user ) throw "URL to user not defined";
        urls.caze = urls.user + caze + '/';
    }

    inner.createFormDraftUrl = function( form ) {
        if ( !urls.caze ) throw "URL to case not defined";
        urls.draft = urls.caze + 'formdrafts/' + form + '/';
    }

    inner.verifyAccessPoint = function() {
        var parameters = request('GET', urls.streamflow );
        parameters.error = function() { error( texts.invalidaccesspoint ); };
        $.ajax(parameters);
    }

    inner.selectEndUser = function() {
        var parameters = request('POST', urls.surface + 'selectenduser.json');
        parameters.error = function() { error( texts.loginfailed ); };
        $.ajax(parameters);
    }

    inner.getUser = function() {
        var params = request('GET', urls.surface + 'userreference.json');
        params.error = function() { error( texts.loginfailed ); };
        return getData(params);
    }

    inner.getCaseForm = function() {
        var parameters = request('GET', urls.user + 'findcasewithform.json');
        parameters.error = null;
        return getData( parameters);
    }

    inner.getFormDraft = function() {
        var params = request('GET', urls.draft + 'index.json');
        return getData( params );
    }

    inner.createCaseWithForm = function() {
        var parameters = request('POST', urls.user + 'createcasewithform.json');
        return getData( parameters );
    }

    inner.updateField = function( fieldDTO ) {
        var parameters = request('PUT', urls.draft + 'updatefield.json');
        parameters.data = fieldDTO;
        return getData( parameters );
    }

    inner.submitAndSend = function() {
        var parameters = request('POST', urls.draft + 'summary/submitandsend.json');
        $.ajax(parameters);
    }

    inner.discard = function() {
        var parameters = request('POST', urls.draft + 'discard.json');
        $.ajax(parameters);
    }

    inner.getFormSignatures = function() {
        var parameters = request('GET', urls.draft + 'summary/signatures.json');
        return getData(parameters).signatures;
    }

    inner.getProviders = function() {
        var parameters = request('GET', urls.eid + 'sign/providers.json');
        return getData( parameters );
    }

    inner.getCaseName = function() {
        var parameters = request('GET', urls.caze + 'index.json');
        return getData( parameters ).caseId;
    }

    inner.getCaseUrl = function() {
        return urls.caze;
    }

    inner.sign = function( signDTO ) {
        var parameters = request('GET', urls.eid + 'sign/sign.htm');
        parameters.data = signDTO;
        return getData( parameters );
    }

    inner.verify = function( verifyDTO ) {
        var parameteres = request('POST', urls.eid + 'sign/verify.json');
        parameteres.data = verifyDTO;
        return getData( parameteres);
    }

    inner.addSignature = function( signatureDTO ) {
        var parameteres = request('PUT', urls.draft + 'addsignature.json');
        parameteres.data = signatureDTO;
        $.ajax(parameteres);
    }

    return inner;
}());