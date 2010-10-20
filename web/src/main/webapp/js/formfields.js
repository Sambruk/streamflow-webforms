/**
 * Methods handling inserting/updating form fields
 */
var missingFields = "";
var formSubmissionValue;
var formSignaturesValue = "";
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
 * Module that handles the setup of all the field types
 */
var FieldTypeModule = (function() {
    var inner = {};
    var fieldMap = {};

    // internal function to display the field using the field template
    // and taking the fieldComponent.node as the input widget
    function displayField( fieldDefinition ) {
        var field = $('#FormField').clone().attr('id', fieldDefinition.id);
        
        field.find('div.fieldname > label').text( fieldDefinition.name );
        showHint( fieldDefinition, field );
        showMandatory( fieldDefinition, field );
        showToolTip( fieldDefinition, field );
        field.find('div.fieldvalue').append( fieldDefinition.node );

        $('#form_table_body').append( field );
    }

    function getFieldType( qualifiedField ) {
        var list = qualifiedField.split('.');
        return list[ list.length - 1 ];
    }


    function showMandatory( fieldDefinition, node ) {
        if ( !fieldDefinition.field.field.mandatory )
        {
            node.find('#mandatory').hide();
        }
    }

    inner.displayReadOnlyField = function( field, target ) {
        var value = (field.value == null ? "" : field.value);
        var fieldType = getFieldType( field.field.fieldValue._type );
        if ( fieldType != "CommentFieldValue")
        {
            var li = $('#field_summary').clone().attr('id', field.field );
            li.find('b').text( field.field.description );
            showMandatory( field, li );
            if (fieldType == "DateFieldValue") {
                li.append(formatUTCStringToIsoString(value));
            } else {
                li.append( value );
            }
            target.append( li );
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

    function CheckboxesFieldValue( field ) {
        var id = field.field.field;
        this.node = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
        var node = this.node;
        $.each( field.field.fieldValue.values, function( idx, selectionValue ) {
            var selectionId = 'CheckboxesFieldValue' + id + safeIdString(selectionValue);
            var element = $('#CheckboxesFieldValue').clone().attr({id: selectionId, name: id });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            node.append( $('<div />').append( element ).append( label ) );
        });

        this.setFieldValue = function(value) {
            $.each( value.split(', '), function(idx, selectionValue) {
                node.find('#CheckboxesFieldValue' + id + safeIdString(selectionValue)).attr('checked', 'checked');
            });
        }

        this.getFieldValue = function() {
            return $.map( $('#'+this.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        }
    }

    function ComboBoxFieldValue( field ) {
        var id = field.field.field;
        this.node = $('#ComboBoxFieldValue').clone().attr({name: id, id: "ComboBox"+id});
        this.node.append( $('<option />') );
        var node = this.node;
        $.each(field.field.fieldValue.values, function(idx, value ) {
            var selectionId = 'ComboBoxFieldValue' + id + safeIdString(value);
            node.append( $('<option />').attr({value: value, id: selectionId}).text(value) );
        });

        this.setFieldValue = function(value) {
            node.find('#ComboBoxFieldValue' + id + safeIdString(value)).attr('selected', 'selected');
        }

        this.getFieldValue = function() {
            return this.node.find('option:selected');
        }
    }

    function CommentFieldValue( field ) {
        this.node = $('#CommentFieldValue').clone().attr("id", "Comment"+field.field.field).append( '<pre>'+field.field.note+'</pre>' );

        this.setFieldValue = function(value) {}
    }

    function DateFieldValue( field ) {
        this.node = $('#DateFieldValue').clone().attr({name:field.field.field, id: 'datefield'+field.field.field}).datepicker();

        this.setFieldValue = function( value ) {
            this.node.attr('value', formatUTCStringToIsoString(value));
        }

        this.updateServer = function() {
            var date = $.datepicker.parseDate('yy-mm-dd', this.getFieldValue() );
            updateFieldValue(this.id, date.format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'"));
        }
    }

    function ListBoxFieldValue( field ) {
        var id = field.field.field;
        this.node = $('#ListBoxFieldValue').clone().attr({id:id});
        var possible = this.node.find('#possiblevalues').attr({id: 'Possible'+id});
        var selected = this.node.find('#selectedvalues').attr({id: 'Selected'+id});
        this.node.find('#move_left').attr({id: id, name: 'Possible'});
        this.node.find('#move_right').attr({id: id, name: 'Selected'});
        $.each( field.field.fieldValue.values, function( idx, selectionValue ){
            var optionNode = $('<option />').attr('id', 'ListBoxFieldValue'+id+safeIdString(selectionValue));
            optionNode.text( selectionValue );
            possible.append( optionNode );
        });


        this.setFieldValue = function( value ) {
            var node = this.node;
            $.each( value.split(', '), function(idx, selectionValue) {
                selected.append( node.find('#ListBoxFieldValue' + id + safeIdString(selectionValue)) );
            });
        }

        this.getFieldValue = function() {
            return $.map ( this.node.find('#Selected'+this.id+' > option'), function( elm ) { return elm.text }).join(', ');
        }
    }

    function NumberFieldValue( field ) {
        this.node = $('#NumberFieldValue').clone().attr({id: 'numberField'+field.field.field, name:field.field.field});

        this.updateServer = function() {
            var textfield = $('#numberField'+this.id);
            var enteredValue = this.getFieldValue();

            var result = updateFieldValue( this.id, enteredValue );

            var updatedValue = this.getFieldValue();
            if ( updatedValue != enteredValue && !result )
            {
                this.setFieldValue( enteredValue );
                var node = this.node;
                setTimeout(function(){node.focus(); node.select()}, 10);
                this.dirty = true;
                if ( this.field.field.fieldValue.integer ) {
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
        var id = field.field.field;
        this.node = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
        var node = this.node;
        $.each( field.field.fieldValue.values, function(idx, selectionValue) {
            var selectionId = 'OptionButtonsFieldValue' + field.field.field + safeIdString(selectionValue);
            var element = $('#OptionButtonsFieldValue').clone().attr({id: selectionId, name: field.field.field });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            node.append( $('<div />').append( element ).append( label ) );
        });

        this.setFieldValue = function(value) {
            node.find('#OptionButtonsFieldValue' + id + safeIdString(value) ).attr('checked', 'checked');
        }

        this.getFieldValue = function() {
            return $.map( $('#'+this.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        }
    }

    function OpenSelectionFieldValue( field ) {
        var id = field.field.field;
        this.node = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
        var node = this.node;
        var selected = false;
        $.each( field.field.fieldValue.values, function(idx, selectionValue){
            var selectionId = 'OpenSelectionFieldValue' + id + safeIdString(selectionValue);
            var element = $('#OpenSelectionFieldValue').clone().attr({id: selectionId, name: id });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            node.append( $('<div />').append( element ).append( label ) );
        });

        var selectionId = 'openSelectionOption' + id;
        var node = $('#OpenSelectionOption').clone().attr({id: selectionId, name:id });
        var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(field.field.fieldValue.openSelectionName );

        var openSelectionInput = $('#OpenSelectionTextField').clone().attr({id: 'openSelectionTextField' + id , name: id });
        this.node.append( $('<div />').append( node ).append( label ).append('&nbsp;').append( openSelectionInput) );


        this.setFieldValue = function(value) {
            var node = $('#OpenSelectionFieldValue' + id + safeIdString(value)).attr('checked', 'checked');
            if (node.size()!=0) {
                $('#openSelectionTextField' + id).attr({disabled: true, value: ""});
            } else if ( value ) {
                $('#openSelectionOption' + id).attr('checked', 'checked');
                $('#openSelectionTextField' + id).attr("value", value);
            }
        }

        this.getFieldValue = function() {
            var fieldValue = $.map( $('#'+this.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
            if ( fieldValue == this.field.field.fieldValue.openSelectionName ) {
                fieldValue = $('#openSelectionTextField'+this.id).attr('value');
            }
            return fieldValue;
        }
    }

    function TextAreaFieldValue( field ) {
        var cols = field.field.fieldValue.cols;
        var rows = field.field.fieldValue.rows;
        this.node = $('#TextAreaFieldValue').clone().attr({
            id: field.field.field,
            cols: cols,
            rows: rows-1
        });
    }


    function TextFieldValue( field ) {
        this.node = $('#TextFieldValue').clone().attr({
            id: field.field.field,
            size: field.field.fieldValue.width
        });

        this.updateServer = function() {
            var value = this.getFieldValue();
            if ( !updateFieldValue(this.id, value ) ) {
                var newValue = this.getFieldValue();
                if ( newValue != value)
                {
                    this.setFieldValue(value);
                    var node = this.node;
                    setTimeout(function(){ node.focus(); node.select()}, 10);
                    this.dirty = true;
                    alert( texts.invalidformat );
                }
            }
        }
    }

    inner.render = function( field ) {
        var fieldType = getFieldType( field.field.fieldValue._type );
        var fieldTypeUI = eval( 'new '+fieldType + '(field)');

        if ( !fieldTypeUI.getFieldValue ) {
            fieldTypeUI.getFieldValue = function() {
                return this.node.attr('value');
            }
        }

        if ( !fieldTypeUI.setFieldValue ) {
            fieldTypeUI.setFieldValue = function(value) {
                this.node.attr( 'value', value );
            }
        }

        // set field properties
        fieldTypeUI.field = field;
        fieldTypeUI.id = field.field.field;
        fieldTypeUI.value = (field.value == null ? "" : field.value);
        fieldTypeUI.name = field.field.description;
        fieldTypeUI.dirty = false;
        fieldMap[ fieldTypeUI.id ] = fieldTypeUI;

        displayField(fieldTypeUI);
        fieldTypeUI.setFieldValue( fieldTypeUI.value );
    }

    inner.setFieldValue = function( fieldId, value ) {
        fieldMap[ fieldId ].setFieldValue( value );
    }

    inner.getFieldValue = function( fieldId ) {
        fieldMap[ fieldId ].getFieldValue();
    }

    inner.updateServer = function( fieldId ) {
        var component = fieldMap[ fieldId ];
        if ( component.dirty )
        {
            if ( component.updateServer ) {
                component.updateServer();
            } else {
                updateFieldValue( component.id, component.getFieldValue() );
            }
            component.dirty = false;
        }
    }

    inner.markDirty = function( fieldId ) {
        fieldMap[ fieldId ].dirty = true;
    }

    return inner;
}());


function setupFormSummary() {
    var missingFields = "";
    var summaryDiv = $('#form_summary_div').clone().attr({'id':'inserted_form_summary_div'});
    summaryDiv.find('#form_description').text( formSubmissionValue.description );
    $('#app').empty().append( summaryDiv );

    $.each(formSubmissionValue.pages, function(idx, page){
        var pageDiv = $('#form_page_summary').clone().attr('id', 'page'+idx);
        pageDiv.find('h3').append( $('#goto_form_page').clone().attr('href', '#'+idx).text(page.title) );
        var ul = pageDiv.find('ul');
        $.each( page.fields, function( fieldIdx, field ){
            FieldTypeModule.displayReadOnlyField( field, ul );
            if ( field.field.mandatory && !field.value) {
                missingFields += texts.missingfield + " '"+field.field.description+"' <br>";
            }
        });
        $('#form_pages_summary').append( pageDiv );
    });
    var formFilledIn = (missingFields == "");
    var button;
    if ( formRequiresSignatures() ) {
        button = $('#form_sign_'+formFilledIn).clone();
    } else {
        button = $('#form_submit_'+formFilledIn).clone();
    }

    $('#form_submission_status').append( button );
    if ( !formFilledIn ) {
        button.aToolTip({ tipContent: missingFields });
    }
}