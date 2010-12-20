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
 * Methods handling inserting/updating form fields
 */
var missingFields = "";
var nameMap = {Possible:'Selected', Selected:'Possible'};

selectOpenSelectChanged = function(fieldName) {
    $('#openSelectionTextField'+fieldName).attr({value:'', disabled:true});
    FieldTypeModule.markDirty( fieldName );
    FieldTypeModule.updateServer( fieldName );
};

selectOpenSelectOption = function(fieldName) {
    var field = $('#openSelectionTextField'+fieldName).removeAttr("disabled");
    FieldTypeModule.markDirty( fieldName );
    setTimeout(function(){field.focus(); }, 10);
};

listBoxArrow = function(id, toBox) {
    var fromBox = nameMap[ toBox ] + id;
    $('#'+toBox+id).append( $('#'+fromBox+' > option:selected') );

    FieldTypeModule.markDirty( id );
    FieldTypeModule.updateServer( id );
}

/**
 * Module that handles the setup of all the field types
 */
var FieldTypeModule = (function() {
    var inner = {};
    var fieldMap = {};
    var resultHandler;
    var refresher;

    function update(id, value) {
        return resultHandler( View.updateField( id, value ) );
    }

    // internal function to display the field using the field template
    // and taking the fieldComponent.node as the input widget
    function displayField( fieldDefinition, node ) {
        var field = $('#FormField').clone().attr('id', 'Field'+fieldDefinition.id);
        
        field.find('div.fieldname > label').text( fieldDefinition.name );
        showHint( fieldDefinition, field );
        showMandatory( fieldDefinition.field, field );
        showToolTip( fieldDefinition, field );
        field.find('div.fieldvalue').append( fieldDefinition.node );

        node.append( field );
    }

    function getFieldType( qualifiedField ) {
        var list = qualifiedField.split('.');
        return list[ list.length - 1 ];
    }


    function showMandatory( fieldDefinition, node ) {
        if ( !fieldDefinition.field.mandatory )
        {
            node.find('#mandatory').hide();
        }
    }

    inner.displayReadOnlyField = function( field, target ) {
        var value = (field.value == null ? "" : field.value);
        var fieldType = getFieldType( field.field.fieldValue._type );
        if ( fieldType != "CommentFieldValue")
        {
            var row = $('#field_summary').clone();
            row.attr('id', field.field.fieldId );
            row.find('td.field_label').prepend( field.field.description );
            showMandatory( field, row );
            var valueCell = row.find('td.field_value');
            if (fieldType == "DateFieldValue") {
            	valueCell.append(formatUTCStringToIsoString(value));
            } else if (fieldType =='AttachmentFieldValue') {
                if ( !value ) {
                	valueCell.append( "" );
                } else {
                	valueCell.append( $.parseJSON( value ).name );
                }
            } else {
            	valueCell.append( value );
            }
            target.append( row );
        }
    }

    function showHint( fieldDefinition, field ) {
        if (fieldDefinition.field.field.fieldValue.hint){
            field.find('#hint').text(' (' + fieldDefinition.field.field.fieldValue.hint + ')')
        }
    }

    function showToolTip( fieldDefinition, widget ) {
        if ( fieldDefinition.field.field.note != "" && getFieldType( fieldDefinition.field.field.fieldValue._type ) != "CommentFieldValue")
        {
            widget.find('div.fieldname > img').show().aToolTip({ fixed: true, tipContent: fieldDefinition.field.field.note });
        }
    }

    function AttachmentFieldValue( field ) {
        field.node = $('#AttachmentFieldValue').clone();
        field.node.find('#Attachment').bind('change', function(){
        	FieldTypeModule.markDirty(field.id);
        	field.node.find("#uploadButton").attr('class', 'button small positive');
        	field.node.find("#uploadButton").find('img').removeAttr('style');
        });
        field.node.find('#Attachment').attr({id:field.id, name:field.id});
        var image = $('#document_up').clone();
        field.node.find("#uploadButton").append(image).append(texts.upload);
        field.node.find("#uploadButton").bind('click', function() {
        	FieldTypeModule.updateServer(field.id); 
        	return false;
        });

        field.updateServer = function() {
            $("#uploading")
            .ajaxStart(function(){
                $(this).show();
            })
            .ajaxComplete(function(){
                $(this).hide();
            });

            $("#uploadButton")
            .ajaxComplete(function(){
                $(this).attr('class', 'disabled small button');
                $(this).find('img').fadeTo(0, 0.4);
            });

            var attachmentDTO = {
                secureuri: false,
                fileElementId: field.id,
                dataType: 'json',
                fieldName: field.name,
                success: function() { field.setFieldValue( refresher( attachmentDTO.fileElementId ) ); }
            }

            RequestModule.attach( attachmentDTO );
            
        }

        field.setFieldValue = function(value) {
            if ( value ) {
                this.node.find('#attachmentLabel').text( $.parseJSON( value ).name );
            }
        }

    }

    function CheckboxesFieldValue( field ) {
        field.node = $('#FieldSet').clone().attr('id', 'FieldSet'+field.id);
        $.each( field.fieldValue.values, function( idx, selectionValue ) {
            var selectionId = 'CheckboxesFieldValue' + field.id + safeIdString(selectionValue);
            var element = $('#CheckboxesFieldValue').clone().attr({id: selectionId, name: field.id });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            field.node.append( $('<div />').append( element ).append( label ) );
        });

        field.setFieldValue = function(value) {
            $.each( value.split(', '), function(idx, selectionValue) {
                field.node.find('#CheckboxesFieldValue' + field.id + safeIdString(selectionValue)).attr('checked', 'checked');
            });
        }

        field.getFieldValue = function() {
            return $.map( $('#Field'+field.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        }
    }

    function ComboBoxFieldValue( field ) {
        field.node = $('#ComboBoxFieldValue').clone().attr({name: field.id, id: "ComboBox"+field.id});
        field.node.append( $('<option />') );
        $.each(field.fieldValue.values, function(idx, value ) {
            var selectionId = 'ComboBoxFieldValue' + field.id + safeIdString(value);
            field.node.append( $('<option />').attr({value: value, id: selectionId}).text(value) );
        });

        field.setFieldValue = function(value) {
            field.node.find('#ComboBoxFieldValue' + field.id + safeIdString(value)).attr('selected', 'selected');
        }

        field.getFieldValue = function() {
            return field.node.find('option:selected').text();
        }
    }

    function CommentFieldValue( field ) {
        field.node = $('#CommentFieldValue').clone().attr("id", "Comment"+field.id).append( '<pre>'+field.field.field.note+'</pre>' );

        field.name = "";
        field.setFieldValue = $.noop;
    }

    function DateFieldValue( field ) {
        field.node = $('#DateFieldValue').clone().attr({name:field.id, id: 'datefield'+field.id}).datepicker();
        field.userFormatter = formatUTCStringToIsoString;

        field.serverFormatter = function( value ) {
            return $.datepicker.parseDate('yy-mm-dd', value ).format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'");
        }
    }

    function formatUTCStringToIsoString( value ) {
        if (value == '') return value;

        var d = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|(([+-])(\d{2}):(\d{2})))$/i);
        if (!d) return "Invalid date format";
        var dateValue = new Date(
        Date.UTC(d[1],d[2]-1,d[3],d[4],d[5],d[6]|0,(d[6]*1000-((d[6]|0)*1000))|0,d[7]) +
        (d[7].toUpperCase() ==="Z" ? 0 : (d[10]*3600 + d[11]*60) * (d[9]==="-" ? 1000 : -1000)));
        return dateFormat(dateValue,"isoDate");
    }

    function ListBoxFieldValue( field ) {
        field.node = $('#ListBoxFieldValue').clone().attr({id:field.id});
        var possible = field.node.find('#possiblevalues').attr({id: 'Possible'+field.id});
        var selected = field.node.find('#selectedvalues').attr({id: 'Selected'+field.id});
        field.node.find('#move_left').attr({id: field.id, name: 'Possible'});
        field.node.find('#move_right').attr({id: field.id, name: 'Selected'});
        $.each( field.fieldValue.values, function( idx, selectionValue ){
            var optionNode = $('<option />').attr('id', 'ListBoxFieldValue'+field.id+safeIdString(selectionValue));
            optionNode.text( selectionValue );
            possible.append( optionNode );
        });


        field.setFieldValue = function( value ) {
            $.each( value.split(', '), function(idx, selectionValue) {
                selected.append( field.node.find('#ListBoxFieldValue' + field.id + safeIdString(selectionValue)) );
            });
        }

        field.getFieldValue = function() {
            return $.map ( field.node.find('#Selected'+field.id+' > option'), function( elm ) { return elm.text }).join(', ');
        }
    }

    function NumberFieldValue( field ) {
        field.node = $('#NumberFieldValue').clone().attr({id: 'numberField'+field.id, name:field.id});

        field.updateServer = function() {
            var textfield = $('#numberField'+field.id);
            var enteredValue = field.getFieldValue();

            var updated = update( field.id, enteredValue );
            var updatedValue = field.getFieldValue();
            if ( !updated || updatedValue != enteredValue )
            {
                field.setFieldValue( enteredValue );
                setTimeout(function(){field.node.focus(); field.node.select()}, 10);
                field.dirty = true;
                if ( field.fieldValue.integer ) {
                    alert( texts.invalidinteger );
                } else {
                    alert( texts.invalidfloat );
                }
            }
        }
    }

    function safeIdString( value ) {
        return value.replace(/\W/g, '');
    }

    function OptionButtonsFieldValue( field ) {
        field.node = $('#FieldSet').clone().attr('id', 'FieldSet'+field.id);
        $.each( field.fieldValue.values, function(idx, selectionValue) {
            var selectionId = 'OptionButtonsFieldValue' + field.id + safeIdString(selectionValue);
            var element = $('#OptionButtonsFieldValue').clone().attr({id: selectionId, name: field.id });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            field.node.append( $('<div />').append( element ).append( label ) );
        });

        field.setFieldValue = function(value) {
            field.node.find('#OptionButtonsFieldValue' + field.id + safeIdString(value) ).attr('checked', 'checked');
        }

        field.getFieldValue = function() {
            return $.map( $('#Field'+field.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        }
    }

    function OpenSelectionFieldValue( field ) {
        field.node = $('#FieldSet').clone().attr('id', 'FieldSet'+field.id);
        var selected = false;
        $.each( field.fieldValue.values, function(idx, selectionValue){
            var selectionId = 'OpenSelectionFieldValue' + field.id + safeIdString(selectionValue);
            var element = $('#OpenSelectionFieldValue').clone().attr({id: selectionId, name: field.id });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            field.node.append( $('<div />').append( element ).append( label ) );
        });

        var selectionId = 'openSelectionOption' + field.id;
        var option = $('#OpenSelectionOption').clone().attr({id: selectionId, name:field.id });
        var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(field.fieldValue.openSelectionName );

        var openSelectionInput = $('#OpenSelectionTextField').clone().attr({id: 'openSelectionTextField' + field.id , name: field.id });
        field.node.append( $('<div />').append( option ).append( label ).append('&nbsp;').append( openSelectionInput) );


        field.setFieldValue = function(value) {
            var selected = field.node.find('#OpenSelectionFieldValue' + field.id + safeIdString(value)).attr('checked', 'checked');
            if (selected.size()!=0) {
                field.node.find('#openSelectionTextField' + field.id).attr({disabled: true, value: ""});
            } else if ( value ) {
                field.node.find('#openSelectionOption' + field.id).attr('checked', 'checked');
                field.node.find('#openSelectionTextField' + field.id).attr("value", value);
            }
        }

        field.getFieldValue = function() {
            var fieldValue = $.map( $('#Field'+field.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
            if ( fieldValue == field.fieldValue.openSelectionName ) {
                fieldValue = $('#openSelectionTextField'+field.id).attr('value');
            }
            return fieldValue;
        }
    }

    function TextAreaFieldValue( field ) {
        var cols = field.fieldValue.cols;
        var rows = field.fieldValue.rows;
        field.node = $('#TextAreaFieldValue').clone().attr({
            id: field.id,
            cols: cols,
            rows: rows-1
        });
    }


    function TextFieldValue( field ) {
        field.node = $('#TextFieldValue').clone().attr({
            id: field.id,
            size: field.fieldValue.width
        });

        field.updateServer = function() {
            var value = field.getFieldValue();
            var updated = update(field.id, value );
            var newValue = field.getFieldValue();
            if ( !updated || newValue != value )
            {
                field.setFieldValue(value);
                setTimeout(function(){ field.node.focus(); field.node.select()}, 10);
                field.dirty = true;
                alert( texts.invalidformat );
            }
        }
    }

    function Field( field ) {
        this.field = field;
        this.id = field.field.field;
        this.fieldValue = field.field.fieldValue;
        this.name = field.field.description;
        this.dirty = false;
        this.fieldType = getFieldType( field.field.fieldValue._type );
        this.UI = eval( this.fieldType + '(this)');
    }

    Field.prototype.getFieldValue = function() {
    	var value = this.node.attr('value');
    	if (value)
    		return value;
    	else
    		return '';
    }

    Field.prototype.setFieldValue = function( value ) {
        if ( this.userFormatter ) {
            this.node.attr( 'value', this.userFormatter( value ) );
        } else {
            this.node.attr( 'value', value );
        }
    }

    Field.prototype.updateServer = function() {
        if ( this.serverFormatter ) {
            update( this.id, this.serverFormatter( this.getFieldValue() ) );
        } else {
            update( this.id, this.getFieldValue() );
        }
    }

    inner.render = function( field, node ) {
        var field = new Field( field );
        fieldMap[ field.id ] = field;
        displayField(field, node);
        field.setFieldValue( field.field.value == null ? "" : field.field.value );
    }

    inner.setFieldValue = function( fieldId, value ) {
        fieldMap[ fieldId ].setFieldValue( value );
    }

    inner.getFieldValue = function( fieldId ) {
        fieldMap[ fieldId ].getFieldValue();
    }

    inner.updateServer = function( fieldId ) {
        var field = fieldMap[ fieldId ];
        if ( field.dirty ) {
            field.updateServer();
            field.dirty = false;
        }
    }

    inner.markDirty = function( fieldId ) {
        fieldMap[ fieldId ].dirty = true;
    }

    inner.init = function( handler, fieldRefresher ) {
        resultHandler = handler;
        refresher = fieldRefresher;
    }

    return inner;
}());

