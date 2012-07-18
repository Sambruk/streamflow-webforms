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
var UrlModule = (function () {
    var inner = {};
    var enduserid;
   
    var urls = {
    	proxy: 		"/proxy/",
    };

    var openCasesQuery = "select href,caseid,description,created,project,status,lastupdated,lastmessage order by lastupdated desc";
    var closedCasesQuery = "select href,caseid,description,created,project,closed,resolution order by closed desc";
    var casesTotalQuery = "select description";
    var caseLogQuery = "select message,sender,created order by created desc";
    var caseLogQueryTotal = "select empty";
    var casesQuery = {};

    inner.init = function(contextRoot){
    	urls.proxy = contextRoot + urls.proxy;
    };
    
    inner.setUserId = function (userid) {
    	this.enduserid = userid;
    	urls.endusers = urls.proxy + 'endusers/';
    	urls.enduser = urls.endusers + this.enduserid + '/';
    };
    
    inner.verifyEndUser = function () {
    	return urls.enduser;
    };
    
    inner.createUser = function () {
    	return urls.endusers + 'create?string=' + this.enduserid;
    };
    
    inner.setupOpenCasesQuery = function () {
    	casesQuery = openCasesQuery;
    };
    
    inner.setupClosedCasesQuery = function () {
    	casesQuery = closedCasesQuery;
    };
    
    inner.setupOpenCasesDataSource = function () {
    	this.casesDataSource = urls.enduser + 'open/cases.json';
    	this.caseDataSource = urls.enduser + 'open/';
    };
    
    inner.setupClosedCasesDataSource = function () {
    	this.casesDataSource = urls.enduser + 'closed/cases.json';
    	this.caseDataSource = urls.enduser + 'closed/';
    };
    
    inner.getCasesDataSource = function () {
    	return this.casesDataSource;
    };
    
    function getOpenCasesDataSource() {
		return urls.enduser + 'open/cases.json';
	};
	
	function getClosedCasesDataSource() {
		return urls.enduser + 'closed/cases.json';
	};
	
	inner.getOpenCasesTotal = function () {
		return this.casesDataSource + '?tq=' + casesTotalQuery;
	};

	inner.getClosedCasesTotal = function () {
		return this.casesDataSource + '?tq=' + casesTotalQuery;
	};

    inner.getCaseDataSource = function () {
    	return this.caseDataSource;
    };
    
    inner.getCasesQuery = function () {
    	return casesQuery;
    };
    
    inner.getOpenCases = function () {
    	return urls.enduser + 'open/cases.json' + '?tq=' + casesQuery;
    };
    
    inner.getCase = function (entityid) {
    	return this.caseDataSource + entityid;
    };
    
    inner.getCaseLogQuery = function () {
    	return caseLogQuery;
    };
    
    inner.getCaseLogDataSource = function (entityid) {
    	return this.caseDataSource + entityid + 'caselog.json?locale=sv';
    };
    
    inner.getCaseLog = function (entityid) {
    	return this.caseDataSource + entityid + 'caselog.json?locale=sv&tq=' + caseLogQuery;
    };
	
	inner.getCaseLogTotal = function (entityid) {
		return this.caseDataSource + entityid + 'caselog.json?locale=sv&tq=' + caseLogQueryTotal;
	};
    inner.getClosedCases = function () {
    	return urls.enduser + 'closed/cases.json' + '?tq=' + casesQuery;
    };
    
    inner.getSubmittedForms = function (entityid) {
    	return this.caseDataSource + entityid + "submittedforms";
    };
    
    inner.getSubmittedFormsQuery = function (entityid) {
    	return this.getSubmittedForms(entityid) + "/index.json";
    };
    
    return inner;
}());