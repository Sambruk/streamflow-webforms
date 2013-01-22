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
	var incomingSummary;
	
	function Form( formDraft ) {
		this.title = formDraft.description;
		this.id = formDraft.form;
		this.signatures = formDraft.signatures;
		this.pages = [];
		this.confirmationEmail = formDraft.enteredEmails;
		this.confirmationEmailConfirm;
		this.mailSelectionEnablement = formDraft.mailSelectionEnablement;
		if ( formDraft.secondsignee ) {
			// Load stored data
			this.secondSignatureName = formDraft.secondsignee.name;
			this.secondSignaturePhoneNumber = formDraft.secondsignee.phonenumber;
			this.secondSignatureSocialSecurityNumber = formDraft.secondsignee.socialsecuritynumber;
			this.secondSignatureSingleSignature = formDraft.secondsignee.singelsignature;
			this.secondSignatureEmail = formDraft.secondsignee.email;
			//this.secondSignatureEmailConfirm = formDraft.secondSignatureEmailConfirm;
		}
		this.selectedEid = formDraft.selectedEid;
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
    
    function hasFieldAValue( field ) {
      return !((typeof field === 'undefined') || (field.length < 1) );
    }

    Field.prototype.setValue = function( value ) {
    	this.value = value;
    	this.formattedValue = this.uIFormatter==null ? value : this.uIFormatter( value );
    	return this;
    }

	inner.setupIncomingFormSummaryPage = function ( incomingFormSummary ) {
		incomingSummary = incomingFormSummary;
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

	inner.foldIncoming = function( pageFolder ) {
		$.each( incomingSummary.pages, function(idx, page) {
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

	inner.init = function( formDraftValue, mailSelectionMessageTextIn ) {
		formDraft = new Form( formDraftValue );
		mailSelectionMessageText = mailSelectionMessageTextIn;
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

    inner.setConfirmationEmailConfirm = function( emailaddress ) {
        formDraft.confirmationEmailConfirm = emailaddress;
    }

    inner.confirmationEmailConfirm = function() {
        return formDraft.confirmationEmailConfirm;
    }
    
	inner.pageCount = function() {
		return formDraft.pages.length;
	}
	
	inner.hasSignatures = function() {
		return formDraft.signatures.length > 0;
	}
	
	inner.isFormSigned = function() {
	    return inner.requiredSignedSignaturesCount() == formDraft.signatures.length;
	}
	 
	inner.isSecondSignatureReady = function() {
	  if( inner.formNeedsSecondSignature() ) {
	    var singleSignature = inner.secondSignatureSingleSignature();
	    if( typeof singleSignature === 'undefined' || !singleSignature ) {
	      return (hasFieldAValue( formDraft.secondSignatureName ) 
	          && hasFieldAValue( formDraft.secondSignatureEmail )
	          && hasFieldAValue( formDraft.secondSignatureEmailConfirm )
	          && hasFieldAValue( formDraft.secondSignaturePhoneNumber )
	          && hasFieldAValue( formDraft.secondSignatureSocialSecurityNumber ) );
	      }
	  }
	  return true;
	}
	

	inner.formNeedsSigning = function() {
	  var needsSigning = false;
	  if ( requiredSignatures.length > 0 ) {
	    needsSigning = requiredSignatures[0].active;
	  }
	  return needsSigning;
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
	
	inner.formNeedsSecondSignature = function() {
	  var needsSigning = false;
	  if ( requiredSignatures.length > 1 ) {
	    needsSigning = requiredSignatures[1].active;
	  }
	  return needsSigning;
	}
	
	inner.requiredSignaturesCount = function() {
	  var reqSignNbrs = 0;
	  if ( inner.formNeedsSigning() ) {
	    reqSignNbrs++;
	    if ( inner.formNeedsSecondSignature() ) {
	      reqSignNbrs++;
	    }
	  }
	  return reqSignNbrs;
	}
	
	inner.requiredSignedSignaturesCount = function() {
	  var reqSignNbrs = 0;
	  if ( inner.formNeedsSigning() ) {
	    reqSignNbrs++;
	  }
	  return reqSignNbrs;
	}
	
	inner.isSecondSigningFlow = function () {
		return incomingSummary === undefined ? false : true;
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
	
	inner.incomingSignerName = function () {
		return incomingSummary === undefined ? undefined : incomingSummary.signatures[0].signerName; 
	}

	function fieldIterator( iterate, form ) {
	    $.each( form.pages, function(idx, page) {
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
        }, formDraft);
        return tbs;
	}

	inner.getIncomingFormTBS = function() {
        var tbs = "";
        fieldIterator( function( field ) {
            if ( field.fieldType != 'CommentFieldValue' )
                tbs += field.field + ' = ' + field.value + '. ';
        }, incomingSummary);
        return tbs;
	}

  inner.hasErrors = function() {
    var error = false;
    fieldIterator( function(field ) { 
      if ( field.field.field.mandatory && !field.value) {
        error = true;
      } 
      if (field.invalidformat != '' ) {
        error = true;
      }
    }, formDraft);
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
            var confirm = $('#confirmation-email-confirm');
            if ( email.val() != confirm.val() ) {
            	return false;
            }
        }
        if ( inner.formNeedsSigning() ) {
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
    
  inner.setSecondSignatureName = function( name ) {
    formDraft.secondSignatureName = name;
  }
    
  inner.secondSignatureName = function() {
    return formDraft.secondSignatureName;
  }
  
  inner.setSecondSignaturePhoneNumber = function( phoneNumber) {
    formDraft.secondSignaturePhoneNumber = phoneNumber;
  }
  
  inner.secondSignaturePhoneNumber = function() {
    return formDraft.secondSignaturePhoneNumber;
  }
  
  inner.setSecondSignatureSocialSecurityNumber = function( number ) {
    formDraft.secondSignatureSocialSecurityNumber = number;
  }
  
  inner.secondSignatureSocialSecurityNumber = function() {
    return formDraft.secondSignatureSocialSecurityNumber;
  }
  
  inner.setSecondSignatureSingleSignature = function( enabled ) {
    formDraft.secondSignatureSingleSignature = enabled;
  }
  
  inner.secondSignatureSingleSignature = function() {
    return formDraft.secondSignatureSingleSignature;
  }
  
  inner.setSecondSignatureEmail = function( email ) {
    formDraft.secondSignatureEmail = email;
  }
  
  inner.secondSignatureEmail = function() {
    return formDraft.secondSignatureEmail;
  }
  
  inner.setSecondSignatureEmailConfirm = function( email ) {
    formDraft.secondSignatureEmailConfirm = email;
  }
  
  inner.secondSignatureEmailConfirm = function() {
	  if ( inner.isFormSigned ()) {
		  return formDraft.secondSignatureEmail;
	  } else return formDraft.secondSignatureEmailConfirm;
  }
  
  inner.selectedEid = function() {
    return formDraft.selectedEid;
  }
  
  inner.setSelectedEid = function( eid ) {
    formDraft.selectedEid = eid;
  }
    
	return inner;
}());
