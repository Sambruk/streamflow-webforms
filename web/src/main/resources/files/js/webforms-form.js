/*
 *
 * Copyright 2009-2012 Jayway Products AB
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
var FormModule = (function() {
	var inner = {};
	var formDraft;
	var mailSelectionMessageText;
	var eIdProviders;
	var fieldMap = {};
	var initDone = false;
	var requiredSignatures;
	var selectedRequiredSignature;
	
	function Form( formDraft ) {
		this.title = formDraft.description;
		this.id = formDraft.form;
		this.signatures = formDraft.signatures;
		this.pages = [];
		this.confirmationEmail = formDraft.enteredEmails;
		this.mailSelectionEnablement = formDraft.mailSelectionEnablement;
		var pages = this.pages;
		$.each( formDraft.pages, function(idx, page) {
			pages[ idx ] = new Page( page, idx );
		});
	}
	
	function Page( page, idx ) {
		this.title = page.title;
		this.index = idx;
		this.fields = [];
		var fields = this.fields;
		var parent = this;
		$.each( page.fields, function( idx, field) {
			fields[ idx ] = new Field( field, parent );
		});
	}
	
	function Field( field, page ) {
        this.page = page;
		this.field = field;
        this.id = field.field.field;
        this.fieldValue = field.field.fieldValue;
        this.name = field.field.description;
        this.dirty = false;
        this.fieldType = getFieldType( field.field.fieldValue._type );
        this.setUIFormatter();
        this.invalidformat = false;
        this.setValue( this.field.value == null ? "" : this.field.value );
        fieldMap[ this.id ] = this;
    }	
	
    function getFieldType( qualifiedField ) {
        var list = qualifiedField.split('.');
        return list[ list.length - 1 ];
    }
	
    Field.prototype.setUIFormatter = function( ) {
    	if ( this.fieldType == "DateFieldValue" ) {
    		this.uIFormatter = formatUTCStringToIsoString;
    	} else if ( this.fieldType == "AttachmentFieldValue" ) {
    		this.uIFormatter = formatJSONAttachment;
    	} else if ( this.fieldType == "CheckboxesFieldValue" || this.fieldType == "ListBoxFieldValue" ) {
    	    this.uIFormatter = formatSelectionValues;
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

    function formatJSONAttachment( value ) {
        if ( value ) return $.parseJSON( value ).name;
        return "";
    }

    function formatSelectionValues( value ) {
        return value.replace(/(\[|\])/g, "'" );
    }

    Field.prototype.setValue = function( value ) {
    	this.value = value;
    	this.formattedValue = this.uIFormatter==null ? value : this.uIFormatter( value );
    	return this;
    }

	inner.getField = function( id ) {
	    return fieldMap[ id ];
	}

	inner.setValue = function( id, value ) {
		fieldMap[ id ].setValue( value );
	}

	inner.fold = function( pageFolder ) {
		$.each( formDraft.pages, function(idx, page) {
			var fieldFolder = pageFolder( page );
			$.each( page.fields, function( idy, field) {
				fieldFolder( field );
			});
		});
	}

	inner.foldEditPage = function( pageIndex, fieldFolder ) {
	    $.each( formDraft.pages[ pageIndex ].fields, function( idx, field ) {
	        fieldFolder( field );
        });
	}

	inner.init = function( formDraftValue ) {
		formDraft = new Form( formDraftValue );
		mailSelectionMessageText = RequestModule.getMailSelectionMessage();
		initDone = true;
	}
	
	inner.initialized = function() {
		return initDone;
	}

	inner.mailNotificationEnabled = function() {
	    return formDraft.mailSelectionEnablement;
	}

	inner.setMailNotificationEnabled = function( enabled ) {
	    formDraft.mailSelectionEnablement = enabled;
	}

    inner.setConfirmationEmail = function( emailaddress ) {
        formDraft.confirmationEmail = emailaddress;
    }

    inner.confirmationEmail = function() {
        return formDraft.confirmationEmail;
    }

	inner.pageCount = function() {
		return formDraft.pages.length;
	}
	
	inner.hasSignatures = function() {
		return formDraft.signatures.length > 0;
	}
	
	inner.isFormSigned = function() {
		return requiredSignatures.length == formDraft.signatures.length;
	}
	
	inner.formNeedsSigning = function() {
		return requiredSignatures.length > 0;
	}

	inner.setRequiredSignatures = function( required ) {
	    requiredSignatures = required;
	}

	inner.setRequiredSignature = function( index ) {
		selectedRequiredSignature = requiredSignatures[ index ].name;
	}
	
	inner.getRequiredSignature = function( ) {
		return selectedRequiredSignature;
	}
	
	inner.requiredSignaturesCount = function() {
		return requiredSignatures.length;
	}
	
	inner.title = function() {
		return formDraft.title;
	}
	
	inner.getRequiredSignatures = function() {
		return requiredSignatures;
	}
	
	inner.getSignatures = function() {
		return formDraft.signatures;
	}

	function fieldIterator( iterate ) {
	    $.each( formDraft.pages, function(idx, page) {
	        $.each( page.fields, function(idy, field) {
	            iterate( field );
            })
        })
	}

	inner.getFormTBS = function() {
        var tbs = "";
        fieldIterator( function( field ) {
            if ( field.fieldType != 'CommentFieldValue' )
                tbs += field.name + ' = ' + field.formattedValue + '. ';
        });
        return tbs;
	}

    inner.hasErrors = function() {
        var error = false;
        fieldIterator( function(field) { 
        	if ( field.field.field.mandatory && !field.value) {
            	error = true;
        	} 
        	if (field.invalidformat != '' ) {
        		error = true;
        	}
        });
        return error;
    }

	
	inner.pages = function() {
		return formDraft.pages;
	}
	
	inner.pageCount = function() {
		return formDraft.pages.length;
	}

    inner.providersInitialized = function() {
        return ( typeof( eIdProviders )!="undefined" );
    }

    inner.setProviders = function( providers ) {
        eIdProviders = providers;
        $.each (eIdProviders.links, function(idx, provider) {
        	var list = provider.href.split('=');
            if ( list.length  != 2 ) {
                throw { error: texts.invalidProviderList, redirect:'summary' };
            } else {
            	provider.provider = list[1];
            }
        });
    }

    inner.providerLinks = function() {
    	return eIdProviders.links;
    }
    
    inner.canSubmit = function() {
    	var formFilled = !inner.hasErrors();
    	var notify = $('#mailCheckbox').find('input').prop('checked');
        if ( notify ) {
            var email = $('#confirmation-email');
            var confirm = $('#confirmation-eamil-confirmed');
            if ( email.val() != confirm.val() ) {
            	return false;
            }
        }
        if ( inner.requiredSignaturesCount() > 0 ) {
            return formFilled && inner.isFormSigned();
        }
	    return formFilled;
    }
    
    inner.getFormId = function() {
    	return formDraft.id;
    }
    
    inner.destroy = function() {
    	initDone = false;
    	formDraft = null;
    }

    inner.getMailSelectionMessage = function() {
        return mailSelectionMessageText;
    }
    
	return inner;
}());
