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
            async: false,
            success: function(data) {
               proxyContextUrl += data.entity + '/';
               setupFormUrl();
               loadFormEditDiv();
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
               $('#app').empty().append( $('#login_div').clone() );
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
        $('#app').empty().append( $('#form_filling_div').clone() );
        $.ajax({
            url: proxyContextUrl + 'index.json',
            success: function(data) {
                $('#form_page').text(data.title);
                insertRows( data.fields, 1 );
            }
        });
    };

    updateDate = function(fieldId, dateValue) {
        var date = new Date(dateValue);
        updateFieldValue(fieldId, date.format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'"));
    };

    selectChanged = function(fieldId) {
        fieldValue = $('#'+fieldId+ ' input:checked').map(function() {return $('#label'+this.id).text() }).get().join(', ');
        
        updateFieldValue(fieldId, fieldValue);
    };

    updateComboSelect = function(fieldId) {
        alert(fieldId);
    };

    fieldChanged = function(fieldId) {
        form_fields_changed[fieldId] = true;
    };

    updateFieldValue = function(fieldId, fieldValue) {
        var image = $('#'+fieldId).find('img');
        image.show();
        $.ajax({
            url: proxyContextUrl + 'updatefield.json',
            async: false,
            data: 'field='+fieldId+'&value='+fieldValue,
            type: 'POST'
        });
        image.hide();
    };

    updateField = function(fieldId) {
        if ( form_fields_changed[fieldId] )
        {
            value = $('#'+fieldId).find('input').attr('value');
            updateFieldValue(fieldId, value);
        }
    };

    updateTextAreaField = function(fieldId) {
        if ( form_fields_changed[fieldId] )
        {
            value = $('#'+fieldId).find('textarea').attr('value');
            updateFieldValue(fieldId, value);
        }
    }

    function insertRows( fields, fieldCount) {
        if (fields.length == 0) return;
        var field = fields[0];
        var id = field.field.field;
        var name = field.field.description;
        var value = (field.value == null ? "" : field.value);
        var fieldType = field.field.fieldValue._type;
        var list = fieldType.split('.');
        var field_type = list[ list.length - 1 ];
        $('#form_table_body').append( $('#FormField').clone().attr('id', id) );
        $('#'+id).find('div').filter('.fieldname').text(name);
        $('#'+id).find('img').hide();
        switch (field_type) {
            case "CheckboxesFieldValue":
                var fieldSet = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
                var values = field.field.fieldValue.values;
                for (valueIdx in values)
                {
                    var selectionValue = values[valueIdx];
                    var selectionId = field_type + fieldCount + '' + valueIdx;
                    var node = $('#'+field_type).clone().attr({id: selectionId, name: id });
                    if  ( value.indexOf(selectionValue)>-1 )
                    {
                        node.attr('checked', 'checked');
                    }
                    var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
                    fieldSet.append( node ).append( label );
                    $('#'+id).find('#'+field_type).append(node).append(label);
                };
                $('#'+id).find('div').filter('.fieldvalue').append( fieldSet );
                break;
            case "ComboBoxFieldValue":
                var comboBox = $('#'+field_type).clone().attr({name: id, id: "ComboBox"+id});
                var values = field.field.fieldValue.values;
                comboBox.append( $('<option />') );
                for (valueIdx in values)
                {
                    var selectionValue = values[valueIdx];
                    var selectionId = field_type + fieldCount + '' + valueIdx;
                    var node = $('<option />').attr({value: selectionValue}).text(selectionValue);
                    if  ( value.indexOf(selectionValue)>-1 )
                    {
                        node.attr('selected', 'selected');
                    }
                    comboBox.append( node );
                };
                $('#'+id).find('div').filter('.fieldvalue').append( comboBox );
                break;
            case "CommentFieldValue":
                var comment = $('#'+field_type).clone();
                comment.append( '<pre>'+field.field.note+'</pre>' );
                $('#'+id).find('div').filter('.fieldvalue').append( comment );
                break;
            case "DateFieldValue":
                $('#'+id).find('div').filter('.fieldvalue').append( $('#'+field_type).clone().attr({value: value, name:id, id: 'datefield'+fieldCount}).datepicker() );
                break;
            case "ListBoxFieldValue":
                $('#'+id).find('div').filter('.fieldvalue').append( 'type <i>'+field_type+'</i> not implemented yet');
                break;
            case "NumberFieldValue":
                $('#'+id).find('div').filter('.fieldvalue').append( 'type <i>'+field_type+'</i> not implemented yet');
                break;
            case "OptionButtonsFieldValue":
                var fieldSet = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
                var values = field.field.fieldValue.values;
                for (valueIdx in values)
                {
                    var selectionValue = values[valueIdx];
                    var selectionId = field_type + fieldCount + '' + valueIdx;
                    var node = $('#'+field_type).clone().attr({id: selectionId, name: id });
                    if  ( value.indexOf(selectionValue)>-1 )
                    {
                        node.attr('checked', 'checked');
                    }
                    var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
                    fieldSet.append( node ).append( label );
                    $('#'+id).find('#'+field_type).append(node).append(label);
                };
                $('#'+id).find('div').filter('.fieldvalue').append( fieldSet );
                break;
            case "TextAreaFieldValue":
                var cols = field.field.fieldValue.cols;
                var rows = field.field.fieldValue.rows;
                $('#'+id).find('div').filter('.fieldvalue').append( $('#'+field_type).clone().attr({
                    id: id,
                    cols: cols,
                    rows: rows-1
                }).append(value) );
                break;
            case "TextFieldValue":
                var width = field.field.fieldValue.width;
                $('#'+id).find('div').filter('.fieldvalue').append( $('#'+field_type).clone().attr({
                    id: id,
                    size: width,
                    value: value
                }) );
                break;
            default:
                // ignore
            };
        insertRows( fields.slice(1), fieldCount+1 );
    }

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
	$('#app').empty();
	$('#components').hide().load('components.html', function() {
        if ( accesspoint == null || accesspoint.length < 1 )
        {
            $('#app').append('<font color="red">Error: No access point specified</font>');
        } else
        {
            contextUrl += accesspoint + '/endusers/';
            proxyContextUrl += accesspoint + '/endusers/';
            try_login();
        };
	});

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
        $('#app').empty().append( $('#form_summary_div').clone() );
        $.ajax({
            url: proxyContextUrl + 'summary/index.json',
            success: function(data) {
                $('#form_description').text(data.description);

                for (idx in data.pages) {
                    page = data.pages[idx];
                    var page_ref = $('#goto_form_page').clone().attr('accesskey', idx).text(page.title);
                    $('#form_page_summary').append( page_ref );
                    for (field_idx in page.fields) {
                        field = page.fields[field_idx];
                        $('#form_page_summary').append('<li><b>'+field.field.description+':</b> '+field.value+'</li>');
                    }
                }
            },
            error: errorHandler
        });
   });

   $('#form_submit').live('click', function() {
        $.ajax({
            url: proxyContextUrl + 'summary/submitandsend.json',
            type: 'POST',
            success: function() {
                var node = $('#thank_you_div').clone();
                node.find('#end_message').text("Form submitted. Thank you!");
                $('#app').empty().append( node );
            },
            error: function() {
                // todo show errors and stay on page
            }
        });
   });
})
