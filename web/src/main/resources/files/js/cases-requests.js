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
//        alert( texts.erroroccurred );
        throw "http call failed";
    }

    function invoke( fn, arguments, message ) {
        var failed = false;
        if( !arguments.error ) {
        	arguments.error = function() {  failed = true; };
        }
        var result = fn( arguments );
        if ( failed ) {
            throw message;
        }
        return result;
    }

    inner.setupUser = function ( userid ) {
        UrlModule.setUserId( userid );
        verifyEndUser();
    };

    function verifyEndUser() {
        // Check existance of user.
        var parameters = request('GET', UrlModule.verifyEndUser());
        parameters.error = function (xhr, ajaxOptions, thrownError){
        	if (xhr.status === 404) {
            	createUser();
        	}
        };
    	invoke($.ajax, parameters);
    }

    function createUser() {
    	var parameters = request('POST', UrlModule.createUser() );
//        invoke( $.ajax, parameters, texts.createuserfailed );
        invoke( $.ajax, parameters, 'Could not create user' );
    };
    
    inner.getOpenCases = function () {
        var parameters = request('GET', UrlModule.getOpenCases());
        return getData( parameters );
    };

    inner.getClosedCases = function () {
        var parameters = request('GET', UrlModule.getClosedCases() );
        parameters.error = null;
        return getData(parameters);
    };

    inner.getCase = function (caseIdentity) {
        var parameters = request('GET', UrlModule.getCase(caseIdentity) );
        parameters.error = null;
        return getData(parameters);
    };

    inner.getCaseHistory = function (caseIdentity) {
        var parameters = request('GET', UrlModule.getCaseHistory(caseIdentity) );
        parameters.error = null;
        return getData(parameters);
    };

    inner.getOpenCase = function (caseIdentity) {
        var parameters = request('GET', UrlModule.getOpenCase(caseIdentity) );
        parameters.error = null;
        return getData(parameters);
    };

    inner.getClosedCase = function ( caseIdentity ) {
        var parameters = request('GET', UrlModule.getClosedCase(caseIdentity) );
        parameters.error = null;
        return getData( parameters );
    };

    inner.getOpenCasesTotal = function () {
    	var parameters = request('GET', UrlModule.getOpenCasesTotal() );
    	parameters.error = null;
    	return getData( parameters );
    };

    inner.getClosedCasesTotal = function () {
    	var parameters = request('GET', UrlModule.getClosedCasesTotal() );
    	parameters.error = null;
    	return getData( parameters );
    };

    return inner;
}());