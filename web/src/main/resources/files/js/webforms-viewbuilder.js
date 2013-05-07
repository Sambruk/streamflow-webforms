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
var View = (function() {
    var inner = {};
    var messages = {};
    var fieldGroups = {};

    inner.error = function( message ) {
        var node = clone('alert');
        node.addClass("alert-error")
        node.append( message );
        var breadcrumbNode = $('#inserted_content').find('ul.breadcrumb');
        node.insertAfter(breadcrumbNode);        
    }

    inner.discard = function( args ) {
        RequestModule.discard();
        FormModule.destroy();

        var container = $('#container').empty();
        var node = clone( 'thank_you_div' );
        var alert = clone('alert');
        alert.addClass("alert-info")
        alert.append( texts.formdiscarded );
        node.prepend(alert);
        
        new inner.Button( node ).name(texts.restart).href("#");
        container.append(node);
    }

    inner.submit = function() {
        RequestModule.submitAndSend();
        var caseName = RequestModule.getCaseName();
        var printUrl = UrlModule.getPrintUrl( FormModule.getFormId() );
        FormModule.destroy();

        var container = $('#container').empty();
        var node = clone( 'thank_you_div' );

        if ( typeof( caseName )!="undefined") {
        	node.find('#thank-you-message').text(texts.formSubmittedThankYou);
            node.find('#caseid_message').text(texts.caseidmessage);
            node.find('#caseid').text(caseName);
        }
        new inner.Button( node ).image('print').name(texts.print).href(printUrl).attr('target','_new');
        container.append(node);
    }

    inner.formPage = function( args ) {
        var page = parseInt( args.segment );
        createPageContent(page, function(node) { 
        	var form = clone('form');
        	FormModule.foldEditPage( page, function(field) { 
        		foldEditField(form.find('fieldset'), field); 
        	});
        	$.each( fieldGroups, function( key, value ) {
                var group = form.find( '#' + key );
        	    $.each( value.embedded, function( i, val) {
                    // find element and move into group
                    group.append( form.find('#Field'+val ) );
        	    });
        	});
        	node.append(form);
        });
        // Init each GeoLocationField
        $.each( FormModule.pages()[ page ].fields, function(index, field ) {
        	if (field.fieldType == 'GeoLocationFieldValue') {
				field.initMap();
        	}
        });
    }

    inner.summary = function( args ) {
    	createPageContent( getSummary(), function( node ) {
    		FormModule.fold( function( page ) { return foldPage( node, page ) } );
            addMailNotification( node );
            addSecondSignatureDiv( node );
            addSignaturesDiv( node );
    	});
    }

    inner.foldPage = function( node, page) {
    	return foldPage( node, page );
    }
    
    function createPageContent(page, contentFunction){
    	 var errors = $('#inserted_alert');
    	 var container = $('#container').empty();
         addHeader( container );
         var node = clone('row');
         container.append(node);
         var content = clone('content');
         node.append(content);
         addProgressbar( page, FormModule.pages() , content );
         
         contentFunction(content);

         addButtons( content, page);
         addFooter( container);      
    }
    
    function foldEditField( node, field ) {

        var fieldNode = clone( 'formfield', 'Field' + field.id ).appendTo( node );
        var controlsNode = fieldNode.find('div.controls');
        FieldTypeModule.createFieldUI( field, controlsNode );

        if ( field.fieldType == "FieldGroupFieldValue" ) {
            // setup a collector that collect the next field id's
            var fieldGroup = {};
            fieldGroup.count = field.fieldValue.fieldCount;
            fieldGroup.embedded = [];
            fieldGroups[ field.id ] = fieldGroup;
            var fieldHeader = fieldNode.find('label.control-label');
            fieldHeader.append( field.name );
        } else {
            $.each( fieldGroups, function( key, value) {
                if ( value.count > 0 ) {
                    value.embedded.push( field.id );
                    value.count--;
                }
            });
            if ( field.fieldType == "CommentFieldValue" ) {
                fieldNode.find('label').remove();
            } else {
                var fieldHeader = fieldNode.find('label.control-label');
                fieldHeader.append( field.name );
                mandatory( fieldHeader, field );
                hint( fieldHeader, field );
                help( fieldHeader, field);
            }
        }
        field.refreshUI();
    };

    function mandatory( node, field ) {
        if ( field.field.field.mandatory ) {
            clone('mandatory', 'mandatory' + field.id).appendTo( node );
        }
    }


    function hint( node, field ) {
        if ( field.fieldValue.hint ) {
        	clone('hint', 'hint' + field.id).text( ' (' + field.fieldValue.hint + ')' ).appendTo( node );
        }
    }
    
    function foldPage( node, page ) {
    	var pageDiv = clone('form_page_summary').appendTo( node );
    	pageDiv.find('h3').append( clone('link').attr('href',getPage(page.index)).text(page.title) );
    	return function( field ) {
    		foldField( pageDiv.find('#fields_table'), field );
    	};
    }
    
    function foldField( node, field ) {
        if ( field.fieldType == "CommentFieldValue" ) return;
        var row = clone( 'field_summary', field.id ).appendTo( node );
        var tr = $('<td class="field_label"/>').append( field.name );
        row.append( tr );
        if (field.fieldType == "GeoLocationFieldValue") {
        	if (field.mapValue.isPoint) {
        		$('<td class="field_value"/>').append( clone( 'map_point') ).append(texts.map_point).appendTo( row );
        	} else if (field.mapValue.isPolyline){
        		$('<td class="field_value"/>').append( clone( 'map_polyline') ).append(texts.map_polyline).appendTo( row );
        	} else if (field.mapValue.isPolygon) {
        			$('<td class="field_value"/>').append( clone( 'map_polygon') ).append(texts.map_polygon).appendTo( row );
        	}
        } else {
        	$('<td class="field_value"/>').append( field.formattedValue ).appendTo( row );
        }
        if (field.field.field.mandatory && !field.formattedValue) {
    		row.addClass('validation-missing');
    		row.append($('<td class="field_message pull-right"/>').append(clone('label_missing', 'missing')));
        } else if (field.invalidformat) {
    		row.addClass('validation-error');
    		row.append($('<td class="field_message pull-right"/>').append(clone('label_error', 'error')));
        }
    }

    function cleanUpPosition( position) {
		if (position.indexOf("(") == 0) {
			position = position.substring(1);
		}
		if (position.indexOf(")") != -1) {
			position = position.substring(0, position.indexOf(")"));
		}
		return $.trim(position);
	}
    function help( node, field ) {
        if ( field.field.field.note != "" && field.fieldType != "CommentFieldValue") {
            clone('help-block').append(field.field.field.note).insertAfter(node);
        }
    }
    
    function enableSecondSignatureFields( secondSignature ) {
        var enable = false;
        var signature = getSignature( FormModule.getRequiredSignatures()[0].name, FormModule.getSignatures() );
        signature ? enable = false : enable = true;
        var inputArray = secondSignature.find('input');
        for (var i = 0; i < inputArray.length; i++) {
            if (enable) {
                inputArray[i].disabled ? inputArray[i].removeAttr("disabled") : '';
            } else {
                inputArray[i].disabled = "disabled";
            }
        }
    }

    inner.sign = function( args ) {
        var retVal = doSign();
        if ( retVal != 0 ) {
            var errorKey = "eid-" + retVal;
            FormModule.setSelectedEid( null );
            throw { warning: texts.eiderrormessage + ": " + texts[errorKey], redirect:getSummary() };
        } else {
            // strip parameters
            var verifyDTO = {};
            $.each( $('#eIdPlugin').find('form > input:hidden'), function(idx, value ) {
                if ( value.name ) {
                    verifyDTO[ value.name ] = value.value;
                }
            });
            verifyDTO.name = FormModule.getRequiredSignature();
            verifyDTO.form = FormModule.getFormTBS();
            RequestModule.verify( verifyDTO );
            
            // Store the email etc before reloading the formdraft
            var confirmationEmail = FormModule.confirmationEmail();
            var confirmationEmailConfirm = FormModule.confirmationEmailConfirm();
            
            if(FormModule.formNeedsSecondSignature()) {
              var secondSignatureName = FormModule.secondSignatureName();
              var secondSignaturePhoneNumber = FormModule.secondSignaturePhoneNumber();
              var secondSignatureSocialSecurityNumber = FormModule.secondSignatureSocialSecurityNumber();
              var secondSignatureEmail = FormModule.secondSignatureEmail();
              var secondSignatureEmailConfirm = FormModule.secondSignatureEmailConfirm();
              var secondSignatureSingleSignature = FormModule.secondSignatureSingleSignature();
              if (!FormModule.secondSignatureSingleSignature()) {
                RequestModule.setSecondSignatureSingleSignature( false );
                FormModule.setSecondSignatureSingleSignature( false );
                secondSignatureSingleSignature = FormModule.secondSignatureSingleSignature();
              }
            }

            FormModule.init( RequestModule.getFormDraft() );
            FormModule.setConfirmationEmail( confirmationEmail );
            FormModule.setConfirmationEmailConfirm( confirmationEmailConfirm );
            
            if(FormModule.formNeedsSecondSignature()) {
              FormModule.setSecondSignatureName( secondSignatureName );
              FormModule.setSecondSignaturePhoneNumber( secondSignaturePhoneNumber );
              FormModule.setSecondSignatureSocialSecurityNumber( secondSignatureSocialSecurityNumber );
              FormModule.setSecondSignatureEmail( secondSignatureEmail );
              FormModule.setSecondSignatureEmailConfirm( secondSignatureEmailConfirm );
              FormModule.setSecondSignatureSingleSignature( secondSignatureSingleSignature );
            }
            // signing success redirect to summary
            throw {info:texts.formSigned, redirect:getSummary()};
        }
    }

    inner.runView = function( view ) {
        try {
            view();
            showMessages();
            $(window).scrollTop( 0 );
        } catch ( e ) {
        	if (!e) {
        		console.log(e.message);
        	}
            messages = {};
            if ( e.info ) messages.info = e.info;
            else if ( e.warning ) messages.warning = e.warning;
            else if ( e.error ) messages.error = e.error;
            else if ( e.message ) messages.error = e.message + ', '+e.fileName + '(' + e.lineNumber + ')';

            if ( e.redirect ) {
                redirect( e.redirect );
            } else {
                redirect( getSummary() );
            }
        }
    }

    inner.updateField = function(fieldId, fieldValue) {
        var fieldDTO = {
            field: fieldId,
            value: fieldValue
        };
        var image = $('#Field'+fieldId+' .fieldwaiting > img').show();
        try{
        	if ( FormModule.isSecondSigningFlow() ) {
    			return TaskRequestModule.updateField( fieldDTO );
    		} else {
    			return RequestModule.updateField( fieldDTO );
    		}
            return RequestModule.updateField( fieldDTO );
        } catch( e ) {
            message = { error: e.info };
            showMessages();
            return "";
        }finally{
            image.hide();
        }
    }

    function addHeader( node ) {
        var header = clone('form_header');
        header.find('#form_description').text( FormModule.title() );
        node.prepend( header );
    }

    function addButtons( node, page) {
    	var buttons = clone('buttons');
	    var previousBtn = new inner.Button( buttons ).name(texts.previous).href( getPrevious( page ) )
	    var nextBtn = new inner.Button( buttons ).name(texts.next).href(getNext( page ) ).enable( page!=getSummary() );
	   
	    if ( !FormModule.isSecondSigningFlow() ) {
	    	previousBtn.enable( page!=0 );
		    var dialogElement = createDiscardDialog(node);
		    new inner.Button( buttons ).name(texts.discard).confirm('#' + dialogElement.attr('id')).addClass("btn-danger");
	    } else {
	    	previousBtn.enable( page!=getIncoming());
	    }
	    
	    if( page == getSummary()) {
	    	var button = new inner.Button( buttons ).name(texts.submit).href(getSubmit());
	    	button.attr('id', 'inserted_button_submit');
	    	if (FormModule.canSubmit()) {
	    		button.addClass("btn-primary");
	    	} else {
	    		button.enable( false ); 
	    	}
	    }
        node.append( buttons );
        return buttons;
    }

    function createDiscardDialog( node ) {
    	var dialog = clone('modal', 'confirmAbortModal');
	    dialog.find('.modal-header').prepend(texts.discard);
	    dialog.find('.modal-body').append(texts.confirmDiscard);
	    dialog.find('.modal-footer').append();
	    var button = new inner.Button(dialog.find('.modal-footer')).name(texts.no).attr({'data-dismiss':'modal'});
	    var button = new inner.Button(dialog.find('.modal-footer')).name(texts.yes).attr({'data-dismiss':'modal'}).href(getDiscard()).click(function() {
	    	inner.discard();
	    	dialog.modal('hide');
	    });
	    node.append(dialog);
	    return dialog;	
    }
    
    function addFooter( node ) {
        var footer = clone('footer');
        node.append( footer );
    }
    
    function getPrevious( segment ) {
        var current = parseInt( segment );
        if ( isNaN( current ) ) {
            return getPage( FormModule.pageCount()-1 );
        } else if (current == 0){
        	return getIncoming();
        } else {
            return getPage( current-1);
        }
    }

    function getNext( segment ) {
    	if (segment == getIncoming()) {
    		return getPage(0);
    	}
        var current = parseInt( segment );
        if ( isNaN( current ) || (current == FormModule.pageCount()-1 ) ) {
            return getSummary();
        } else {
            return getPage( current+1 );
        }
    }

    function getPage( page ) {
        return '#' + Contexts.findUrl( inner.formPage, [page]);
    }

    function getIncoming() {
        return '#incoming';
    }

    function getSummary() {
        return '#summary';
    }

    function getSecondSignSummary() {
        return '#' + Contexts.findUrl( inner.secondSignSummary );
    }

    function getSubmit( ) {
        return '#' + Contexts.findUrl( inner.submit );
    }

    function getDiscard() {
        return '#' + Contexts.findUrl( inner.discard );
    }

    function getSign( idx ) {
        return '#' + Contexts.findUrl( inner.sign, [idx] );
    }

    function addMailNotification( node ) {
        var message = FormModule.getMailSelectionMessage();
        if ( message ) {
            var notification = clone('mailNotification', "insertedMailNotification" );
            var controls = notification.find('#mailControls');
            var inputs   = notification.find('#mailInputs');

            var checkbox = clone('checkbox', 'mailCheckbox' );
            checkbox.find('input').prop('checked', FormModule.mailNotificationEnabled() );
            
            checkbox.append( message );
            controls.append( checkbox );

            inputs.find('#confirmation-email-label').text(texts.email);
            inputs.find('#confirmation-email-confirm-label').text(texts.confirmEmail);
            var emailField = inputs.find('#confirmation-email');
            var emailConfirmField = inputs.find('#confirmation-email-confirm');
            
            emailField.val( FormModule.confirmationEmail() );
            emailField.blur( function() {
                // update server
                var stringDTO = {};
                stringDTO.string = emailField.val();
                RequestModule.setConfirmationEmail( stringDTO );
                FormModule.setConfirmationEmail( stringDTO.string );
            });
            // Fill with value that is temporary stored in the application while running. 
            // Not persisted on the server
            emailConfirmField.val( FormModule.confirmationEmailConfirm() );
            emailConfirmField.blur( function() {
            	FormModule.setConfirmationEmailConfirm( emailConfirmField.val());
            });

            var emailFunction = function() {
                // if not match show error and disable submit-button
                if ( emailConfirmField.val() != emailField.val() ) {
            		    inputs.addClass('error');
                    inputs.find('#confirmation-help').append(texts.emailMismatch);
                    toggleSubmitButton( false );   
                    
                    emailConfirmField.focus( function() {
                    	// Remove old error messages and enable submit button
                    	inputs.removeClass("error");
                    	inputs.find('#confirmation-help').text("");
                    	emailConfirmField.focus( function(){});
                    });
                } else if (emailField.val()) {
                	toggleSubmitButton( true);                	
                }
            };
            
            if (FormModule.mailNotificationEnabled() ) {
            	toggleSubmitButton(false);
                emailFunction.call();
            } else {
                inputs.hide();
            }
            
            checkbox.find('input').click( function() {
                var checked = checkbox.find('input').prop('checked');
                RequestModule.setMailNotificationEnablement( checked );
                FormModule.setMailNotificationEnabled( checked );

                if ( checked ) {
                    inputs.show( 'slow' );
                    toggleSubmitButton( false );
                    emailFunction.call();
                } else {
                    inputs.hide( 'slow' );
                    toggleSubmitButton( true );
                }
                                
            });
            emailConfirmField.blur( emailFunction );
            
            node.append( notification );
        }
    }
    
    function toggleSubmitButton( enabled ) {
      if (enabled && FormModule.canSubmit()) {
          enable($('#inserted_button_submit'), true);
          $('#inserted_button_submit').addClass("btn-primary"); 
      } else {
        enable($('#inserted_button_submit'), false);
          $('#inserted_button_submit').removeClass("btn-primary");    
      }
    }
    
    function addSignaturesDiv( node ) {
        if ( FormModule.formNeedsSigning() ) {
          var reqSign = FormModule.getRequiredSignatures()[0];
          
          var signaturesNode = clone('form_signatures');
          signaturesNode.addClass('well');
          signaturesNode.find("h3").append( texts.signature );
            
          var table = signaturesNode.find('table');
          var idx = 0;
          var row = $('<tr/>');
          table.append( row );
          row.addClass("signature-row");
          row.append( $('<td/>').append(reqSign.name + ":") );
          var signature = getSignature( reqSign.name, FormModule.getSignatures() );
          if ( signature ) {
            row.append( $('<td/>').append(signature.signerName).addClass('signer-name'));
          } else {
            row.append( $('<td/>').append( eidProviders(idx) ));
            var buttonCell = $('<td/>');
            new inner.Button( buttonCell )
              .name(texts.sign)
              .href(getSign(idx))
              .attr('id',"link_" + idx)
              .image('icon-pencil')
              .enable(false);
            row.append( buttonCell );
          }
          node.append( signaturesNode );
       }
    }
    
    function addSecondSignatureDiv( node ) {
      if ( FormModule.formNeedsSecondSignature() ) {
        var reqSign = FormModule.getRequiredSignatures()[1];
        var secondSignature = clone('second_signature');
        var signatureFields = secondSignature.find('#secondsignature_fields');
        
        secondSignature.find('#secondsignature-label').text(reqSign.name);
        secondSignature.find('#secondsignaturetext').text(texts.secondSignatureComment);

        secondSignature.find('#name-label').text( texts.name );
        secondSignature.find('#socialsecuritynumber-label').text(texts.socialSecurityNumber);
        secondSignature.find('#phonenumber-label').text(texts.phonenumber);
          
        secondSignature.find('#email-label').text(texts.email);
        secondSignature.find('#emailconfirm-label').text(texts.confirmEmail);
          
        if( !reqSign.mandatory ) {
          var singleSignatureCheckboxLabel = secondSignature.find('#singlesignaturecheckbox-label');
          var isChecked = FormModule.secondSignatureSingleSignature();
          singleSignatureCheckboxLabel.append( reqSign.question );            
          secondSignature.find('#singlesignaturecheckbox').prop('checked', isChecked );
          
          isChecked ? signatureFields.hide() : '';
          
          secondSignature.find('#singlesignaturecheckbox').click( function() {
            var checked = secondSignature.find('#singlesignaturecheckbox').prop('checked');
            RequestModule.setSecondSignatureSingleSignature( checked );
            FormModule.setSecondSignatureSingleSignature( checked );
            if ( checked ) {
              signatureFields.hide( 'slow' );
            } else {
              signatureFields.show( 'slow' );
            }
            toggleSignButton( false );
          });
        } else {
            secondSignature.find('#singlesignaturecheckbox-label').hide();
        }
        
        updateSecondSignatureName( secondSignature.find('#name') );
        setMandatory( secondSignature.find('#name-label'), secondSignature.find('#name') );
        updateSecondSignaturePhoneNumber( secondSignature.find('#phonenumber') );
        setMandatory( secondSignature.find('#phonenumber-label'), secondSignature.find('#phonenumber') );
        updateSecondSignatureSocialSecurityNumber( secondSignature.find('#socialsecuritynumber') );
        setMandatory( secondSignature.find('#socialsecuritynumber-label'), secondSignature.find('#socialsecuritynumber') );
        setHint(secondSignature.find('#socialsecuritynumber-label'), secondSignature.find('#socialsecuritynumber'), texts.socialSecurityNumberHint);
        updateSecondSignatureEmail( secondSignature.find('#emailfields') );
        setMandatory( secondSignature.find('#email-label'), secondSignature.find('#email') );
        updateSecondSignatureEmailConfirm( secondSignature.find('#emailfields') );
        setMandatory( secondSignature.find('#emailconfirm-label'), secondSignature.find('#emailconfirm') );
        
        enableSecondSignatureFields(secondSignature);
        
        node.append( secondSignature );  
     
      }
    }
    
    function validateSecondSignatureEmail( emailField ) {
        var disableSignButton = false;
        var email = emailField.find('#email');
        var emailconfirm = emailField.find('#emailconfirm');
        if ( email.val() !== emailconfirm.val() ) {
            emailField.addClass('error');
            emailField.find('#confirmation-help').append(texts.emailMismatch);
            disableSignButton = true;
        } else if( email.hasClass('validation-error') ) {
            emailField.addClass('error');
            emailField.find('#confirmation-help').append(texts.emailNotAnEmail);
            disableSignButton = true;
        } else {
            emailField.removeClass('error');
        }       
        toggleSignButton( disableSignButton );
    }
    
    function updateSecondSignatureName( nameField ) {
        nameField.val( FormModule.secondSignatureName() );
        nameField.blur( function() {
            var disableSignButton = false;
            var stringDTO = {};
            stringDTO.string = nameField.val();
            try{
                RequestModule.setSecondSignatureName( stringDTO );
                nameField.parent().removeClass('error');
                nameField.parent().find('#name-help').text("");
                FormModule.setSecondSignatureName( stringDTO.string );
            } catch( errorMessage ) {
                FormModule.setSecondSignatureName( "" );
                nameField.parent().addClass('error');
                nameField.parent().find('#name-help').text(texts.invalidformat);
                disableSignButton = true;
            }
            toggleSignButton( disableSignButton );
        });
    }
    
    function updateSecondSignaturePhoneNumber( phoneNumberField ) {
      phoneNumberField.val( FormModule.secondSignaturePhoneNumber() );       
      phoneNumberField.blur( function() {
          var disableSignButton = false;
          var stringDTO = {};
          stringDTO.string = phoneNumberField.val();
          try{
              RequestModule.setSecondSignaturePhoneNumber( stringDTO );
              phoneNumberField.parent().removeClass('error');
              phoneNumberField.parent().find('#phonenumber-help').text("");
              FormModule.setSecondSignaturePhoneNumber( stringDTO.string );
          } catch( errorMessage ) {
              FormModule.setSecondSignaturePhoneNumber( "" );
              phoneNumberField.parent().addClass('error');
              phoneNumberField.parent().find('#phonenumber-help').text(texts.invalidformat);
              disableSignButton = true;
          }
          toggleSignButton( disableSignButton );
      });
    }
    
    function updateSecondSignatureSocialSecurityNumber( socialSecurityField ) {
      socialSecurityField.val( FormModule.secondSignatureSocialSecurityNumber() );       
      socialSecurityField.blur( function() {
          var disableSignButton = false;
          var stringDTO = {};
          stringDTO.string = socialSecurityField.val();
          try{
              RequestModule.setSecondSignatureSocialSecurityNumber( stringDTO );
              socialSecurityField.parent().removeClass('error');
              socialSecurityField.parent().find('#socialsecuritynumber-help').text("");
              FormModule.setSecondSignatureSocialSecurityNumber( stringDTO.string );
          } catch( errorMessage ) {
              FormModule.setSecondSignatureSocialSecurityNumber( "" );
              socialSecurityField.parent().addClass('error');
              socialSecurityField.parent().find('#socialsecuritynumber-help').text(texts.invalidformat);
              disableSignButton = true;
          }
          toggleSignButton( disableSignButton );
      });
    }
    
    function updateSecondSignatureEmail( emailField ) {
        var email = emailField.find('#email')      
        email.val( FormModule.secondSignatureEmail() );       
        email.blur( function() {
            var stringDTO = {};
            stringDTO.string = email.val();
            try{
                RequestModule.setSecondSignatureEmail( stringDTO );
                email.removeClass('validation-error');
                FormModule.setSecondSignatureEmail( stringDTO.string );
            } catch( errorMessage ) {
                FormModule.setSecondSignatureEmail( "" );
                email.addClass('validation-error');
            }
            if (emailField.find('#emailconfirm').val() != "") {
            	validateSecondSignatureEmail( emailField );
            }
        });
        email.focus( function() {
            email.removeClass('validation-error');           
            emailField.find('#confirmation-help').text("");
        });
    }
    
    function updateSecondSignatureEmailConfirm( emailField ) {
        var email = emailField.find('#emailconfirm') 
        email.val( FormModule.secondSignatureEmailConfirm() );
        email.blur( function() {
            FormModule.setSecondSignatureEmailConfirm( email.val());
            validateSecondSignatureEmail( emailField );
        });
        email.focus( function() {
            emailField.find('#confirmation-help').text("");
        });
    }
    
    function setMandatory( node, field ) {
        clone('mandatory', 'mandatory_' + field.attr('id')).appendTo( node );
    }
    
    function setHint( node, field, hintText ) {
        clone('hint', 'hint_' + field.attr('id')).text( ' (' + hintText + ')' ).appendTo( node );
    }
    
    function toggleSignButton( disable ) {
      var selectedEid = FormModule.selectedEid();
      if(typeof selectedEid !== 'undefined' && selectedEid && selectedEid.value !== texts.provider) {
        var button = $('#link_'+selectedEid.name);
        (disable || selectedEid.selectedIndex === 0 || !FormModule.isSecondSignatureReady() ) ? enable( button, false ) : enable( button, true );
      }
    }

    function eidProviders( signatureId ){
    	var comboBox = clone('eidProviders').attr({name: signatureId, id: "eIdProvider_" + signatureId});
    	comboBox.change(function() {
    	      FormModule.setSelectedEid( this );
            var button = $('#link_'+this.name);
            if ( this.selectedIndex == 0 || !FormModule.isSecondSignatureReady() ) {
    		        enable( button, false );
            }

            var value = this.value;
            button.attr('href', function() {
                return this.href.split('?provider=')[0] + "?provider="+value;
            });
            if ( this.selectedIndex !== 0 && FormModule.isSecondSignatureReady() ) {
                enable( button, true );
            }
            var signDTO = {
                transactionId: FormModule.getFormId(),
                tbs: FormModule.getFormTBS(),
                provider: value,
                successUrl: "verify",
                errorUrl: "error"
            };

            var htmlSnippet = RequestModule.sign( signDTO );
            $('#eIdPlugin').html( htmlSnippet ).hide();
    	});
        comboBox.append( $('<option>/').append(texts.provider	) );
        $.each( FormModule.providerLinks(), function(idx, link ) {
         	comboBox.append( $('<option />').attr({value: link.provider}).text(link.text) );
        });
        return comboBox;
    }
    
    function getSignature( name, signatures ) {
        var match;
        $.each( signatures, function( idxSign, signature ) {
            if ( name == signature.name ) match = signature;
        });
        return match;
    }

    function redirect( view ) {
        location.hash = view;
    }

    function showMessages() {
    	if ( messages.info || messages.warning || messages.error ) {
    		var node = clone('alert');
    		var content = $('#inserted_content');
    		var breadcrumb = content.find('ul.breadcrumb');
            node.insertAfter(breadcrumb);  

            if ( messages.info ) {
                node.append( messages.info );
            	node.addClass("alert-info");
            }
	        if ( messages.warning ) {
	            node.append( messages.warning );
	        }
	        if ( messages.error ) {
	            node.append( messages.error );
            	node.addClass("alert-error");
	        }
    	}
        messages = {};
    }

    function addProgressbar( current, pages, contentNode ) {
    	var progress = clone('progress');
    	if ( FormModule.isSecondSigningFlow() ) {
    		progress.append( createProgressItem(current==getIncoming(), getIncoming(), texts.incomingform ));
    	}
    	$.each( pages, function(idx, page){
            progress.append( createProgressItem(idx==current, getPage(idx), page.title) );
        });
        
    	progress.append( createProgressItem(current==getSummary(), getSummary(), texts.summary ));
    	progress.find('li').last().find('#divider').remove();
        contentNode.append(progress);
    }

    function createProgressItem( selected, href, title ){
    	if (selected) {
    		var pageElm = clone('progressItemActive');
    		pageElm.prepend(title);
        	pageElm.addClass("active");
        	return pageElm;
    	} else {
    		var pageElm = clone('progressItem');
    		pageElm.find('#link').append(title).attr({'href':href});
    		return pageElm;
    	}
    }

    inner.Button = function( placeholder ) {
        this.elm = clone('button');
        placeholder.append( this.elm );
        return this;
    }

    inner.Button.prototype.confirm = function( modalElement ) {
        var button = this.elm;
        button.attr({'href':modalElement, 'data-toggle':'modal', 'data-backdrop': false} );
        return this;
    }

    inner.Button.prototype.small = function() {
        this.elm.addClass('btn-small');
        return this;
    }

    inner.Button.prototype.attr = function(key, value) {
        this.elm.attr(key, value);
        return this;
    }

    inner.Button.prototype.addClass = function(clazz) {
        this.elm.addClass(clazz);
        return this;
    }

    inner.Button.prototype.image = function( imageClass ) {
        this.elm.prepend( '<i class="' + imageClass + '"/> ');
        return this;
    }

    inner.Button.prototype.name = function( title ) {
        this.elm.append( title );
        return this;
    }

    inner.Button.prototype.href = function( href ) {
        this.elm.attr('href', href);
        return this;
    }

    inner.Button.prototype.enable = function( _enable ) {
        enable( this.elm, _enable );
        return this;
    }

    inner.Button.prototype.click = function( fn ) {
        this.elm.click( fn );
        return this;
    }

    function enable( button, _enable ) {
        if ( _enable ) {
            button.removeClass('disabled');
            button.removeAttr("onclick");
        } else {
            button.addClass('disabled');
            button.attr("onClick", "return false;");
        }
    }

    function clone( id, newId ) {
        if ( !newId ) return $('#'+id).clone().attr('id', 'inserted_'+id );
    	return $('#'+id).clone().attr('id', newId );
    }

    return inner;
}());
