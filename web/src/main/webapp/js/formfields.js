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

    function renderGenericFieldPart( fieldComponent ) {
        $('#form_table_body').append( $('#FormField').clone().attr('id', fieldComponent.id) );
        if ( fieldComponent.desc != "" && fieldComponent.fieldType != "CommentFieldValue")
        {
            $('#'+fieldComponent.id).find('div.fieldname > img').aToolTip({
                    fixed: true,
                    tipContent: fieldComponent.desc
            });
            $('#'+fieldComponent.id).find('div.fieldname > img').show();
        }
        $('#'+fieldComponent.id).find('div.fieldname > label').text( fieldComponent.name);
        if ( !fieldComponent.field.field.mandatory )
        {
            $('#'+fieldComponent.id).find('#mandatory').hide();
        }
        if (fieldComponent.field.field.fieldValue.hint){
            $('#'+fieldComponent.id).find('#hint').text(' (' + fieldComponent.field.field.fieldValue.hint + ')')
        }
    }

    function CheckboxesFieldValue( field ) {
        this.render = function() {
            this.node = $('#FieldSet').clone().attr('id', 'FieldSet'+this.id);
            var values = field.field.fieldValue.values;
            for (valueIdx in values)
            {
                var selectionValue = values[valueIdx];
                var selectionId = fieldType + this.id + '' + valueIdx;
                var node = $('#'+fieldType).clone().attr({id: selectionId, name: this.id });
                var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
                this.node.append( $('<div />').append( node ).append( label ) );
            };
            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };

        this.setFieldValue = function(value) {
            var values = this.field.field.fieldValue.values;
            for ( idx in values ) {
                var selectionValue = values[ idx ];
                var selectionId = this.fieldType + this.id + '' + idx;
                if  ( value.indexOf(selectionValue)>-1 )
                {
                    this.node.find('#'+selectionId).attr('checked', 'checked');
                }
            }
        };

        this.getFieldValue = function() {
            return $.map( $('#'+this.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        };
    }

    function ComboBoxFieldValue( field ) {
        this.render = function() {
            this.node = $('#'+fieldType).clone().attr({name: this.id, id: "ComboBox"+this.id});
            var values = field.field.fieldValue.values;
            this.node.append( $('<option />') );
            for (valueIdx in values)
            {
                var selectionValue = values[valueIdx];
                var selectionId = fieldType + this.id + '' + valueIdx;
                var node = $('<option />').attr({value: selectionValue, id: selectionId}).text(selectionValue);
                this.node.append( node );
            };
            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };

        this.setFieldValue = function(value) {
            var values = this.field.field.fieldValue.values;
            for ( idx in values ) {
                var selectionValue = values[ idx ];
                var selectionId = this.fieldType + this.id + '' + idx;
                if  ( value == selectionValue )
                {
                    this.node.find('#'+selectionId).attr('selected', 'selected');
                }
            }
        };

        this.getFieldValue = function() {
            return this.node.find('option:selected');
        };
    }

    function CommentFieldValue( field ) {
        this.render = function() {
            var comment = $('#'+fieldType).clone();
            comment.append( '<pre>'+field.field.note+'</pre>' );
            $('#'+this.id).find('div').filter('.fieldvalue').append( comment );
        };

        this.setFieldValue = function(value) {};
    }

    function DateFieldValue( field ) {
        this.render = function() {
            this.node = $('#'+fieldType).clone().attr({name:this.id, id: 'datefield'+this.id}).datepicker();
            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };

        this.setFieldValue = function(value) {
            this.node.attr('value', formatUTCStringToIsoString(value));
        };

        this.updateServer = function() {
            var date = $.datepicker.parseDate('yy-mm-dd', this.getFieldValue() );
            updateFieldValue(this.id, date.format("UTC:yyyy-mm-dd'T'HH:MM:ss.0000'Z'"));
        };
    }

    function ListBoxFieldValue( field ) {
        this.render = function() {
            this.node = $('#'+fieldType).clone().attr({id:this.id});
            var possible = this.node.find('#possiblevalues').attr({id: 'Possible'+this.id});
            var selected = this.node.find('#selectedvalues').attr({id: 'Selected'+this.id});

            var leftButton = this.node.find('#move_left').attr({id: this.id, name: 'Possible'+this.id});
            var rightButton = this.node.find('#move_right').attr({id: this.id, name: 'Selected'+this.id});

            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };

        this.setFieldValue = function( value ) {
            var possible = this.node.find('#Possible'+this.id);
            var selected = this.node.find('#Selected'+this.id);
            possible.find('option').remove();
            selected.find('option').remove();
            var values = this.field.field.fieldValue.values;
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
        };

        this.getFieldValue = function() {
            return $.map ( this.node.find('#Selected'+this.id+' > option'), function( elm ) { return elm.text }).join(', ');
        };
    }

    function NumberFieldValue( field ) {
        this.render = function() {
            this.node = $('#'+fieldType).clone().attr({id: 'numberField'+this.id, name:this.id});
            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };

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
        };
    }

    function OptionButtonsFieldValue( field ) {
        this.render = function() {
            this.node = $('#FieldSet').clone().attr('id', 'FieldSet'+this.id);
            var values = field.field.fieldValue.values;
            for (valueIdx in values)
            {
                var selectionValue = values[valueIdx];
                var selectionId = fieldType + this.id + '' + valueIdx;
                var node = $('#'+fieldType).clone().attr({id: selectionId, name: this.id });
                var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
                this.node.append( $('<div />').append( node ).append( label ) );
            };
            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };

        this.setFieldValue = function(value) {
            var values = this.field.field.fieldValue.values;
            for ( idx in values ) {
                var selectionValue = values[ idx ];
                var selectionId = this.fieldType + this.id + '' + idx;
                if  ( value == selectionValue )
                {
                    this.node.find('#'+selectionId).attr('checked', 'checked');
                }
            }
        };

        this.getFieldValue = function() {
            return $.map( $('#'+this.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
        };
    }

    function OpenSelectionFieldValue( field ) {
        this.render = function() {
            this.node = $('#FieldSet').clone().attr('id', 'FieldSet'+this.id);
            var values = field.field.fieldValue.values;
            var selected = false;
            for (valueIdx in values)
            {
                var selectionValue = values[valueIdx];
                var selectionId = fieldType + this.id + '' + valueIdx;
                var node = $('#'+fieldType).clone().attr({id: selectionId, name: this.id });
                var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(selectionValue);
                this.node.append( $('<div />').append( node ).append( label ) );
            };

            var selectionId = 'openSelectionOption' + this.id;
            var node = $('#OpenSelectionOption').clone().attr({id: selectionId, name: this.id });
            var label = $('#label').clone().attr({'for': selectionId, id: 'label'+selectionId }).text(field.field.fieldValue.openSelectionName  );

            var openSelectionInput = $('#OpenSelectionTextField').clone().attr({id: 'openSelectionTextField' + this.id , name: this.id });
            this.node.append( $('<div />').append( node ).append( label ).append('&nbsp;').append( openSelectionInput) );

            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };

        this.setFieldValue = function(value) {
            var values = field.field.fieldValue.values;
            var selected = false;
            for (valueIdx in values)
            {
                var selectionValue = values[valueIdx];
                var selectionId = fieldType + this.id + '' + valueIdx;
                if  ( value == selectionValue )
                {
                    selected = true;
                    $('#'+selectionId).attr('checked', 'checked');

                }
            };
            var node = $('#openSelectionOption' + this.id);
            if (selected)
            {
                $('#openSelectionTextField' + this.id).attr({disabled: true, value: ""});
            } else {
                if (value) {
                    node.attr('checked', 'checked');
                    $('#openSelectionTextField' + this.id).attr("value", value);
                }
            }
        };

        this.getFieldValue = function() {
            var fieldValue = $.map( $('#'+this.id+ ' input:checked'), function( elm ) {return $('#label'+elm.id).text() }).join(', ');
            if ( fieldValue == this.field.field.fieldValue.openSelectionName ) {
                fieldValue = $('#openSelectionTextField'+this.id).attr('value');
            }
            return fieldValue;
        };
    }

    function TextAreaFieldValue( field ) {
        this.render = function() {
            var cols = field.field.fieldValue.cols;
            var rows = field.field.fieldValue.rows;
            this.node = $('#'+fieldType).clone().attr({
                id: this.id,
                cols: cols,
                rows: rows-1
            });

            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };
    }


    function TextFieldValue( field ) {
        this.render = function() {
            var width = field.field.fieldValue.width;
            this.node = $('#'+fieldType).clone().attr({
                id: this.id,
                size: width
            });
            $('#'+this.id).find('div').filter('.fieldvalue').append( this.node );
        };

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
        };
    }

    inner.render = function( field ) {
        fieldType = getFieldType( field.field.fieldValue._type );
        var fieldTypeUI = eval( 'new '+fieldType + '(field)');

        // add standard implementations
        if ( !fieldTypeUI.updateServer ) {
            fieldTypeUI.updateServer = function() {
                updateFieldValue( this.id, this.getFieldValue() );
            }
        }

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

        renderGenericFieldPart( fieldTypeUI );
        fieldTypeUI.render();
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
            component.updateServer();
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
}