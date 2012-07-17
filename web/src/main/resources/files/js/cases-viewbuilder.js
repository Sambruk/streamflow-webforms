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
var View = (function() {
	var inner = {};
	var messages = {};
	var casesNodeId = {};
	var caseNodeId = {};
	var formatViewAction = {};
	var pagingAction = {};
	var store = {};
	var casesTotal;

	var casesPageSize = PersistModule.getCasesPageSize() ? PersistModule.getCasesPageSize() : 5;

	// Adding support for jQuery UI and the portlet standard
	var casesCssClasses = {
		'headerRow' : 'ui-widget-header portlet-table-header',
		'headerCell' : 'portlet-table-subheader',
		'oddTableRow' : 'portlet-table-alternate',
		'tableRow' : 'ui-widget-content',
		'tableCell' : 'portlet-table-body',
		'selectedTableRow' : 'ui-state-active portlet-table-selected',
		'hoverTableRow' : 'ui-state-hover',
		'rowNumberCell' : ''
	};

	var casesOptions = {
			'showRowNumber' : true,
			'allowHtml' : true,
			'cssClassNames' : casesCssClasses,
			'pageSize' : casesPageSize,
			'sort' : 'disable'
		};


	// Adding support for jQuery UI and the portlet standard
	var caseLogCssClasses = {
		'headerRow' : 'ui-widget-header portlet-table-header',
		'headerCell' : 'portlet-table-subheader',
		'oddTableRow' : 'portlet-table-alternate',
		'tableRow' : 'ui-widget-content',
		'tableCell' : 'portlet-table-body',
		'rowNumberCell' : ''
//		'selectedTableRow' : 'ui-state-active',
//		'hoverTableRow' : 'ui-state-hover'
	};

	var caseLogOptions = {
		'showRowNumber' : false,
		'allowHtml' : true,
		'cssClassNames' : caseLogCssClasses, 
		'sortColumn': 1,
		'sortAscending': false,
		'page' : 'disable'
	};

	inner.error = function(message) {
		var node = clone('ErrorMessage');
		node.text(message);
		displayView(node);
	};

	/* Adjust for flexibility. */
	inner.setOption = function(prop, value) {
		casesOptions[prop] = value;
		PersistModule.setCasesPageSize(value);
		buildCases();
		removeCaseDetails();
		removeCaseLog();
	};
	
	function setupCasesTotal(casesTotalJson) {
		casesTotal = casesTotalJson.table.rows.length;
		casesOptions['rowsTotal'] = casesTotal;
		return casesTotal;
	}
	
	function setupCaseLogTotal(caseLogTotalJson) {
		caseLogTotal = caseLogTotalJson.table.rows.length;
		caseLogOptions['rowsTotal'] = caseLogTotal;
		return caseLogTotal;
	}
	
	inner.openCases = function() {
		var openCasesTotal = setupCasesTotal(RequestModule.getOpenCasesTotal());
		caseNodeId = 'open-case';
		var node = clone('open-cases');
		displayView(node);
		drawUserInfo();
		pagingAction = function (pageSize, pageIndex, callback) {
			var from = parseInt(pageSize)*(parseInt(pageIndex))+1;
			var to = from+parseInt(pageSize)-1;
			if (casesTotal){
				to = casesTotal<to ? casesTotal : to;
				$('#open-cases-header').text(texts.opencasesheader + ' (' + openCasesTotal + texts.totalcasespiecesheader + ')');
				$('#pagination-info').text(replacePlaceholdersInTranslatedString(texts.labelpaginationinfo, from, to, casesTotal));
			} else {
				$('#open-cases-header').text(texts.opencasesheader);
				$('#pagination-info').text('');
			}
		} 
		pagingAction(casesOptions['pageSize'], 0);
		casesNodeId = node.find('#open-cases-table').attr('id');
		formatViewAction = function(dataTable, dataView) {
			
			dataView.setColumns([1,
			                     2,
			                     {calc:cellFormatCreated, type:"string", label:texts.columnlabelcreated},
			                     {calc:cellTranslateCaseStatus, type:"string", label:texts.columnlabelstatus},
			                     {calc:cellFormatLastUpdated, type:"string", label:texts.columnlabellastupdated}]);
			
			function cellFormatCreated(dataTable, rowNum){
				return formatDate(utcStringToDate(dataTable.getValue(rowNum, 3)));
			}

			function cellTranslateCaseStatus(dataTable, rowNum){
				return translateCaseStatus(dataTable.getValue(rowNum, 5));
			}

			function cellFormatLastUpdated(dataTable, rowNum){
				return formatDate(utcStringToDate(dataTable.getValue(rowNum, 6)));
			}
			
			// Table Column Translations
			dataTable.setColumnLabel(0, texts.columnlabelhref);
			dataTable.setColumnLabel(1, texts.columnlabelcaseid);
			dataTable.setColumnLabel(2, texts.columnlabeldescription);
			dataTable.setColumnLabel(4, texts.columnlabelproject);
			
		};
		google.load('visualization', '1', {'callback' : buildCases, 'packages' : ['table']});
	};

	inner.closedCases = function() {
		caseNodeId = 'closed-case';
		var node = clone('closed-cases');
		displayView(node);
		drawUserInfo();
		var closedCasesTotal = setupCasesTotal(RequestModule.getClosedCasesTotal());
		pagingAction = function (pageSize, pageIndex, callback) {
			var from = parseInt(pageSize)*(parseInt(pageIndex))+1;
			var to = from+parseInt(pageSize)-1;
			if (casesTotal){
				to = casesTotal<to ? casesTotal : to;
				var userObj = LoginModule.currentUser();
				$('#closed-cases-header').text(texts.closedcasesheader + ' (' + closedCasesTotal + texts.totalcasespiecesheader + ')');
				$('#user-info').text(userObj.name + ' - ' + userObj.contactId);
				$('#pagination-info').text(replacePlaceholdersInTranslatedString(texts.labelpaginationinfo, from, to, casesTotal));
			} else {
				$('#closed-cases-header').text(texts.closedcasesheader);
				$('#pagination-info').text('');
			}
		} 
		pagingAction(casesOptions['pageSize'], 0);
		casesNodeId = node.find('#closed-cases-table').attr('id');
		formatViewAction = function(dataTable, dataView) {
			
			dataView.setColumns([1,
			                     2,
			                     {calc:cellFormatCreated, type:"string", label:texts.columnlabelcreated},
			                     {calc:cellFormatClosed, type:"string", label:texts.columnlabelclosed},
			                     6]);
			
			function cellFormatCreated(dataTable, rowNum){
				return formatDate(utcStringToDate(dataTable.getValue(rowNum, 3)));
			}

			function cellFormatClosed(dataTable, rowNum){
				return formatDate(utcStringToDate(dataTable.getValue(rowNum, 5)));
			}
			
			// Table Column Translations
			dataTable.setColumnLabel(1, texts.columnlabelcaseid);
			dataTable.setColumnLabel(2, texts.columnlabeldescription);
			dataTable.setColumnLabel(6, texts.columnlabelresolution);
			
		};
		google.load('visualization', '1', {'callback' : buildCases, 'packages' : ['table']});
	};
	
	function drawUserInfo() {
		var userObj = LoginModule.currentUser();
		$('#user-info').text(userObj.name + ' - ' + userObj.contactId);
	}
	
	/*
	 * Replaces the '{#}' placeholders in a translation string
	 * with the submitted arguments in order. */
	function replacePlaceholdersInTranslatedString(targetString) {
		$.each(arguments, function(index, value) {
			targetString = targetString.replace('{' + index + '}', value);
		});
		return targetString;
	}
	
	function selectionHandler(row, dataTable) {
		if (row === undefined) {
			removeCaseDetails();
			removeCaseLog();
			return;
		}
		var value = dataTable.getValue(row, 0);
		casesAction(value);
	}

	/* Paging settings. */
	function setupCasesPageSize() {
		// Call PersistModule
		PersistModule.getCasesPageSize(function(ok, val) {
			if (ok) {
				casesOptions['pageSize'] = parseInt(val);
				// $('.cases-paging select').find('*').removeAttr('selected');
				$('.cases-paging select option.' + val).attr('selected',
						'selected');
			}
		});
	}

	function buildCases() {
		setupCasesPageSize();
		casesOptions['selectClause'] = UrlModule.getCasesQuery();
		
		var labelNode = $('#number-of-cases-label').text(texts.numberofcasestoshow);
		var table = new google.visualization.Table(document
				.getElementById(casesNodeId));
		var query = new google.visualization.Query(UrlModule
				.getCasesDataSource());
		var tableQueryWrapper = new TableQueryWrapper(table, query, casesOptions,
				selectionHandler, formatViewAction);
		tableQueryWrapper.sendAndDraw();
	}

	function casesAction(selectedValue) {
		removeCaseDetails();
		removeCaseLog();
		var caseDetails = RequestModule.getCase(selectedValue);
		buildCase(caseDetails);

		addSubmittedForms(selectedValue);
		
		var logsTotal = setupCaseLogTotal(RequestModule.getCaseLogTotal(selectedValue));
		caseLogOptions['pageSize'] = 10;
		
		pagingAction = function (pageSize, pageIndex, callback) {
			var from = parseInt(pageSize)*(parseInt(pageIndex))+1;
			var to = from+parseInt(pageSize)-1;
			if (logsTotal){
				to = logsTotal<to ? logsTotal : to;
				$('#caselog-pagination-info').text(replacePlaceholdersInTranslatedString(texts.labelcaselogpaginationinfo, from, to, logsTotal));
			} else {
				$('#caselog-pagination-info').text('');
			}
		} 

		pagingAction(caseLogOptions['pageSize'], 0);
		
		formatViewAction = function(dataTable, dataView) {
			
			dataView.setColumns([0,
			                     1,
			                     {calc:cellFormatCreated, type:"string", label:texts.columnlabelcaselogcreated}]);
			
			function cellFormatCreated(dataTable, rowNum){
				return formatDate(utcStringToDate(dataTable.getValue(rowNum, 2)));
			}

			
			// Table Column Translations
			dataTable.setColumnLabel(0, texts.columnlabelcaselogmessage);
			dataTable.setColumnLabel(1, texts.columnlabelcaselogcreator);
			dataTable.setColumnLabel(2, texts.columnlabelcaselogcreated);
			
		};
		
		google.load('visualization', '1', {'callback' : buildCaseLog(selectedValue), 'packages' : ['table']});
	}
	
	function addSubmittedForms(caseIdentity) {
		var submittedForms = RequestModule.getSubmittedForms(caseIdentity);
		$.each(submittedForms.links, function(index, value) {
			var li = clone("submittedForm");
			li.find("#submittedformLink").attr("href", UrlModule.getSubmittedForms(caseIdentity) + "/" + value.href).append(value.form);
			$("#submittedforms-list").append(li);
		});
	}

	function buildCase(caseDetails) {
		if(getFieldType(caseDetails.index._type) == "OpenCaseDTO") {
			buildOpenCase(caseDetails);
		} else {
			buildClosedCase(caseDetails);
		}
	}
	
	function buildOpenCase(caseDetails) {
		caseNode = clone(caseNodeId);
		
		// Labels
		caseNode.find('#case-id-label').text(texts.labelcaseid);
		caseNode.find('#description-label').text(texts.labeldescription);
		caseNode.find('#created-label').text(texts.labelcreated);
		caseNode.find('#status-label').text(texts.labelstatus);
		caseNode.find('#project-label').text(texts.labelproject);
		caseNode.find('#form-link-label').text(texts.labelformlink);
		
		// Values
		caseNode.find('#case-id-value').text(caseDetails.index.caseId);
		if (caseDetails.index.description) {
			caseNode.find('#description-value').text(caseDetails.index.description);
		}
		
		caseNode.find('#created-value').text(formatDate(utcStringToDate(caseDetails.index.creationDate)));
		caseNode.find('#status-value').text(translateCaseStatus(caseDetails.index.status));
		caseNode.find('#project-value').text(caseDetails.index.project);
		
		$('#app').append(caseNode);
	}

	function buildClosedCase(caseDetails) {
		caseNode = clone(caseNodeId);
		
		// Labels
		caseNode.find('#case-id-label').text(texts.labelcaseid);
		caseNode.find('#description-label').text(texts.labeldescription);
		caseNode.find('#created-label').text(texts.labelcreated);
		caseNode.find('#closed-label').text(texts.labelclosed);
		caseNode.find('#resolution-label').text(texts.labelresolution);
		caseNode.find('#project-label').text(texts.labelproject);
		caseNode.find('#form-link-label').text(texts.labelformlink);
		
		// Values
		caseNode.find('#case-id-value').text(caseDetails.index.caseId);
		if (caseDetails.index.description) {
			caseNode.find('#description-value').text(caseDetails.index.description);
		}
		if (caseDetails.index.formlink) {
			caseNode.find('#form-link-value').text(caseDetails.index.formlink);
		}
		caseNode.find('#created-value').text(formatDate(utcStringToDate(caseDetails.index.creationDate)));
		caseNode.find('#closed-value').text(formatDate(utcStringToDate(caseDetails.index.closeDate)));
		caseNode.find('#project-value').text(caseDetails.index.project);
		if (caseDetails.index.resolution) {
			caseNode.find('#resolution-value').text(caseDetails.index.resolution);
		}
		
		$('#app').append(caseNode);
	}
	

	function buildCaseLog(caseIdentity) {
		$('#caselog-label').text(texts.labelcaselog);
		
		var caseLogSelectionHandler = function(row, dataTable) {
			return;
		}
		
		caseLogOptions['selectClause'] = UrlModule.getCaseLogQuery(caseIdentity);
		var tableDiv = document.getElementById('caselog-table')
		var table = new google.visualization.Table(tableDiv);
		var query = new google.visualization.Query(UrlModule
				.getCaseLogDataSource(caseIdentity));
		var tableQueryWrapper = new TableQueryWrapper(table, query, caseLogOptions,
				caseLogSelectionHandler, formatViewAction, pagingAction);
		tableQueryWrapper.sendAndDraw();
	}
	
	/* A temporary adapter function to convert from
	 * {assigned,Administrator} to {"name":"assigned", "user":"Administrator"}. */
	function convertMsgToJsonValue(value) {
		value = value.slice(1,value.lastIndexOf(0, '}'));
		var splitValue = value.split(',');
		var jsonValue = {};
		jsonValue.name = splitValue[0];
		jsonValue.value = splitValue[1];
		return jsonValue;
	}
	
	function removeCaseDetails() {
		caseNode = clone(caseNodeId);
		$('#' + caseNode.attr('id')).remove();
	}

	function removeCaseLog() {
		var caseLogNode = clone('caselog');
		$('#' + caseLogNode.attr('id')).remove();
	}

	function translateCaseStatus(value) {
		if(value && value == 'OPEN') {
			return texts.casestatusopen;
		} else if (value && value == 'PAUSED') {
			return texts.casestatuspaused;
		} else if (value && value == 'CLOSED') {
			return texts.casestatusclosed;
		} else return undefined;
	}
	
    function getFieldType( qualifiedField ) {
        var list = qualifiedField.split('.');
        return list[ list.length - 1 ];
    }
	
	function displayView(node) {
		$('#app').empty().append(node);
	}

	function addHeader(node, title) {
		var header = clone('cases-header');
		// header.find('#form_description').text( FormModule.title() );
		header.find('#cases-title').text(title);
		node.prepend(header);
	}

	function showMessages() {
		if (messages && messages.info) {
			$('#app').prepend(clone('InfoMessage').append(messages.info));
		}
		if (messages && messages.warning) {
			$('#app').prepend(clone('WarningMessage').append(messages.warning));
		}
		if (messages && messages.error) {
			$('#app').prepend(clone('ErrorMessage').append(messages.error));
		}
		messages = {};
	}

	function clone(id, newId) {
		if (!newId)
			return $('#' + id).clone().attr('id', 'inserted_' + id);
		return $('#' + id).clone().attr('id', newId);
	}

	function formatDate(value) {
		dateFormat.masks.sfTime = 'HH:MM';
		dateFormat.masks.sfYear = 'dd mmm';
		dateFormat.masks.sfPast = 'yyyy-mm-dd';

		if (Date.today().isBefore(value)) {
			return dateFormat(value, "sfTime");
		} else if (Date.today().moveToMonth(0, -1).moveToFirstDayOfMonth()
				.isBefore(value)) {
			return dateFormat(value, "sfYear");
		} else {
			return dateFormat(value, "sfPast");
		}
	}

	function utcStringToDate(value) {
		if (value == '')
			return value;

		var d = value
				.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(([+-])(\d{2}):(\d{2})))$/i);
		if (!d)
			return "Invalid date format";
		return new Date(Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5], d[6] | 0,
				(d[6] * 1000 - ((d[6] | 0) * 1000)) | 0, d[7])
				+ (d[7].toUpperCase() === "Z" ? 0 : (d[10] * 3600 + d[11] * 60)
						* (d[9] === "-" ? 1000 : -1000)));
	}

	function formatUTCStringToIsoString(value) {
		if (value == '')
			return value;

		var d = value
				.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(([+-])(\d{2}):(\d{2})))$/i);
		if (!d)
			return "Invalid date format";
		var dateValue = new Date(Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5],
				d[6] | 0, (d[6] * 1000 - ((d[6] | 0) * 1000)) | 0, d[7])
				+ (d[7].toUpperCase() === "Z" ? 0 : (d[10] * 3600 + d[11] * 60)
						* (d[9] === "-" ? 1000 : -1000)));
		return dateFormat(dateValue, "isoDate");
	}

	function formatUTCString(value, mask) {
		if (value == '')
			return value;

		var d = value
				.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(([+-])(\d{2}):(\d{2})))$/i);
		if (!d)
			return "Invalid date format";
		var dateValue = new Date(Date.UTC(d[1], d[2] - 1, d[3], d[4], d[5],
				d[6] | 0, (d[6] * 1000 - ((d[6] | 0) * 1000)) | 0, d[7])
				+ (d[7].toUpperCase() === "Z" ? 0 : (d[10] * 3600 + d[11] * 60)
						* (d[9] === "-" ? 1000 : -1000)));
		return dateFormat(dateValue, mask);
	}
	
	return inner;
}());
