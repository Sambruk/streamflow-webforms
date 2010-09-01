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
    function errorHandler(XMLHttpRequest, textStatus, errorThrown) { alert('Error: '+ errorThrown + ', Status: '+textStatus +', Request: '+XMLHttpRequest); };


    /**
     * Functions that call StreamFlow
     */
    function try_login() {
        $.ajax({
            url: contextUrl + 'userreference.json',
            async: false,
            success: function(data) {
               proxyContextUrl += data.entity + '/';
               setupFormUrl();
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
                    var event = data.events[idx];
                    if ( event.name == "createdCase")
                    {
                        proxyContextUrl += $.parseJSON(event.parameters)['param1'];
                    } else if ( event.name == "changedFormSubmission" )
                    {
                        proxyContextUrl += '/formdrafts/' + event.entity + '/';
                        formSubmissionValue = $.parseJSON($.parseJSON(event.parameters)['param1']);
                        refreshPageComponents();
                    }
                }
            },
            error: errorHandler
        });
    };

    updateFieldValue = function(fieldId, fieldValue) {
        var image = $('#'+fieldId).find('.fieldwaiting > img');
        image.show();
        $.ajax({
            url: proxyContextUrl + 'updatefield.json',
            async: false,
            data: 'field='+fieldId+'&value='+fieldValue,
            type: 'PUT',
            success: function(data) {
                updateFormSubmissionValue( data );
                formFieldsChanged = {};
                var pages = formSubmissionValue['pages'];
                var page = pages[ formSubmissionValue['currentPage'] ];
                for ( idx in page.fields )
                {
                    updateComponent( page.fields[ idx ] );
                }
            }
        });
        image.hide();
    };

    function updatePage( command, page )
    {
        $.ajax({
            url: proxyContextUrl + command,
            type: 'PUT',
            data: 'integer='+page,
            error: errorHandler
        });
    }

    function submitAndSend()
    {
        $.ajax({
            url: proxyContextUrl + 'summary/submitandsend.json',
            type: 'POST',
            success: function( ) {
                var node = $('#thank_you_div').clone();
                node.find('#end_message').text("Form submitted. Thank you!");
                $('#app').empty().append( node );
            },
            error: function() {
                // todo show errors and stay on page
            }
        });
    }


    /**
     * Functions that manipulates the DOM
     */
    function updateFormSubmissionValue( data ) {
        for ( idx in data.events )
        {
            var event = data.events[ idx ];
            if ( event.name == "changedFormSubmission" )
            {
                formSubmissionValue = $.parseJSON($.parseJSON(event.parameters)['param1']);
            }
        }
    }

    // Based on the formSubmissionValue
    // the current page is updated
    function refreshPageComponents() {
        if ( formSubmissionValue != null )
        {
            formFieldsChanged = {};
            $('#app').empty().append( $('#form_filling_div').clone() );
            var currentPage = formSubmissionValue['currentPage'];
            var pages = formSubmissionValue['pages'];
            var page = pages[ currentPage ];
            insertPageOverview( pages, currentPage );
            insertRows( page.fields, 1 );
        }
    }

    function insertPageOverview( pages, currentPage )
    {
        var lastIdx = pages.length - 1;
        for ( idx in pages ) {
            var page = $('<li />').text(pages[idx].title );
            if ( currentPage == idx )
            {
                page.attr({"class": "selected"});
            }
            $('#form_pages').append( page );
            if ( idx < lastIdx )
            {
                $('#form_pages').append( $('<li />').text('>>') );
            }
        }
    }

    /**
     * Functions called by html components
     */
    updateDate = function(fieldId, dateValue) {
        var date = new Date(dateValue);
        updateFieldValue(fieldId, date.format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'"));
    };

    selectChanged = function(fieldId) {
        var fieldValue = $('#'+fieldId+ ' input:checked').map(function() {return $('#label'+this.id).text() }).get().join(', ');
        
        updateFieldValue(fieldId, fieldValue);
    };

    fieldChanged = function(fieldId) {
        formFieldsChanged[fieldId] = true;
    };

    updateField = function(fieldId) {
        if ( formFieldsChanged[fieldId] )
        {
            var value = $('#'+fieldId).find('input').attr('value');
            updateFieldValue(fieldId, value);
        }
    };

    updateTextAreaField = function(fieldId) {
        if ( formFieldsChanged[fieldId] )
        {
            var value = $('#'+fieldId).find('textarea').attr('value');
            updateFieldValue(fieldId, value);
        }
    }

    updateInteger = function(fieldId) {
        if ( formFieldsChanged[fieldId] )
        {
            var textfield = $('#numberField'+fieldId);
            var enteredValue = textfield.attr('value');
            updateFieldValue( fieldId, enteredValue );

            var updatedValue = textfield.attr('value');
            if ( updatedValue != enteredValue )
            {
                textfield.attr('value', enteredValue);
                alert('Invalid integer: '+enteredValue );
                textfield.focus();
                textfield.select();
            }
        }
    }

    updateDouble = function(fieldId) {
        if ( formFieldsChanged[fieldId] )
        {
            var textfield = $('#numberField'+fieldId);
            var enteredValue = textfield.attr('value');
            updateFieldValue( fieldId, enteredValue );

            var updatedValue = textfield.attr('value');
            if ( updatedValue != enteredValue )
            {
                textfield.attr('value', enteredValue);
                alert('Invalid real: '+enteredValue );
                textfield.focus();
                textfield.select();
            }
        }
    }

    selectItem = function( id, name, multiple ) {
        var key = name.substring(2);
        var toBox = 'box'+key;
        var fromBox = 'box'+(parseInt(key)-1);
        var elements = $('#'+fromBox+' > option:selected');
        var box = $('#'+toBox);

        box.append( elements );

        var newValue = $('#'+toBox+' > option').map( function() { return this.value }).get().join(', ');

        updateFieldValue( id, newValue );
    }

    deselectItem = function( id, name, multiple ) {
        var key = name.substring(2);
        var toBox = 'box' + key;
        var fromBox = 'box' + (parseInt(key)+1);
        var elements = $('#'+fromBox+' > option:selected');

        $('#'+toBox).append( elements );
        var newValue = $('#'+fromBox+' > option').map( function() { return this.value }).get().join(', ');

        updateFieldValue( id, newValue );
    }


    /**
     * Functions for updating form field components
     */
    function getFieldType( qualifiedField )
    {
        var list = qualifiedField.split('.');
        return list[ list.length - 1 ];
    }

    function updateComponent( field )
    {
        var id = field.field.field;
        var fieldType = getFieldType( field.field.fieldValue._type );
        var value = (field.value == null ? "" : field.value);
        switch ( fieldType )
        {
            case "CheckboxesFieldValue":
                var values = field.field.fieldValue.values;
                var currentValue = $('#'+id+ ' input:checked').map(function() {return $('#label'+this.id).text() }).get().join(', ');
                if ( currentValue != value )
                {
                    for (valueIdx in values)
                    {
                        var selectionValue = values[valueIdx];
                        var selectionId = fieldType + fieldCount + '' + valueIdx;
                        var node = $('#'+selectionId);
                        if  ( value.indexOf(selectionValue)>-1 )
                        {
                            node.attr('checked', 'checked');
                        } else
                        {
                            node.attr('checked', '');
                        }
                    };
                }
                break;
            case "ComboBoxFieldValue":
                // todo
                break;
            case "DateFieldValue":
                // todo
                break;
            case "ListBoxFieldValue":
                // todo
                break;
            case "NumberFieldValue":
                var numberField = $('#numberField'+id);
                var currentValue = numberField.attr('value');
                if ( value != currentValue )
                {
                    numberField.attr('value', value );
                }
                break;
            case "OptionButtonsFieldValue":
                // todo
                break;
            case "TextAreaFieldValue":
                // todo
                break;
            case "TextFieldValue":
                // todo
                break;
            default:
                //ignore
        }
    }

    function insertRows( fields, fieldCount) {
        if (fields.length == 0) return;
        var field = fields[0];
        var id = field.field.field;
        var name = field.field.description;
        var desc = field.field.note;
        var value = (field.value == null ? "" : field.value);
        var fieldType = getFieldType( field.field.fieldValue._type );
        $('#form_table_body').append( $('#FormField').clone().attr('id', id) );
        if ( desc != "" && fieldType != "CommentFieldValue")
        {
            $('#'+id).find('div.fieldname > img').aToolTip({
		    		clickIt: true,
		    		tipContent: desc
            });
            $('#'+id).find('div.fieldname > img').show();
        }
        $('#'+id).find('div.fieldname > label').text(name);
        if ( !field.field.mandatory )
        {
            $('#'+id).find('#mandatory').hide();                    
        }
        switch (fieldType) {
            case "CheckboxesFieldValue":
                var fieldSet = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
                var values = field.field.fieldValue.values;
                for (valueIdx in values)
                {
                    var selectionValue = values[valueIdx];
                    var selectionId = fieldType + fieldCount + '' + valueIdx;
                    var node = $('#'+fieldType).clone().attr({id: selectionId, name: id });
                    if  ( value.indexOf(selectionValue)>-1 )
                    {
                        node.attr('checked', 'checked');
                    }
                    var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
                    fieldSet.append( $('<div />').append( node ).append( label ) );
                    $('#'+id).find('#'+fieldType).append(node).append(label);
                };
                $('#'+id).find('div').filter('.fieldvalue').append( fieldSet );
                break;
            case "ComboBoxFieldValue":
                var comboBox = $('#'+fieldType).clone().attr({name: id, id: "ComboBox"+id});
                var values = field.field.fieldValue.values;
                comboBox.append( $('<option />') );
                for (valueIdx in values)
                {
                    var selectionValue = values[valueIdx];
                    var selectionId = fieldType + fieldCount + '' + valueIdx;
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
                var comment = $('#'+fieldType).clone();
                comment.append( '<pre>'+field.field.note+'</pre>' );
                $('#'+id).find('div').filter('.fieldvalue').append( comment );
                break;
            case "DateFieldValue":
                $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({value: value, name:id, id: 'datefield'+fieldCount}).datepicker() );
                break;
            case "ListBoxFieldValue":
                var listIndex = ((fieldCount+1)*2 +1);
                var listbox = $('#'+fieldType).clone().attr({id:id});
                var possible = listbox.find('#possiblevalues').attr({id: 'box'+listIndex });
                var selected = listbox.find('#selectedvalues').attr({id: 'box'+(listIndex+1)});

                var leftButton = listbox.find('#move_left').attr({id: id, name: 'to'+listIndex, onclick: 'javascript:deselectItem(id, name);' });
                var rightButton = listbox.find('#move_right').attr({id: id, name: 'to'+(listIndex+1), onclick: 'javascript:selectItem(id, name);' });

                var values = field.field.fieldValue.values;
                for ( valueIdx in values )
                {
                    var selectionValue = values[valueIdx];
                    var node = $('<option />').text(selectionValue);
                    if  ( value.indexOf(selectionValue)>-1 )
                    {
                        selected.append(node);
                    } else
                    {
                        possible.append( node );
                    }
                };
                $('#'+id).find('div').filter('.fieldvalue').append( listbox );
                break;
            case "NumberFieldValue":
                if ( field.field.fieldValue.integer )
                {
                    $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({id: 'numberField'+id, value:value, onblur:"javascript:updateInteger(name);", name:id}) );
                } else
                {
                    $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({id: 'numberField'+id, value:value, onblur:"javascript:updateDouble(name);return false;", name:id}) );
                }
                break;
            case "OptionButtonsFieldValue":
                var fieldSet = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
                var values = field.field.fieldValue.values;
                for (valueIdx in values)
                {
                    var selectionValue = values[valueIdx];
                    var selectionId = fieldType + fieldCount + '' + valueIdx;
                    var node = $('#'+fieldType).clone().attr({id: selectionId, name: id });
                    if  ( value.indexOf(selectionValue)>-1 )
                    {
                        node.attr('checked', 'checked');
                    }
                    var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
                    fieldSet.append( $('<div />').append( node ).append( label ) );
                    $('#'+id).find('#'+fieldType).append(node).append(label);
                };
                $('#'+id).find('div').filter('.fieldvalue').append( fieldSet );
                break;
            case "TextAreaFieldValue":
                var cols = field.field.fieldValue.cols;
                var rows = field.field.fieldValue.rows;
                $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({
                    id: id,
                    cols: cols,
                    rows: rows-1
                }).append(value) );
                break;
            case "TextFieldValue":
                var width = field.field.fieldValue.width;
                $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({
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

    function changeFormSubmissionPage( page )
    {
        var currentPage = formSubmissionValue['currentPage'];
        var pages = formSubmissionValue['pages'];
        var lastIndex = pages.length-1;
        if ( (page == currentPage) || (page < 0) || (page > lastIndex) ) return false;
        formSubmissionValue['currentPage'] = page;
        return true;
    }

    function changePage( command, page ) {
        if ( changeFormSubmissionPage( page ) )
        {
            updatePage( command, page );
            refreshPageComponents();
        }
    };

    function changePageAlwaysRefresh( command, page )
    {
        if ( changeFormSubmissionPage( page ) )
        {
            updatePage( command, page );
        }
        refreshPageComponents();
    }


    /**
     * Main
     */
    var accesspoint = window.top.location.search.split('=')[1];
	var proxyContextUrl = "surface/proxy/accesspoints/"
	var contextUrl = "surface/surface/accesspoints/";
    var missingFields = "";
	var formSubmissionValue;
    var formFieldsChanged = {};
	$('#app').empty();
	$('#components').hide().load('components.html', function() {
        if ( accesspoint == null || accesspoint.length < 1 )
        {
            $('#app').append('<font color="red">Error: No access point specified</font>');
        } else
        {
            contextUrl += accesspoint + '/endusers/';
            proxyContextUrl += accesspoint + '/endusers/';
            //try_login();
            login();
            setupFormUrl();
        };
	});

    /**
     * Listeners
     */
    $('#login_enduser_operation').live('click', function() {
        login();
        setupFormUrl();
    });

    $('#form_page_previous').live('click', function() { changePage('previouspage.json', parseInt(formSubmissionValue['currentPage'])-1) });

    $('#form_page_next').live('click', function() { changePage('nextpage.json', parseInt(formSubmissionValue['currentPage'])+1) });

    $('#goto_form_page').live('click', function() { changePageAlwaysRefresh('summary/gotopage.json', $(this).attr('accesskey')) });

    $('#form_page_discard').live('click', function() {
        // todo goto form summary and write "form discarded"
    });

    $('#form_summary').live('click', function() {
        missingFields = "";
        $('#app').empty().append( $('#form_summary_div').clone() );
        $('#form_description').text(formSubmissionValue.description);

        for (idx in formSubmissionValue.pages) {
            var pageDiv = $('#form_page_summary').clone().attr('id', 'page'+idx);
            var page = formSubmissionValue.pages[idx];
            var page_ref = $('#goto_form_page').clone().attr('accesskey', idx).text(page.title);
            pageDiv.find('h3').append( page_ref );
            for (field_idx in page.fields) {
                var field = page.fields[field_idx];
                var value = (field.value == null ? "" : field.value);
                var fieldType = getFieldType( field.field.fieldValue._type );
                if ( fieldType != "CommentFieldValue")
                {
                    var ul = pageDiv.find('ul');
                    var li = $('#field_summary').clone().attr('id', field.field );
                    li.find('b').text(field.field.description);
                    if ( !field.field.mandatory )
                    {
                        li.find('#mandatory').hide();
                    } else
                    {
                        if ( value == "" )
                        {
                            missingFields += "Missing value for field '"+field.field.description+"' <br>";
                        }
                    }
                    li.append( value );
                    ul.append( li );
                }
            }
            $('#form_pages_summary').append( pageDiv );
        }
        if ( missingFields != "" )
        {
            missingFields  += "<br> Cannot submit form";
            $('#form_submit').aToolTip({
                tipContent: missingFields
            });
        }
   });

   $('#form_submit').live('click', function() {
        if ( missingFields == "" )
        {
            submitAndSend();
        }
   });
})
