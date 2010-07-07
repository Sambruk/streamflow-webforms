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
    function errorHandler(XMLHttpRequest, textStatus, errorThrown) { alert(errorThrown ); };

    function try_login() {
        $.ajax({
            url: contextUrl + 'userreference.json',
            success: function(data) {
               proxyContextUrl += data.entity + '/';
               setupFormUrl();
               loadFormEditDiv();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
               $('#app').load('components.html #login_div');
            }
        });
    };

    function login() {
        $.ajax({
            url: contextUrl + 'selectenduser.json',
            async: false,
            type: 'POST',
            success: function(data, textStatus, XMLHttpRequest) {
                $.ajax({
                    url: contextUrl + 'userreference.json',
                    async: false,
                    success: function(data) {
                        proxyContextUrl += data.entity + '/';
                    },
                    error: errorHandler
                });
            },
            error: errorHandler
        });
    };

    function getParameter( event ) {
        ev = event.parameters.split( ':' )[1].substring(1);
        return ev.substring( 0, ev.length -2 );
    }

    function setupFormUrl() {
        $.ajax({
            url: proxyContextUrl + 'createcasewithform.json',
            async: false,
            type: 'POST',
            success: function(data) {
                // get case id and formsubmision id and contruct url
                for ( idx in data.events )
                {
                    event = data.events[idx];
                    if ( event.name == "createdCase")
                    {
                        ev = event.parameters.split( ':' )[1].substring(1);
                        proxyContextUrl += ev.substring( 0, ev.length -2 );
                    } else if ( event.name == "changedFormSubmission" )
                    {
                        proxyContextUrl += '/formdrafts/' + event.entity + '/';
                    }
                }
            },
            error: errorHandler
        });
    };

    function loadFormEditDiv() {
        form_fields_changed = {};
        $('#app').load('components.html #form_filling_div', function() {
            $.ajax({
                url: proxyContextUrl + 'index.json',
                success: function(data) {
                    $('#form_page').text(data.title);
                    appendTableRow(data.fields);
                }
            });
        });
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
            url: proxyContextUrl + 'updatefield.json',
            async: false,
            data: 'field='+fieldId+'&value='+fieldValue,
            type: 'POST'
        });
    };

    updateField = function(fieldId) {
        if ( form_fields_changed[fieldId] )
        {
            value = $('#'+fieldId).attr('value');
            $.ajax({
                url: proxyContextUrl + 'updatefield.json',
                async: false,
                data: 'field='+fieldId+'&value='+value,
                type: 'POST',
                success: function(data) {
                    // ignore for now, but should check for validation errors
                },
                error: errorHandler
            });
        }
    };

    function appendTableRow(fields) {
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
                        tableRow += '<input name="'+id+'" id="'+selectionValue+'" type="'+selectionType+'" onChange="javascript:selectChanged(name);" '+checked+'/><label for="'+selectionValue+'">'+selectionValue+'</label>';
                    }
                    $('#form_table_body').append(tableRow + '</fieldset></td></tr>');
                    // <td id="processing"><img src="images/Processing.gif"/></td>
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
                    // unknown type ignore
            }
        }
    };

    function changePage(command, page) {
        $.ajax({
            url: proxyContextUrl + command,
            type: 'POST',
            data: 'integer='+page,
            success: function(data) {
                loadFormEditDiv();
            },
            error: errorHandler
        });
    };

    var accesspoint = window.top.location.search.split('=')[1];
	// if accesspoint is set go directly to login
	// otherwise list all accesspoints
	var proxyContextUrl = "surface/proxy/accesspoints/"
	var contextUrl = "surface/surface/accesspoints/";
    var form_fields_changed = {};
	if ( accesspoint == null || accesspoint.length < 1 )
	{
        $('#app').empty();
        $('#app').append('<font color="red">Error: No access point specified</font>');
	} else
	{
	    contextUrl += accesspoint + '/endusers/';
	    proxyContextUrl += accesspoint + '/endusers/';
        try_login();
	};

    $('#login_enduser_operation').live('click', function() {
        login();
        setupFormUrl();
        loadFormEditDiv();
    });


    $('#form_page_previous').live('click', function() { changePage('previouspage.json',0) });

    $('#form_page_next').live('click', function() { changePage('nextpage.json',0) });

    $('#goto_form_page').live('click', function() { changePage('summary/gotopage.json', $(this).attr('accesskey')) });

    $('#form_page_discard').live('click', function() {
        // todo goto form summary and write "form discarded"
    });

    $('#form_summary').live('click', function() {
        $('#app').load('components.html #form_summary_div', function() {
            $.ajax({
                url: proxyContextUrl + 'summary/index.json',
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

   $('#form_submit').live('click', function() {
        $.ajax({
            url: proxyContextUrl + 'summary/submit.json',
            type: 'POST',
            success: function() {
                $('#app').load("components.html #thank_you_div", function(){
                    $('#end_message').text("Form submitted. Thank you!");
                });
            },
            error: function() {
                // todo show errors and stay on page
            }
        });
   });
})
