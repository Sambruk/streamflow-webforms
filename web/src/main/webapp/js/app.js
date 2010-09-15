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
                if ( !queryCaseForm() )
                {
                    createCaseWithForm();           
                }
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
                    cache: false,
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

    function queryCaseForm() {
        var result = false;
        $.ajax({
            url: proxyContextUrl + 'findcasewithform.json',
            async: false,
            cache: false,
            type: 'GET',
            success: function(data) {
                if ( data.caze != null && data.caze != "" && data.form != null && data.form != "" )
                {
                    proxyContextUrl += data.caze + '/formdrafts/' + data.form + '/';
                    $.ajax({
                        url: proxyContextUrl + 'index.json',
                        async: false,
                        cache: false,
                        type: 'GET',
                        success: function( data ) {
                            formSubmissionValue = data;
                            refreshPageComponents();
                            result = true;
                        }
                    });
                }
            },
            error: errorHandler
        });
        return result;
    }


    function createCaseWithForm() {
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
        var image = $('#'+fieldId+' .fieldwaiting > img');
        image.show();              
        var fieldDTO = {
            field: fieldId,
            value: fieldValue
        };
        $.ajax({
            url: proxyContextUrl + 'updatefield.json',
            async: false,
            data: fieldDTO,
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
            } // todo add error handling!
        });
        image.hide();
    };

    function updatePage( command, page )
    {
        var integerDTO = {
            "integer": page
        };
        $.ajax({
            url: proxyContextUrl + command,
            type: 'PUT',
            data: integerDTO,
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
                node.find('#end_message').text(texts.formSubmittedThankYou);
                $('#app').empty().append( node );
            },
            error: function() {
                // todo show errors and stay on page
            }
        });
    }

    function discard()
    {
        $.ajax({
            url: proxyContextUrl + 'discard.json',
            type: 'POST',
            success: function() {
                var node = $('#thank_you_div').clone();
                node.find('#end_message').text( texts.formdiscarded );
                $('#app').empty().append( node );
            },
            error: errorHandler
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
            var formFillingDiv = $('#form_filling_div').clone().attr({'id':'inserted_form_filling_div'});
            formFillingDiv.find('#form_description').text(formSubmissionValue.description);
            $('#app').empty().append( formFillingDiv );

            var currentPage = formSubmissionValue['currentPage'];
            var pages = formSubmissionValue['pages'];
            var page = pages[ currentPage ];

            if (currentPage == 0)
            {
                $('#form_page_previous_disabled').clone().appendTo('#form_buttons_div');
            } else {
                $('#form_page_previous').clone().appendTo('#form_buttons_div');
            }
            if (currentPage == pages.length -1)
            {
                $('#form_page_next_disabled').clone().appendTo('#form_buttons_div');
            } else {
                $('#form_page_next').clone().appendTo('#form_buttons_div');
            }
            $('#form_page_discard').clone().appendTo('#form_buttons_div');
            $('#form_summary').clone().appendTo('#form_buttons_div');

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
        var date = $.datepicker.parseDate('yy-mm-dd', dateValue );
        updateFieldValue(fieldId, date.format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'"));
    };

    selectChanged = function(fieldId) {
        var fieldValue = $.map( $('#'+fieldId+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        
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
                setTimeout(function(){textfield.focus(); textfield.select()}, 10);
                fieldChanged(fieldId);
                alert( texts.invalidinteger );
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
                setTimeout(function(){textfield.focus(); textfield.select()}, 10);
                fieldChanged(fieldId);
                alert( texts.invalidfloat );
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

        var newValue = $.map( $('#'+toBox+' > option'), function( elm ) { return elm.text } ).join(', ');

        updateFieldValue( id, newValue );
    }

    deselectItem = function( id, name, multiple ) {
        var key = name.substring(2);
        var toBox = 'box' + key;
        var fromBox = 'box' + (parseInt(key)+1);
        var elements = $('#'+fromBox+' > option:selected');

        $('#'+toBox).append( elements );
        var newValue = $.map ( $('#'+fromBox+' > option'), function( elm ) { return elm.text }).join(', ');

        updateFieldValue( id, newValue );
    }

    formatUTCStringToIsoString = function( value){
      if (value == '')
      {
        return value;
      } else {
        var d = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(([+-])(\d{2}):(\d{2})))$/i);
        if (!d) return "Invalid date format";
        var dateValue = new Date(
          Date.UTC(d[1],d[2]-1,d[3],d[4],d[5],d[6]|0,(d[6]*1000-((d[6]|0)*1000))|0,d[7]) +
          (d[7].toUpperCase() ==="Z" ? 0 : (d[10]*3600 + d[11]*60) * (d[9]==="-" ? 1000 : -1000)));
        return dateFormat(dateValue,"isoDate");
      }
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
                var currentValue = $.map( $('#'+id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
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
		    		fixed: true,
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
                $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({value: formatUTCStringToIsoString(value), name:id, id: 'datefield'+fieldCount}).datepicker() );
                break;
            case "ListBoxFieldValue":
                var listIndex = ((fieldCount+1)*2 +1);
                var listbox = $('#'+fieldType).clone().attr({id:id});
                var possible = listbox.find('#possiblevalues').attr({id: 'box'+listIndex });
                var selected = listbox.find('#selectedvalues').attr({id: 'box'+(listIndex+1)});

                var leftButton = listbox.find('#move_left').attr({id: id, name: 'to'+listIndex});
                var rightButton = listbox.find('#move_right').attr({id: id, name: 'to'+(listIndex+1)});

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
                    //$('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({id: 'numberField'+id, value:value, "onblur":"javascript:updateInteger(name);", name:id}) );
                    $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType+'Integer').clone().attr({id: 'numberField'+id, value:value, name:id}) );
                } else
                {
                    //$('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({id: 'numberField'+id, value:value, "onblur":"javascript:updateDouble(name);", name:id}) );
                    $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType+'Double').clone().attr({id: 'numberField'+id, value:value, name:id}) );
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

    function translate( )
    {
        $('*', 'body')
            .andSelf()
            .contents()
            .filter(function(){
                return this.nodeType === 3;
            })
            .filter(function(){
                // Only match when contains '$' anywhere in the text
                return this.nodeValue.indexOf( '$' ) != -1;
            })
            .each(function(){
                var words = this.nodeValue.split(' ');
                for ( idx in words )
                {
                    var word = words[ idx ];
                    if ( word.length > 0 && word.charAt(0)=='$' )
                    {
                        words[ idx ] = texts[ $.trim( word.substring(1) ) ];
                    }
                }
                this.nodeValue = words.join(' ');
            });
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
        translate( );
        if ( accesspoint == null || accesspoint.length < 1 )
        {
            $('#app').append('<font color="red">Error: No access point specified</font>');
        } else
        {
            contextUrl += accesspoint + '/endusers/';
            proxyContextUrl += accesspoint + '/endusers/';
            //try_login();
            login();
            if ( !queryCaseForm() )
            {
                createCaseWithForm();
            }
        };
	});

    /**
     * Listeners
     */
    $('#login_enduser_operation').live('click', function() {
        login();
        if ( !queryCaseForm() )
        {
            createCaseWithForm();
        }
    });

    $('#form_page_previous').live('click', function() { changePage('previouspage.json', parseInt(formSubmissionValue['currentPage'])-1) });

    $('#form_page_next').live('click', function() { changePage('nextpage.json', parseInt(formSubmissionValue['currentPage'])+1) });

    $('#goto_form_page').live('click', function() { changePageAlwaysRefresh('summary/gotopage.json', $(this).attr('accesskey')) });

    $('#form_page_discard').live('click', function() {
        discard();
    });

    $('#form_summary').live('click', function() {
        missingFields = "";
        var summaryDiv = $('#form_summary_div').clone().attr({'id':'inserted_form_summary_div'});
        summaryDiv.find('#form_description').text(formSubmissionValue.description);
        $('#app').empty().append( summaryDiv );

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
                            missingFields += texts.missingfield + " '"+field.field.description+"' <br>";
                        }
                    }
                    if (fieldType == "DateFieldValue")
                    {
                        li.append(formatUTCStringToIsoString(value));
                    } else
                    {
                        li.append( value );
                    }
                    ul.append( li );
                }
            }
            $('#form_pages_summary').append( pageDiv );
        }
        if ( missingFields != "" )
        {
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
