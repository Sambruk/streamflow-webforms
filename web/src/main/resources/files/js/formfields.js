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

var nameMap = {Possible:'Selected', Selected:'Possible'};

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
    // and taking the fieldDefinition.node as the input widget
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

    function safeIdString( value ) {
        return value.replace(/\W/g, '');
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

    function listBoxArrow(id, toBox) {
        var fromBox = nameMap[ toBox ] + id;
        $('#'+toBox+id).append( $('#'+fromBox+' > option:selected') );
    }

    function clone( id, newId ) {
        return $('#'+id).clone().attr('id', newId );
    }

    /** All field type functions **/

    function AttachmentFieldValue( field ) {
        field.node.find('#Attachment').change( function() { button.enable(true); } ).
        attr({id:'Attachment'+field.id, name: field.id });

        var button = new View.Button( field.node ).small().image('document_up').name( texts.upload )
        .enable( false ).click( function() {
            $('#Field'+field.id+' .fieldwaiting > img')
            .ajaxStart( function(){ $(this).show(); })
            .ajaxComplete(function(){ $(this).hide(); });

            var attachmentDTO = {
                secureuri: false,
                fileElementId: 'Attachment'+field.id,
                dataType: 'json',
                fieldName: field.name,
                success: function() { field.setFieldValue( refresher( field.id ) ); button.enable( false ); }
            }

            RequestModule.attach( attachmentDTO );
        	return false;
        });

        field.setFieldValue = function(value) {
            if ( value ) {
                this.node.find('#attachmentLabel').text( $.parseJSON( value ).name );
            }
        }
    }

    function CheckboxesFieldValue( field ) {
        $.each( field.fieldValue.values, function( idx, value ) {
            var selectionId = field.id + safeIdString( value );
            var element = clone('checkbox', selectionId).click( function() { field.forceUpdate(); });
            var label = clone('label', 'label'+selectionId).attr('for', selectionId).text( value );
            field.node.append( $('<div />').append( element ).append( label ) );
        });

        field.setFieldValue = function(value) {
            $.each( value.split(', '), function(idx, selectionValue) {
                field.node.find('#' + field.id + safeIdString(selectionValue)).attr('checked', 'checked');
            });
        }

        field.getFieldValue = function() {
            return $.map( $('#Field'+field.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        }
    }

    function ComboBoxFieldValue( field ) {
        field.node.append( $('<option />') );
        $.each(field.fieldValue.values, function(idx, value ) {
            var selectionId = field.id + safeIdString(value);
            field.node.append( $('<option />').attr({value: value, id: selectionId}).text(value) );
        });
        field.node.change( function() { field.forceUpdate(); });

        field.setFieldValue = function(value) {
            field.node.find('#' + field.id + safeIdString(value)).attr('selected', 'selected');
        }

        field.getFieldValue = function() {
            return field.node.find('option:selected').text();
        }
    }

    function CommentFieldValue( field ) {
        field.node.append( '<pre>'+field.field.field.note+'</pre>' );
        field.name = "";
        field.setFieldValue = $.noop;
    }

    function DateFieldValue( field ) {
        field.node.change( function() { field.forceUpdate(); } );
        field.node.datepicker();
        field.userFormatter = formatUTCStringToIsoString;

        field.serverFormatter = function( value ) {
            return $.datepicker.parseDate('yy-mm-dd', value ).format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'");
        }
    }

    function ListBoxFieldValue( field ) {
        var possible = field.node.find('#possiblevalues').attr({id: 'Possible'+field.id});
        var selected = field.node.find('#selectedvalues').attr({id: 'Selected'+field.id});
        var buttons = field.node.find('#listboxbuttons');
        new View.Button( buttons ).image('next').click( function() {
            listBoxArrow( field.id, 'Selected' );
            field.forceUpdate();
            return false;
        });
        buttons.append( $('<br />') );
        new View.Button( buttons ).image('previous').click( function() {
            listBoxArrow( field.id, 'Possible' );
            field.forceUpdate();
            return false;
        });

        $.each( field.fieldValue.values, function( idx, value ){
            var optionNode = $('<option />').attr('id', field.id+safeIdString(value)).text( value );
            possible.append( optionNode );
        });


        field.setFieldValue = function( value ) {
            if ( !value ) return;
            $.each( value.split(', '), function(idx, selectionValue) {
                selected.append( field.node.find('#' + field.id + safeIdString(selectionValue)) );
            });
        }

        field.getFieldValue = function() {
            return $.map ( field.node.find('#Selected'+field.id+' > option'), function( elm ) { return elm.text }).join(', ');
        }
    }


    function NumberFieldValue( field ) {
        field.node.change( function() { field.dirty = true; } );
        field.node.blur( function() {
            if ( !field.dirty ) return;
            var textfield = $('#'+field.id);
            var enteredValue = field.getFieldValue();

            var updated = update( field.id, enteredValue );
            var updatedValue = field.getFieldValue();
            if ( field.dirty = (!updated || updatedValue != enteredValue) ) {
                field.setFieldValue( enteredValue );
                setTimeout(function(){field.node.focus(); field.node.select()}, 10);
                if ( field.fieldValue.integer ) {
                    alert( texts.invalidinteger );
                } else {
                    alert( texts.invalidfloat );
                }
            }
        });
    }

    function OptionButtonsFieldValue( field ) {
        $.each( field.fieldValue.values, function(idx, value) {
            var id = field.id + safeIdString(value);
            var element = clone('radio', id ).attr('name',field.id).click( function() { field.forceUpdate(); });
            var label = clone('label', 'label'+id).attr('for', id ).text(value);
            field.node.append( $('<div />').append( element ).append( label ) );
        });

        field.setFieldValue = function(value) {
            field.node.find('#' + field.id + safeIdString(value) ).attr('checked', 'checked');
        }

        field.getFieldValue = function() {
            return $.map( $('#Field'+field.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        }
    }

    function OpenSelectionFieldValue( field ) {
        $.each( field.fieldValue.values, function(idx, value){
            var id = field.id + safeIdString(value);
            var element = clone('radio', id ).attr('name',field.id)
            .click( function(){ textfield.attr({value:'', disabled:true}); field.forceUpdate(); })
            var label = clone('label', 'label'+id).attr('for', id).text(value);
            field.node.append( $('<div />').append( element ).append( label ) );
        });

        var id = 'openSelectionOption' + field.id;
        var option = clone('radio', id).attr('name', field.id)
        .click( function( ) { textfield.removeAttr('disabled'); field.forceUpdate(); });
        var label = clone('label', 'label'+id).attr('for', id).text(field.fieldValue.openSelectionName );

        var textfield = clone('OpenSelectionTextField', 'TextField' + field.id );
        textfield.change( function() { field.dirty = true; } );
        textfield.blur( function() { field.updateServer(); } );
        field.node.append( $('<div />').append( option ).append( label ).append('&nbsp;').append( textfield) );


        field.setFieldValue = function(value) {
            var selected = field.node.find('#' + field.id + safeIdString(value)).attr('checked', 'checked');
            if (selected.size()!=0) {
                field.node.find('#TextField' + field.id).attr({disabled: true, value: ""});
            } else if ( value ) {
                field.node.find('#openSelectionOption' + field.id).attr('checked', 'checked');
                field.node.find('#TextField' + field.id).attr("value", value);
            }
        }

        field.getFieldValue = function() {
            var fieldValue = $.map( $('#Field'+field.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
            if ( fieldValue == field.fieldValue.openSelectionName ) {
                fieldValue = $('#TextField'+field.id).attr('value');
            }
            return fieldValue;
        }
    }

    function TextAreaFieldValue( field ) {
        field.node.attr({
            cols: field.fieldValue.cols,
            rows: field.fieldValue.rows-1
        });
        field.node.change( function() { field.dirty = true; } );
        field.node.blur( function() { field.updateServer(); } );
    }


    function TextFieldValue( field ) {
        field.node.attr('size', field.fieldValue.width );
        field.node.change( function() { field.dirty = true; });
        field.node.blur( function() {
            if ( !field.dirty ) return;
            var value = field.getFieldValue();
            var updated = update(field.id, value );
            var newValue = field.getFieldValue();
            if ( field.dirty = (!updated || newValue != value) ) {
                field.setFieldValue(value);
                setTimeout(function(){ field.node.focus(); field.node.select()}, 10);
                alert( texts.invalidformat );
            }
        });
    }

    function Field( field ) {
        this.field = field;
        this.id = field.field.field;
        this.fieldValue = field.field.fieldValue;
        this.name = field.field.description;
        this.dirty = false;
        this.fieldType = getFieldType( field.field.fieldValue._type );
        this.node = $('#'+this.fieldType).clone().attr('id', this.id);
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

    Field.prototype.forceUpdate = function() {
        this.dirty = true;
        this.updateServer();
    }

    Field.prototype.updateServer = function() {
        if ( !this.dirty ) return;
        if ( this.serverFormatter ) {
            update( this.id, this.serverFormatter( this.getFieldValue() ) );
        } else {
            update( this.id, this.getFieldValue() );
        }
        this.dirty = false;
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

    inner.init = function( handler, fieldRefresher ) {
        resultHandler = handler;
        refresher = fieldRefresher;
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

    return inner;
}());

