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
    errorHandler = function(XMLHttpRequest, textStatus, errorThrown) { alert(errorThrown ); };
    var accesspoint = window.top.location.search.substring(1).split('=')[1];
	// if accesspoint is set go directly to login
	// otherwise list all accesspoints

	var contextUrl = "surface/accesspoints/";
	if ( accesspoint == null )
	{
	    $('#app').load('components.html #access_points_div', function () {
			$.ajax({
				url: contextUrl + 'index.json',
				success: function(data) {
					for (idx in data.links)
					{
					    var link = data.links[idx];
					    $('ul').append('<li><a href="?ap='+link.id+'">'+link.text+'</a></li>');
					}
				},
                error: errorHandler
			});
		});
	} else
	{
	    contextUrl += accesspoint + '/endusers/';
	    // load either login page or go to form edit view

        $.ajax({
            url: contextUrl + 'userreference.json',
            success: function(data) {
               contextUrl += data.entity + '/';
               setupFormUrl();
               loadFormEditDiv();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
               $('#app').load('components.html #login_div');
            }
        });
	};

    var directive = {
     'li':{
      'link<-links':{
       'a':'link.text',
       'a@accesskey':'link.id'
      }
     }
    };

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

    login = function() {
        $.ajax({
            url: contextUrl + 'selectenduser.json',
            async: false,
            type: 'POST',
            success: function(data, textStatus, XMLHttpRequest) {
                $.ajax({
                    url: contextUrl + 'userreference.json',
                    async: false,
                    success: function(data) {
                        contextUrl += data.entity + '/';
                    },
                    error: errorHandler
                });
            },
            error: errorHandler
        });
    };

    setupFormUrl = function() {
        contextUrl += 'forms/'
        $.ajax({
            url: contextUrl + 'index.json',
            async: false,
            success: function(data) {
                contextUrl += data.links[0].href;
            },
            error : errorHandler
        });
    };

    $('#login_enduser_operation').live('click', function() {
        login();
        setupFormUrl();
        loadFormEditDiv();
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
                case "se.streamsource.streamflow.domain.form.DateFieldValue":
                    $('#form_table_body').append('<tr><td><label for="'+id+'">'+name+'</label></td><td><input onChange="javascript:updateDate(id, this.value);" type="text" name="'+id+'" id="'+id+'" value="'+value+'"/></td></tr>');
                    $('#'+id).datepicker();
                    break;
                default:
                    $('#form_table_body').append('<tr><td>'+name+'</td><td><input type="text" onChange="javascript:fieldChanged(id);" onblur="javascript:updateField(id);" id="'+id+'" value="'+value+'"/></td></tr>');
            }
        }
    };

    updateDate = function(fieldId, dateValue) {
        var date = new Date(dateValue);
        updateFieldValue(fieldId, date.format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'"));
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

    $('#form_page_previous').live('click', function() {
        $.ajax({
            url: contextUrl + 'previouspage.json',
            type: 'POST',
            data: 'integer=0',
            success: function(data) {
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
                loadFormEditDiv();
            },
            error: errorHandler
        });
    });

    $('#form_page_discard').live('click', function() {
        // todo goto form summary and write "form discarded"
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
                $('#app').load("components.html #thank_you_div");               
            },
            error: function() {
                // todo show errors and stay on page
            }
        });
   });
})
