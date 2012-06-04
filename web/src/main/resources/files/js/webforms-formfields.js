/*
 *
 * Copyright 2009-2012 Streamsource AB
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

    function currentPage() {
    	return parseInt( location.hash.substring(1) );
    }
    
    function safeIdString( value ) {
        return value.replace(/\W/g, '');
    }

    function listBoxArrow(id, toBox, emptyFunction) {
        var fromBox = nameMap[ toBox ] + id;
        $('#'+toBox+id).append( $('#'+fromBox+' > option:selected') );
    }

    function clone( id, newId ) {
        if ( !newId ) return $('#'+id).clone().attr('id', id+'Cloned' );
    	return $('#'+id).clone().attr('id', newId );
    }

    /** All field type functions **/

    function AttachmentFieldValue( field, controlsNode ) {
    	field.node = clone( field.fieldType, field.id );
    	field.node.find('#Attachment').change( function() { button.enable(true); } ).
        attr({id:'Attachment'+field.id, name: field.id });
        controlsNode.append(field.node);
        
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
                success: function() {
                    FormModule.setValue( field.id, RequestModule.refreshField( field.id ) );
                    field.refreshUI( );
                    button.enable( false );
                }
            }

            RequestModule.attach( attachmentDTO );
        	return false;
        });

        field.refreshUI = function() {
            this.node.find('#attachmentLabel').text( this.formattedValue );
        }
    }

    function selectedValues( input ) {
    	var values = new Array();
    	if ( !input ) return values;
    	var i = 0;
    	input.replace(/(\[.*?\])/g, function(a, b){
            values[ i ] = b.substring( 1, b.length-1 );
            i++;
            return "";
        });

        $.each( input.split( ", " ), function( idx, selectionValue ) {
            values[i] = selectionValue;
            i++;
        });
        return values;
    }

    function CheckboxesFieldValue( field, controlsNode ) {
    	field.node = controlsNode;
    	field.node.attr('class', 'well');
    	$.each( field.fieldValue.values, function( idx, value ) {
            var selectionId = field.id + safeIdString( value );
            var element = clone('checkbox', 'label' + selectionId);
            element.find('input').attr('id', selectionId).click( function() {
            	field.changed().update();
            });
            element.append( value );
            field.node.append( element );
        });
        field.node.change( function() { field.formattedValue = "TST" });

        var values = selectedValues( field.value );
        field.refreshUI = function() {
            $.each( values, function(idx, selectionValue) {
                field.node.find('#' + field.id + safeIdString(selectionValue)).attr('checked', 'checked');
            });
        }

        field.getUIValue = function() {
            return $.map( $('#Field'+field.id+ ' input:checked'),
            function( elm ) {
                var value = $('#label'+elm.id).text();
                if ( value.indexOf(",") != -1 ) {
                    return "["+value+"]";
                } else {
                    return value;
                }
            }).join(', ');
        }
    }

    function ComboBoxFieldValue( field, controlsNode ) {
    	field.node = clone( field.fieldType, field.id );
    	field.node.append( $('<option />') );
        $.each(field.fieldValue.values, function(idx, value ) {
            var selectionId = field.id + safeIdString(value);
            field.node.append( $('<option />').attr({value: value, id: selectionId}).text(value) );
        });
        field.node.change( function() { field.changed().update(); });
        controlsNode.append( field.node );
        field.refreshUI = function() {
            field.node.find('#' + field.id + safeIdString(this.value)).attr('selected', 'selected');
        }

        field.getUIValue = function() {
            return field.node.find('option:selected').text();
        }
    }

    function CommentFieldValue( field, controlsNode ) {
    	field.node = clone( field.fieldType, field.id );
    	field.node.append( '<pre>'+field.field.field.note+'</pre>' );
        field.name = "";
        field.refreshUI = $.noop;
        controlsNode.append(field.node);
    }

    function DateFieldValue( field, controlsNode ) {
    	field.node = clone( 'textfield', field.id );
    	field.node.change( function() {
    		field.formattedValue = field.getUIValue();
    		field.value = $.datepicker.parseDate('yy-mm-dd', field.formattedValue ).format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'");
    	    update( field.id, field.value )
        });
        field.node.datepicker();
        controlsNode.append(field.node);
    }

    function ListBoxFieldValue( field, controlsNode ) {
    	field.node = clone( field.fieldType, field.id );
    	var possible = field.node.find('#possiblevalues').attr({id: 'Possible'+field.id});
        var selected = field.node.find('#selectedvalues').attr({id: 'Selected'+field.id});
        var buttons = field.node.find('#listboxbuttons');
        new View.Button( buttons ).image('icon-arrow-right').click( function() {
            listBoxArrow( field.id, 'Selected' );
            field.changed().update();
            return false;
        });
        buttons.append('<br/>');
        new View.Button( buttons ).image('icon-arrow-left').click( function() {
            listBoxArrow( field.id, 'Possible' );
            field.changed().update();
            return false;
        });

        $.each( field.fieldValue.values, function( idx, value ){
            var optionNode = $('<option />').attr('id', field.id+safeIdString(value)).text( value );
            possible.append( optionNode );
        });
        controlsNode.append(field.node);

        var values = selectedValues( field.value );
        field.refreshUI = function() {
            $.each( values, function(idx, selectionValue) {
                selected.append( field.node.find('#' + field.id + safeIdString(selectionValue)) );
            });
        }

        field.getUIValue = function() {
            var val =  $.map ( field.node.find('#Selected'+field.id+' > option'),
            function( elm ) {
                if ( elm.text.indexOf(",") != -1 ) {
                    return "["+elm.text+"]";
                } else {
                    return elm.text;
                }
            }).join(', ');
            return val;
        }
    }


    function NumberFieldValue( field, controlsNode ) {
    	field.node = clone( 'textfield', field.id );
    	field.node.change( function() { field.changed(); } );
        field.node.blur( function() {
            if ( !field.dirty ) return;
        	$('#Field' + field.id).removeClass("error");
        	$('#help' + field.id).remove();
            var enteredValue = field.getUIValue();
            update( field.id, enteredValue );

            var updatedValue = field.getUIValue();
            var serverValue = RequestModule.refreshField( field.id );
            if ( field.dirty = ( updatedValue != serverValue ) ) {
                field.setUIValue( enteredValue );
                setTimeout(function(){field.node.focus(); field.node.select()}, 10);
                $('#Field' + field.id).addClass("error");
                var help = clone('help-inline', 'help' + field.id);
                if ( field.fieldValue.integer ) {
                	help.append(texts.invalidinteger);
                } else {
                	help.append(texts.invalidfloat);
                }
                controlsNode.append( help );
            }
        });
        controlsNode.append(field.node);
    }

    function OptionButtonsFieldValue( field, controlsNode ) {
    	field.node = controlsNode;
    	field.node.attr('class', 'well');
    	$.each( field.fieldValue.values, function(idx, value) {
    		var selectionId = field.id + safeIdString( value );
            var element = clone('radio', 'label' + selectionId );
            element.find('input').attr({'id': selectionId, 'name': field.id}).click( function() { 
            	field.changed().update();
        	});
            element.append(value);
            field.node.append( element );
        });

        field.refreshUI = function() {
            field.node.find('#' + field.id + safeIdString(this.value) ).attr('checked', 'checked');
        }

        field.getUIValue = function() {
            return $.map( $('#Field'+field.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        }
    }

    function OpenSelectionFieldValue( field, controlsNode ) {
    	field.node = controlsNode;
    	field.node.attr('class', 'well');
    	$.each( field.fieldValue.values, function(idx, value){
            var selectionId = field.id + safeIdString(value);
            var element = clone('radio', 'label' + selectionId );
            element.find('input').attr({'id': selectionId, 'name':field.id}).click( function() { 
            	textfield.attr({value:'', disabled:true});
            	field.changed().update();
    		});
            element.append(value);
            field.node.append( element );
        });

        var id = 'openSelectionOption' + field.id;
        var option = clone('radio', 'label' + id);
        option.find('input').attr({'id': id, 'name':field.id}).click( function( ) { 
        	textfield.removeAttr('disabled'); 
        });
        option.append(field.fieldValue.openSelectionName );

        var textfield = clone('textfield', 'TextField' + field.id );
        textfield.addClass('openselection-text');
        textfield.change( function() { field.changed(); } );
        textfield.blur( function() { field.update(); } );
        option.append( '&nbsp;').append( textfield);
        field.node.append( option );


        field.refreshUI = function() {
            var selected = field.node.find('#' + field.id + safeIdString(this.value)).attr('checked', 'checked');
            if (selected.size() == 0 &&  this.value ) {
                field.node.find('#openSelectionOption' + field.id).attr('checked', 'checked');
                field.node.find('#TextField' + field.id).attr("value", this.value);
            } else {
                field.node.find('#TextField' + field.id).attr({disabled: true, value: ""});
            }
        }

        field.getUIValue = function() {
            var fieldValue = $.map( $('#Field'+field.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
            if ( fieldValue == field.fieldValue.openSelectionName ) {
                fieldValue = $('#TextField'+field.id).attr('value');
            }
            return fieldValue;
        }
    }

    function TextAreaFieldValue( field, controlsNode ) {
    	field.node = clone( field.fieldType, field.id );
    	var maxWidth = $('#inserted_content').width();
    	var cssWidth = field.fieldValue.cols * 7.3;
    	field.node.css("width", cssWidth < maxWidth ? cssWidth : maxWidth )
    	field.node.css("height", field.fieldValue.rows * 13);
    	field.node.change( function() { field.changed(); } );
        field.node.blur( function() { field.update(); } );
        controlsNode.append(field.node);
    }


    function TextFieldValue( field, controlsNode) {
    	field.node = clone( "textfield", field.id );
    	var maxWidth = $('#inserted_content').width();
    	var cssWidth = field.fieldValue.width * 7.3;
    	field.node.css("width", cssWidth < maxWidth ? cssWidth : maxWidth )
        field.node.change( function() { field.changed(); });
        field.node.blur( function() {
            if ( !field.dirty ) return;
        	$('#Field' + field.id).removeClass("error");
        	$('#help' + field.id).remove();
            var value = field.value;
            update( field.id, field.value );

            var newValue = field.getUIValue();
            var serverValue = RequestModule.refreshField( field.id );
            if ( field.dirty = ( newValue != serverValue ) ) {
                field.setUIValue(value);
                setTimeout(function(){ field.node.focus(); field.node.select()}, 10);
                $('#Field' + field.id).addClass("error");
                var help = clone('help-inline', 'help' + field.id);
                help.append(texts.invalidformat);
                controlsNode.append( help );
            }
        });
        controlsNode.append(field.node);
    }
    
    inner.createFieldUI = function( field, node ) {
        field.changed = function( ) {
            field.dirty = true;
            field.setValue( field.getUIValue() );
            return field;
        };

        field.getUIValue = function() {
            var value = field.node.attr('value');
            return value==null ? '' : value;
        };

        field.refreshUI = function() {
            field.node.attr( 'value', field.formattedValue );
        };

        field.setUIValue = function( value ) {
            field.setValue( value );
            if ( field.page.index == currentPage() ) field.refreshUI();
        };

        field.update = function() {
            if ( field.dirty ) {
                update( field.id, field.value );
                field.dirty = false;
            }
        };

        eval( field.fieldType + '(field, node)');
    }
    
    inner.updateField = function( id, value ) {
    	FormModule.getField( id ).setUIValue( value );
    }

    return inner;
}());