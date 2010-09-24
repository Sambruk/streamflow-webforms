/**
 * Methods handling inserting/updating form fields
 */

var formFieldsChanged = {};
var fieldMap = {};
var missingFields = "";
var formSubmissionValue;


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
        var field = $('#'+fieldId).find('input');
        var value = field.attr('value');
        if (!updateFieldValue(fieldId, value)) {
            field.attr('value', value);
            setTimeout(function(){field.focus(); field.select()}, 10);
            fieldChanged(fieldId);
            alert( texts.invalidformat );
        }
    }
};

updateTextAreaField = function(fieldId) {
    if ( formFieldsChanged[fieldId] )
    {
        var value = $('#'+fieldId).find('textarea').attr('value');
        updateFieldValue(fieldId, value);
    }
}

updateNumber = function( fieldId ) {
    if ( formFieldsChanged[fieldId] )
    {
        var textfield = $('#numberField'+fieldId);
        var enteredValue = textfield.attr('value');
        var result = updateFieldValue( fieldId, enteredValue );

        var updatedValue = textfield.attr('value');
        if ( updatedValue != enteredValue && !result )
        {
            textfield.attr('value', enteredValue);
            setTimeout(function(){textfield.focus(); textfield.select()}, 10);
            fieldChanged(fieldId);
            if ( fieldMap[ fieldId ].field.fieldValue.integer ) {
                alert( texts.invalidinteger );
            } else {
                alert( texts.invalidfloat );
            }
        }
    }
}

selectItem = function( id, name ) {
    var key = name.substring(2);
    var toBox = 'box'+key;
    var fromBox = 'box'+(parseInt(key)-1);
    var elements = $('#'+fromBox+' > option:selected');
    var box = $('#'+toBox);

    box.append( elements );
    var newValue = $.map( $('#'+toBox+' > option'), function( elm ) { return elm.text } ).join(', ');

    updateFieldValue( id, newValue );
}

deselectItem = function( id, name ) {
    var key = name.substring(2);
    var toBox = 'box' + key;
    var fromBox = 'box' + (parseInt(key)+1);
    var elements = $('#'+fromBox+' > option:selected');
    var box = $('#'+toBox);

    box.append( elements );
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
 * Module that handles the setup of all the field types
 */
var FieldTypeModule = (function() {
    var inner = {};

    var id;
    var name;
    var desc;
    var value;
    var fieldType;
    var fieldCount;

    function basicSetup( field ) {
        id = field.field.field;
        name = field.field.description;
        desc = field.field.note;
        value = (field.value == null ? "" : field.value);
        fieldMap[ id ] = field;
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
        if (field.field.fieldValue.hint){
            $('#'+id).find('#hint').text(' (' + field.field.fieldValue.hint + ')')
        }
    };


    function CheckboxesFieldValue( field ) {
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
    };

    function ComboBoxFieldValue( field ) {
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
    };

    function CommentFieldValue( field ) {
        var comment = $('#'+fieldType).clone();
        comment.append( '<pre>'+field.field.note+'</pre>' );
        $('#'+id).find('div').filter('.fieldvalue').append( comment );
    };

    function DateFieldValue( field ) {
        $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({value: formatUTCStringToIsoString(value), name:id, id: 'datefield'+fieldCount}).datepicker() );
    };

    function ListBoxFieldValue( field ) {
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
    };

    function NumberFieldValue( field ) {
        $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({id: 'numberField'+id, value:value, name:id}) );
    };

    function OptionButtonsFieldValue( field ) {
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
    };

    function TextAreaFieldValue( field ) {
        var cols = field.field.fieldValue.cols;
        var rows = field.field.fieldValue.rows;
        $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({
            id: id,
            cols: cols,
            rows: rows-1
        }).append(value) );
    };


    function TextFieldValue( field ) {
        var width = field.field.fieldValue.width;
        $('#'+id).find('div').filter('.fieldvalue').append( $('#'+fieldType).clone().attr({
            id: id,
            size: width,
            value: value
        }) );
    };

    inner.setupField = function( field, count ) {
        fieldType = getFieldType( field.field.fieldValue._type );
        basicSetup( field );
        fieldCount = count;
        eval( fieldType + '( field )' );
    };

    return inner;
}());

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