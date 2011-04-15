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

var View = (function() {
	var inner = {};
	var messages = {};
	var casesNodeId = {};
	var caseNodeId = {};
	var formatColumnsAction = {};
	var store = {};

	var casesPageSize = PersistModule.getCasesPageSize() ? PersistModule.getCasesPageSize() : 10;

	var casesCssClasses = {
		'headerRow' : 'ui-widget-header',
		'tableRow' : 'ui-widget-content',
		'selectedTableRow' : 'ui-state-active',
		'hoverTableRow' : 'ui-state-hover'
	};

	var casesOptions = {
		'showRowNumber' : true,
		'allowHtml' : true,
		'cssClassNames' : casesCssClasses,
		'pageSize' : casesPageSize,
		'hideColumns' : [ 0,3,4,5 ]
	};

	var caseHistoryCssClasses = {
		'headerRow' : 'ui-widget-header',
		'tableRow' : 'ui-widget-content'
//		'selectedTableRow' : 'ui-state-active',
//		'hoverTableRow' : 'ui-state-hover'
	};

	var caseHistoryOptions = {
		'showRowNumber' : true,
		'allowHtml' : true,
		'cssClassNames' : caseHistoryCssClasses, 
		'sortColumn': 2,
		'sortAscending': false,
		'hideColumns' : [ 0 ]
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
		removeCaseHistory();
	};

	inner.openCases = function() {
		var openCasesTotal = RequestModule.getOpenCasesTotal();
		if (openCasesTotal){
			$('#open-cases-header').text(texts.opencasesheader + ' (' + openCasesTotal.index.total + ')');
		} else {
			$('#open-cases-header').text(texts.opencasesheader);
		}
		caseNodeId = 'open-case';
		var node = clone('open-cases');
		displayView(node);
		casesNodeId = node.find('#open-cases-table').attr('id');
		formatColumnsAction = function(dataTable) {
			$.each(dataTable.D, function(index, value) {
				// Date formatting
				dataTable.setFormattedValue(index, 3,
						formatDate(utcStringToDate(value.c[3].v)));

				// Case status translation
				dataTable.setFormattedValue(index, 5, translateCaseStatus(value.c[5].v));
			});
			// Table Column Translations
			dataTable.setColumnLabel(0, texts.columnlabelhref);
			dataTable.setColumnLabel(1, texts.columnlabelcaseid);
			dataTable.setColumnLabel(2, texts.columnlabeldescription);
			dataTable.setColumnLabel(3, texts.columnlabelcreated);
			dataTable.setColumnLabel(4, texts.columnlabelproject);
			dataTable.setColumnLabel(5, texts.columnlabelstatus);
		};
		google.load('visualization', '1', {'callback' : buildCases, 'packages' : ['table']});
	};

	inner.closedCases = function() {
		var closedCasesTotal = RequestModule.getClosedCasesTotal();
		if (closedCasesTotal){
			$('#closed-cases-header').text(texts.closedcasesheader + ' (' + closedCasesTotal.index.total + ')');
		} else {
			$('#closed-cases-header').text(texts.closedcasesheader);
		}
		caseNodeId = 'closed-case';
		var node = clone('closed-cases');
		displayView(node);
		casesNodeId = node.find('#closed-cases-table').attr('id');
		formatColumnsAction = function(dataTable) {
			$.each(dataTable.D, function (index, value) {
				// Date formatting
				dataTable.setFormattedValue(index, 3,
						formatDate(utcStringToDate(value.c[3].v)));
				dataTable.setFormattedValue(index, 5,
						formatDate(utcStringToDate(value.c[5].v)));

				// Case status translation
				dataTable.setFormattedValue(index, 5, translateCaseStatus(value.c[5].v));
			});			

			// Table Column Translations
			dataTable.setColumnLabel(0, texts.columnlabelhref);
			dataTable.setColumnLabel(1, texts.columnlabelcaseid);
			dataTable.setColumnLabel(2, texts.columnlabeldescription);
			dataTable.setColumnLabel(3, texts.columnlabelcreated);
			dataTable.setColumnLabel(4, texts.columnlabelproject);
			dataTable.setColumnLabel(5, texts.columnlabelclosed);
			dataTable.setColumnLabel(6, texts.columnlabelresolution);
			
		};
		google.load('visualization', '1', {'callback' : buildCases, 'packages' : ['table']});
	};
	
	function selectionHandler(row, dataTable) {
		if (row === undefined) {
			removeCaseDetails();
			removeCaseHistory();
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
				casesOptions['pageSize'] = val;
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
				selectionHandler, formatColumnsAction);
		tableQueryWrapper.sendAndDraw();
	}

	function casesAction(selectedValue) {
		removeCaseDetails();
		removeCaseHistory();
		var caseDetails = RequestModule.getCase(selectedValue);
		buildCase(caseDetails);
		google.load('visualization', '1', {'packages' : ['table'], "callback": drawCaseHistoryTable(selectedValue)});
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
		if (caseDetails.index.formlink) {
			caseNode.find('#form-link-value').text(caseDetails.index.formlink);
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
	
	function drawCaseHistoryTable(caseIdentity) {
		$('#history-label').text(texts.labelcasehistory);
		var historyFormatColumnsAction = function(dataTable) {
			$.each(dataTable.D, function(index, value) {
				// Date formatting
				dataTable.setFormattedValue(index, 2,
						formatDate(utcStringToDate(value.c[2].v)));

				// Case status translation
				dataTable.setFormattedValue(index, 1, translateHistoryMessage(value.c[1].v));
			});
			// Table Column Translations
			dataTable.setColumnLabel(0, texts.columnlabelsender);
			dataTable.setColumnLabel(1, texts.columnlabelmessage);
			dataTable.setColumnLabel(2, texts.columnlabelcreated);
		};

		// Create the history data table.
		var caseHistory = RequestModule.getCaseHistory(caseIdentity);
		var data = new google.visualization.DataTable(caseHistory.table, '0.6');
		historyFormatColumnsAction(data);

		// Create a view.
		var view = new google.visualization.DataView(data);
		var table = new google.visualization.Table(document.getElementById('case-history-table'));
		table.draw(view, caseHistoryOptions);
	}
	
	function translateHistoryMessage(value) {
		// Value is a JSON value, for example {"name":"assigned", "user":"Administrator"}.
		if (!value) {
			return;
		}
		// Temporary call before correct format comes from server call.
		value = convertMsgToJsonValue(value);
		value.name = 'labelhistorymsg' + value.name;
		value.name = texts[value.name];
		if (value.name && value.value) {
			return value.name + ' ' + value.value;
		}
		else if (value.value) {
			return value.value;
		} else {
			return value.name;
		}
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

	function removeCaseHistory() {
		var caseHistoryNode = clone('case-history');
		$('#' + caseHistoryNode.attr('id')).remove();
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

	function redirect(view) {
		location.hash = view;
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

	inner.runView = function(view) {
		try {
			view();
			showMessages();
			$(window).scrollTop(0);
		} catch (e) {
			messages = {};
			if (e.info)
				messages.info = e.info;
			else if (e.warning)
				messages.warning = e.warning;
			else if (e.error)
				messages.error = e.error;
			else if (e.message)
				messages.error = e.message + ', ' + e.fileName + '('
						+ e.lineNumber + ')';

			if (e.redirect) {
				redirect(e.redirect);
			} else {
				redirect(getSummary());
			}
		}
	};

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
	
	/* Persistent Storage handling */

	return inner;
}());
