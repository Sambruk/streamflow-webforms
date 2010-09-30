/**
 * Methods handling inserting/updating form fields
 */
var missingFields = "";
var formSubmissionValue;

selectOpenSelectChanged = function(fieldName) {
    var fieldValue = $.map( $('#'+fieldName+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');

    var field = $('#openSelectionTextField'+fieldName);
    field.attr('value','');
    field.attr("disabled", true);
    FieldTypeModule.markDirty( fieldName );
    FieldTypeModule.updateServer( fieldName );
};

selectOpenSelectOption = function(fieldName) {
    var field = $('#openSelectionTextField'+fieldName);
    field.removeAttr("disabled");
    FieldTypeModule.markDirty( fieldName );
    setTimeout(function(){field.focus(); }, 10);
};

listBoxArrow = function(id, toBox) {
    var fromBox;
    if ( toBox.substring(0,8)=='Possible') {
        fromBox = 'Selected' + id;
    } else {
        fromBox = 'Possible' + id;
    }
    var elements = $('#'+fromBox+' > option:selected');
    var box = $('#'+toBox);

    box.append( elements );
    var newValue = $.map( $('#Selected'+id+' > option'), function( elm ) { return elm.text } ).join(', ');
    
    FieldTypeModule.markDirty( id );
    FieldTypeModule.setFieldValue(id, newValue );
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
    // and taking the fieldComponent.node as the UI
    function displayField( fieldComponent ) {
        var field = $('#FormField').clone().attr('id', fieldComponent.id);
        if ( fieldComponent.desc != "" && fieldComponent.fieldType != "CommentFieldValue")
        {
            field.find('div.fieldname > img').show().aToolTip({ fixed: true, tipContent: fieldComponent.desc });
        }
        field.find('div.fieldname > label').text( fieldComponent.name);
        if (fieldComponent.field.field.fieldValue.hint){
            field.find('#hint').text(' (' + fieldComponent.field.field.fieldValue.hint + ')')
        }
        if ( !fieldComponent.field.field.mandatory )
        {
            field.find('#mandatory').hide();
        }
        field.find('div.fieldvalue').append( fieldComponent.node );
        $('#form_table_body').append( field );
    }

    function CheckboxesFieldValue( field ) {
        var id = field.field.field;
        this.node = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
        var node = this.node;
        $.each( field.field.fieldValue.values, function( idx, selectionValue ) {
            var selectionId = 'CheckboxesFieldValue' + id + idx;
            var element = $('#CheckboxesFieldValue').clone().attr({id: selectionId, name: id });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            node.append( $('<div />').append( element ).append( label ) );
        });

        this.setFieldValue = function(value) {
            $.each( field.field.fieldValue.values, function(idx, selectionValue ) {
                if  ( value.indexOf(selectionValue)>-1 )
                {
                    node.find('#CheckboxesFieldValue' + id + idx).attr('checked', 'checked');
                }
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
            var selectionId = 'ComboBoxFieldValue' + id + idx;
            node.append( $('<option />').attr({value: value, id: selectionId}).text(value) );
        });

        this.setFieldValue = function(value) {
            $.each( field.field.fieldValue.values, function(idx, selectionValue) {
                if  ( value == selectionValue )
                {
                    node.find('#ComboBoxFieldValue' + id + idx).attr('selected', 'selected');
                }
            });
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
        this.node.find('#move_left').attr({id: id, name: 'Possible'+id});
        this.node.find('#move_right').attr({id: id, name: 'Selected'+id});


        this.setFieldValue = function( value ) {
            possible.find('option').remove();
            selected.find('option').remove();
            $.each( field.field.fieldValue.values, function(idx, selectionValue) {
                var node = $('<option />').text(selectionValue);
                if  ( value.indexOf(selectionValue)>-1 )
                {
                    selected.append(node);
                } else
                {
                    possible.append( node );
                }
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

    function OptionButtonsFieldValue( field ) {
        var id = field.field.field;
        this.node = $('#FieldSet').clone().attr('id', 'FieldSet'+id);
        var node = this.node;
        $.each( field.field.fieldValue.values, function(idx, selectionValue) {
            var selectionId = 'OptionButtonsFieldValue' + field.field.field + idx;
            var element = $('#OptionButtonsFieldValue').clone().attr({id: selectionId, name: field.field.field });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            node.append( $('<div />').append( element ).append( label ) );
        });

        this.setFieldValue = function(value) {
            $.each( field.field.fieldValue.values, function(idx, selectionValue){
                if  ( value == selectionValue )
                {
                    node.find('#OptionButtonsFieldValue' + id + idx).attr('checked', 'checked');
                }
            });
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
            var selectionId = 'OpenSelectionFieldValue' + id + idx;
            var element = $('#OpenSelectionFieldValue').clone().attr({id: selectionId, name: id });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
            node.append( $('<div />').append( element ).append( label ) );
        });

        var selectionId = 'openSelectionOption' + id;
        var node = $('#OpenSelectionOption').clone().attr({id: selectionId, name:id });
        var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(field.field.fieldValue.openSelectionName  );

        var openSelectionInput = $('#OpenSelectionTextField').clone().attr({id: 'openSelectionTextField' + id , name: id });
        this.node.append( $('<div />').append( node ).append( label ).append('&nbsp;').append( openSelectionInput) );


        this.setFieldValue = function(value) {
            var selected = false;
            $.each( field.field.fieldValue.values, function(idx, selectionValue){
                if  ( value == selectionValue )
                {
                    selected = true;
                    $('#OpenSelectionFieldValue' + id + idx).attr('checked', 'checked');
                }
            });
            var node = $('#openSelectionOption' + id);
            if (selected)
            {
                $('#openSelectionTextField' + id).attr({disabled: true, value: ""});
            } else {
                if (value) {
                    node.attr('checked', 'checked');
                    $('#openSelectionTextField' + id).attr("value", value);
                }
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
            var oldValue = this.getFieldValue();
            if ( !updateFieldValue(this.id, this.getFieldValue() ) ) {
                var newValue = this.getFieldValue();
                if ( newValue != oldValue)
                {
                    this.setFieldValue(oldValue);
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
        fieldTypeUI.fieldType = fieldType;
        fieldTypeUI.field = field;
        fieldTypeUI.id = field.field.field;
        fieldTypeUI.name = field.field.description;
        fieldTypeUI.desc = field.field.note;
        fieldTypeUI.value = (field.value == null ? "" : field.value);
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
            if ( !component.updateServer ) {
                updateFieldValue( component.id, component.getFieldValue() );
            } else {
                component.updateServer();
            }
            component.dirty = false;
        }
    }

    inner.markDirty = function( fieldId ) {
        fieldMap[ fieldId ].dirty = true;
    }

    return inner;
}());

function getFieldType( qualifiedField )
{
    var list = qualifiedField.split('.');
    return list[ list.length - 1 ];
}

function setupFormSummary() {
    missingFields = "";
    var summaryDiv = $('#form_summary_div').clone().attr({'id':'inserted_form_summary_div'});
    summaryDiv.find('#form_description').text(formSubmissionValue.description);
    $('#app').empty().append( summaryDiv );

    $.each(formSubmissionValue.pages, function(idx, page){
        var pageDiv = $('#form_page_summary').clone().attr('id', 'page'+idx);
        var page_ref = $('#goto_form_page').clone().attr('accesskey', idx).text(page.title);
        pageDiv.find('h3').append( page_ref );
        $.each( page.fields, function(fieldIdx, field){
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
        });
        $('#form_pages_summary').append( pageDiv );
    });
    if ( missingFields != "" )
    {
        $('#form_submit').aToolTip({
            tipContent: missingFields
        });
    }
}