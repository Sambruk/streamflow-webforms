/**
 *
 * Copyright 2009 Streamsource AB
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


jQuery(document).ready(function()
{
	$('#app').load("components.html #start");

    $('#to_start').live('click', function() {
        $('#app').load("components.html #start");
    });


    var directive = {
     'li':{
      'link<-links':{
       'a':'link.text',
       'a@accesskey':'link.id'
      }
     }
    };

    var contextUrl = "surface/accesspoints/";
    var userInboxUrl;
    var caseUrl;
    var formEditUrl;
    errorHandler = function(XMLHttpRequest, textStatus, errorThrown) { alert(errorThrown ); };

    updateList = function(url, list_id, element_id) {

        $.ajax({
            url: url + 'index.json',
            success: function(data) {
                if (data.links.length == 0)
                {
                    $('ul#'+list_id ).hide();
                } else
                {
                    $('ul#'+list_id+' > li:gt(0)').remove();
                    $('ul#'+list_id ).show().render(data, directive );
                }
            },
            error: errorHandler
        });
    };

    toInbox = function(userInboxUrl) {
        contextUrl = userInboxUrl;
        $('#app').load('components.html #enduser_inbox_div', function() {
            updateList(contextUrl, 'case_list', 'case_element');
        });
    };


	$('#to_another_div').live('click', function() {
		$('#app').load('components.html #organizations_div', function () {

			$.ajax({
				url: contextUrl + 'index.json',
				success: function(data) {
					$('ul').render(data, directive );
				},
                error: errorHandler
			});
		});
	});


    $('#to_organization_div').live('click', function() {
        contextUrl += $(this).attr('accesskey') + '/';
        $('#app').load('components.html #organization_div', function() {
            $.ajax({
				url: contextUrl+'index.json',
				success: function(data) {
					$('#accesspoint_name').text( data.string );

                    contextUrl += 'endusers/';
					$.ajax( {
					    url: contextUrl + 'userreference.json',
                        success: function(data) {
                           contextUrl += data.entity + '/';
                           userInboxUrl = contextUrl;
                           $('#login_enduser').hide();
                           $('#to_enduser_inbox').show();
                        },
                        error: function(XMLHttpRequest, textStatus, errorThrown) {
                           $('#login_enduser').show();
                           $('#to_enduser_inbox').hide();
                        }
                    });

				},
                error: errorHandler 
			});
        });

    });

    $('#login_enduser_operation').live('click', function() {
        $('#app').load('components.html #enduser_inbox_div', function() {
            $.ajax({
                    url: contextUrl + 'selectenduser.json',
                    type: 'POST',
                    success: function(data, textStatus, XMLHttpRequest) {
                        $.ajax({
                            url: contextUrl + 'userreference.json',
                            success: function(data) {
                                contextUrl += data.entity + '/';
                                userInboxUrl = contextUrl;
                                updateList(contextUrl, 'case_list', 'case_element');
                            },
                            error: errorHandler
                        });
                    },
                    error: errorHandler
            });
        });
    });

    $('#to_viewenduser_div').live('click', function() {
        $('#app').load('components.html #enduser_inbox_div', function() {
            updateList(contextUrl, 'case_list', 'case_element');
        });
    });

    $('#create_case').live('click', function() {
        var caseName = $('#casename').attr('value');

        if ( caseName.length > 0)
        {
            $.ajax({
                url: contextUrl + 'createcase.json',
                data: 'string='+ caseName,
                type: 'POST',
                success: function() {
                    updateList(contextUrl, 'case_list', 'case_element');
                    $('#casename').removeAttr('value');
                },
                error: errorHandler
            });
        };
    });

    loadCaseView = function() {
        $('#app').load('components.html #case_div', function() {
            $.ajax({
                url: contextUrl + 'index.json',
                success: function(data) {
                    $('#case_description').text(data.description);
                }
            });
            //updateList(contextUrl + 'submittedforms/', 'submitted_forms_list' );
            $.ajax({
                url: contextUrl + 'submittedforms/index.json',
                success: function(data) {
                    if (data.forms.length == 0)
                    {
                        $('ul#submitted_forms_list').hide();
                    } else
                    {
                        $('li#submitted_form').remove();
                        for (idx in data.forms) {
                            form = data.forms[idx];
                            $('ul#submitted_forms_list').append('<li id="submitted_form">'+form.form+' submitted by '+form.submitter+' ('+form.submissionDate+')'+'</li>');
                        };
                        $('ul#submitted_forms_list').show();
                    }
                }
            });
            updateList(contextUrl + 'formdrafts/',     'form_drafts_list', 'form_draft');
            updateList(contextUrl + 'requiredforms/',  'required_forms_list', 'required_form');
        });
    };

    $('#to_case_div').live('click', function() {
        contextUrl += $(this).attr('accesskey') + '/';
        caseUrl = contextUrl;
        loadCaseView();
    });

    $('#back_to_index').live('click', function() {
        toInbox( userInboxUrl );
    });

    $('#send_case').live('click', function() {
        $.ajax({
            url: contextUrl + "sendtofunction.json",
            type: 'POST',
            success: function(data) {
                toInbox(userInboxUrl );
            },
            error: errorHandler
        });
    });

    $('#create_form_draft').live('click', function() {
        var entity = $(this).attr('accesskey');
        $.ajax({
            url: contextUrl + 'requiredforms/createformdraft.json',
            type: 'POST',
            data: 'entity=' + entity,
            success: function(data) {
                updateList(contextUrl + 'formdrafts/',     'form_drafts_list', 'form_draft');
            }
        });
    });

    var form_fields_changed = {};

    loadFormEditDiv = function() {
        form_fields_changed = {};
        $('#app').load('components.html #form_filling_div', function() {
            $.ajax({
                url: contextUrl + 'index.json',
                success: function(data) {
                    $('#form_page').text(data.title);
                    appendTableRow(data.fields);
                }
            });
        });
    };

    $('#edit_form_draft').live('click', function() {
        contextUrl += 'formdrafts/' + $(this).attr('accesskey') + '/';
        formEditUrl = contextUrl;
        loadFormEditDiv();
    });

    appendTableRow = function(fields) {
        for (idx in fields) {
            field = fields[idx];
            id = field.field.field;
            name = field.field.description;
            value = field.value;
            if (value == null) value = "";

            fieldType = field.field.fieldValue._type;
            switch (fieldType)
            {             
                case "se.streamsource.streamflow.domain.form.SelectionFieldValue":
                    selectionType = "";
                    if (field.field.fieldValue.multiple)
                    {
                        selectionType = "checkbox";
                    } else
                    {
                        selectionType = "radio";
                    }
                    values = field.field.fieldValue.values;
                    tableRow = '<tr><td>'+name+'</td><td><fieldset id="'+id+'">';
                    for (valueIdx in values)
                    {
                        var selectionValue = values[valueIdx];
                        var checked = "";
                        if (value.indexOf(selectionValue)>-1) checked = "checked";
                        tableRow += '<input name="'+id+'" id="'+selectionValue+'" type="'+selectionType+'" onChange="javascript:selectChanged(parent.id);" '+checked+'/><label for="'+selectionValue+'">'+selectionValue+'</label>';
                    }
                    $('#form_table_body').append(tableRow + '</fieldset></td></tr>');
                    break;
                case "se.streamsource.streamflow.domain.form.TextFieldValue":
                    var rows = field.field.fieldValue.rows;
                    var width = field.field.fieldValue.width;
                    if (rows == null) {
                        $('#form_table_body').append('<tr><td>'+name+'</td><td><input type="text" size="'+width+'" onChange="javascript:fieldChanged(id);" onblur="javascript:updateField(id);" id="'+id+'" value="'+value+'"/></td></tr>');
                    } else {
                        rows -= 1;
                        $('#form_table_body').append('<tr><td>'+name+'</td><td><textarea cols="'+width+'" rows="'+rows+'" type="text" onChange="javascript:fieldChanged(id);" onblur="javascript:updateField(id);" id="'+id+'">'+value+'</textarea></td></tr>');
                    }
                    break;
                default:
                    $('#form_table_body').append('<tr><td>'+name+'</td><td><input type="text" onChange="javascript:fieldChanged(id);" onblur="javascript:updateField(id);" id="'+id+'" value="'+value+'"/></td></tr>');
            }
        }
    };

    selectChanged = function(fieldId) {
        fieldValue = $('#'+fieldId+ ' input:checked').map(function() {return this.id}).get().join(', ');
        updateFieldValue(fieldId, fieldValue);
    };

    fieldChanged = function(fieldId) {
        form_fields_changed[fieldId] = true;
    };

    updateFieldValue = function(fieldId, fieldValue) {
        $.ajax({
            url: contextUrl + 'updatefield.json',
            data: 'field='+fieldId+'&value='+fieldValue,
            type: 'POST'
        });
    };

    updateField = function(fieldId) {
        if ( form_fields_changed[fieldId] )
        {
            value = $('#'+fieldId).attr('value');
            $.ajax({
                url: contextUrl + 'updatefield.json',
                data: 'field='+fieldId+'&value='+value,
                type: 'POST',
                success: function(data) {
                    // ignore for now, but should check for validation errors
                },
                error: errorHandler
            });
        }
    };

    $('#back_to_case_div').live('click', function() {
        contextUrl = caseUrl;
        loadCaseView();
    });

    $('#back_back_to_case_div').live('click', function() {
        contextUrl = caseUrl;
        loadCaseView();
    });

    $('#form_page_previous').live('click', function() {
        $.ajax({
            url: contextUrl + 'previouspage.json',
            type: 'POST',
            data: 'integer=0',
            success: function(data) {
                contextUrl = formEditUrl;
                loadFormEditDiv();
            },
            error: errorHandler
        });
    });

    $('#form_page_next').live('click', function() {
        $.ajax({
            url: contextUrl + 'nextpage.json',
            type: 'POST',
            data: 'integer=0',
            success: function(data) {
                contextUrl = formEditUrl;
                loadFormEditDiv();
            },
            error: errorHandler
        });
    });

    $('#form_page_discard').live('click', function() {
        // todo
    });

    $('#form_summary').live('click', function() {
        $('#app').load('components.html #form_summary_div', function() {
            $.ajax({
                url: contextUrl + 'summary/index.json',
                success: function(data) {
                    $('#form_description').text(data.description);

                    for (idx in data.pages) {
                        page = data.pages[idx];
                        $('#form_page_summary').append('<li><a href="#" id="goto_form_page" accesskey="'+idx+'">'+page.title+'</a></li>');
                        for (field_idx in page.fields) {
                            field = page.fields[field_idx];
                            $('#form_page_summary').append('<li><b>'+field.field.description+':</b> '+field.value+'</li>');
                        }
                    }
                },
                error: errorHandler
            });
        });
   });

   $('#goto_form_page').live('click', function() {
        page = $(this).attr('accesskey');
        $.ajax({
            url: contextUrl + 'summary/gotopage.json',
            data: "integer=" + page,
            type: 'POST',
            success: function(data) {
                contextUrl = formEditUrl;
                loadFormEditDiv();
            },
            error: errorHandler
        });
   });

   $('#form_submit').live('click', function() {
        $.ajax({
            url: contextUrl + 'summary/submit.json',
            type: 'POST',
            success: function() {
                contextUrl = caseUrl;
                loadCaseView();
            },
            error: function() {
                // todo show errors and stay on page
            }
        });
   });
})
