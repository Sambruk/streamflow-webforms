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



var View = (function() {
    var inner = {};
    var messages;
    var formState;

    inner.discard = function( args ) {
        RequestModule.discard();
        formState.formDraft = null;
        formState.formSignatures = null;

        var node = clone( 'thank_you_div' );
        var message = clone('InfoMessage');
        message.append(texts.formdiscarded );
        message.appendTo( node );
        displayView( node );
    }

    inner.submit = function( args, caseName, formId, caseUrl ) {
        RequestModule.submitAndSend();
        var caseName = RequestModule.getCaseName();
        var formId = formState.formDraft.form;
        var caseUrl = RequestModule.getCaseUrl();
        formState.formDraft = null;
        formState.formSignatures = null;

        var node = clone( 'thank_you_div' );
        var message = clone('SuccessMessage');
        message.append(texts.formSubmittedThankYou);
        message.prependTo( node );
        
        if ( typeof( caseName )!="undefined") {
            var caseidmessage = node.find('#caseid_message');
            caseidmessage.text(texts.caseidmessage);
            
            var caseid = node.find('#caseid');
            caseid.text(caseName);
        }
        var url = caseUrl +'submittedforms/'+ formId + '/generateformaspdf';
        createButton({image: 'print', name:texts.print, href:url}).attr('target','_new').appendTo( node );
        displayView( node );
    }

    inner.page = function( args ) {
        var page = parseInt( args.segment );
        var pages = formState.formDraft['pages'];
        var node = clone( 'form_filling_div' );

        node.find('#form_description').text( formState.formDraft.description );
        var toolbar = node.find('#form_buttons_div');

        toolbar.append( createButton({image:'previous', name:texts.previous, href:'#'+(page-1), disabled:firstPage(page)} ) );
        var nextPage = page+1
        if (page == pages.length -1) {
        	nextPage = "summary";
        }
        toolbar.append( createButton({image:'next',name:texts.next,href:'#'+nextPage, disabled:false } ) );
        toolbar.append( createButton({image:'discard',name:texts.discard,href:'#discard', confirm:texts.confirmDiscard} ) );

        appendPageNames( page, pages, node.find('#form_pages') );
        var fieldList = node.find('#form_table_body');
        $.each( pages[ page ].fields, function(idx, field){
            FieldTypeModule.render( field, fieldList );
        });
        displayView( node );
    }

    inner.summary = function( args ) {
        var description = formState.formDraft.description;
        var pages = formState.formDraft.pages;
        //View.show( 'form_summary_div' , View.summary, {description: description, pages:pages, signatures: signatures()});
        var node = clone( 'form_summary_div' );

        var errorString = "";

        node.find('#form_description').text( args.description );
        var summaryPages = node.find('#form_pages_summary');
        var summarySignatures = node.find('#form_signatures');
        var summaryStatus = node.find('#form_submission_status');

        $.each( pages, function(idx, page){
            var pageDiv = clone('form_page_summary');

            pageDiv.find('h3').append( clone('link').attr('href','#'+idx).text(page.title) );
            var ul = pageDiv.find('ul');
            var table = clone('fields_table');
            $.each( page.fields, function( fieldIdx, field ){
                FieldTypeModule.displayReadOnlyField( field, table );
                if ( field.field.mandatory && !field.value) {
                    errorString += texts.missingfield + " '"+field.field.description+"' <br>";
                }
            });
            ul.append(table);
            summaryPages.append( pageDiv );
        });

        var formOk = (errorString=="");
        if ( formState.formSignatures.length > 0 ) {
            addSignatures( summarySignatures, !formOk );

            formOk = formOk && ( formState.formSignatures.length == formState.formDraft.signatures.length );
        }

        appendPageNames( -1, pages, node.find('#form_pages') );

        summaryStatus.append( createButton({image:'previous', name:texts.previous, href:'#'+(pages.length-1), disabled:false} ) );
        summaryStatus.append( createButton({image:'next',name:texts.next,href:'#', disabled:true } ) );
        summaryStatus.append( createButton({image:'discard',name:texts.discard,href:'#discard', confirm:texts.confirmDiscard} ) );

        var button = createButton( {image:'submit', name:texts.submit, href:'#submit', disabled:!formOk });
        summaryStatus.append( button );

        if ( errorString != "" ) {
            button.aToolTip({ tipContent: errorString });
        }
        displayView( node );
    }

    inner.sign = function( args ) {
        var retVal = doSign();
        if ( retVal != 0 ) {
            throw { warning: texts.signatureAborted +retVal, redirect:'summary' };
        } else {
            // strip parameters
            var verifyDTO = {};
            $.each( $('#app').find('form > input:hidden'), function(idx, value ) {
                if ( value.name ) {
                    verifyDTO[ value.name ] = value.value;
                }
            });
            verifyDTO.name = formState.requiredSignatureName;
            verifyDTO.form = getFormTBS();
            RequestModule.verify( verifyDTO );
            formState.formDraft = RequestModule.getFormDraft();
        }
        // signing success redirect to summary
        throw {info:texts.formSigned, redirect:'summary'};
    }

    function addSignatures( summarySignatures, disabled ) {
    	    	
    	var heading = summarySignatures.find("#form_signatures_heading");
    	var signature_content = summarySignatures.find("#form_signatures_content");
    	var column_1 = summarySignatures.find("#form_signatures_column_1");
    	var column_2 = summarySignatures.find("#form_signatures_column_2");
    	
        heading.append( $('<h3 />').text( texts.signatures ) );

    	$.each( formState.formSignatures, function(idx, reqSign ) {
            var signatureLabel;
            var signatureValue;
        	signatureLabel = clone('signature_label');
        	signatureLabel.append(reqSign.name + ":");
            var signature = getSignature( reqSign.name, formState.formDraft.signatures);
            if ( signature ) {
            	signatureValue = clone('signature_value_signed');
            	signatureValue.append(signature.signerName);
            } else {
            	signatureValue = clone('signature_value_unsigned');
            	var button = createSmallButton({image:"pencil_small", disabled:true, name:texts.sign, href:'#summary/'+idx})
            	var linkId = "link_" + idx;
            	button.attr({id:linkId});
            	signatureValue.append( createEidProviderCombobox(idx));
            	signatureValue.append( "&nbsp;&nbsp;").append( button);
            }
            column_1.append( signatureLabel );
            column_2.append( signatureValue );
        });
        summarySignatures.show();
    }

    function createEidProviderCombobox( signatureId ){
    	var combobox = clone('comboBoxEidProviders');
    	combobox.attr({name: signatureId, id: "eIdProvider_" + signatureId});
    	combobox.change(function() {
    		var value = this.value;
	    	$("#link_"+this.name).attr('href', function() {
	    		var list = this.href.split('?provider=');
	    		return list[0] + "?provider="+value
	    	});
	    	enableSmallButton("#link_"+this.name);
	    	
	    	var signDTO = {
                transactionId: formState.formDraft.form,
                tbs: getFormTBS(),
                provider: value,
                successUrl: "verify",
                errorUrl: "error"
          	};

            var htmlSnippet = RequestModule.sign( signDTO );
            $('#eIdPlugin').html( htmlSnippet ).hide();
    	});
        combobox.append( $('<option>/').append(texts.provider	) );
        $.each(formState.eIdProviders.links, function(idx, link ) {
         	combobox.append( $('<option />').attr({value: link.provider}).text(link.text) );
        });
        return combobox;
    }
    
    function getSignature( name, signatures ) {
        var match;
        $.each( signatures, function( idxSign, signature ) {
            if ( name == signature.name ) match = signature;
        });
        return match;
    }

    function getFormTBS(){
        var tbs = "";
        $.each( formState.formDraft.pages, function(idx, page) {
            $.each( page.fields, function(fieldIdx, field) {
                // filter fieldtype comment
                tbs += field.field.description + ' = ' + field.value + '. ';
            })
        })
        return tbs;
    }

    inner.updateField = function(fn, fieldId, fieldValue) {
        var fieldDTO = {
            field: fieldId,
            value: fieldValue
        };
        var image = $('#Field'+fieldId+' .fieldwaiting > img').show();
        try{
            return fn( fieldDTO );
        } catch( e ) {
            message = { error: e.info };
            showMessages();
            return "";
        }finally{
            image.hide();
        }
    }

    inner.init = function( state ) {
        formState = state;
    }

    function displayView( node ) {
        $('#app').empty().append( node );
    }

    function redirect( view ) {
        location.hash = '#'+view;
    }

    inner.runView = function( view ) {
        try {
            view();
            showMessages();
            $(window).scrollTop( 0 );
        } catch ( e ) {
            messages = {};
            if ( e.info ) messages.info = e.info;
            if ( e.warning ) messages.warning = e.warning;
            if ( e.error ) messages.error = e.error;
            if ( e.redirect ) {
                redirect( e.redirect );
            } else {
                redirect( 'summary' );
            }
        }
    }

    function showMessages() {
        if ( messages && messages.info ) {
            $('#app').prepend( clone( 'InfoMessage' ).append( messages.info ) );
        }
        if ( messages && messages.warning ) {
            $('#app').prepend( clone( 'WarningMessage' ).append( messages.warning ) );
        }
        if ( messages && messages.error ) {
            $('#app').prepend( clone( 'ErrorMessage' ).append( messages.error ) );
        }
        messages = null;
    }

    function appendPageNames( current, pages, pagesNode )
    {
        $.each( pages, function(idx, page){
        	if (idx==current) {
        		var styleClass = "selected";
        	}
            pagesNode.append( createBreadcrumb({styleClass:styleClass, href:"#"+idx, title:page.title}) );
        });
        var styleClass = "summary";
        if (current == -1) {
        	styleClass = "summary_selected"
        } 
        pagesNode.append( createBreadcrumb({styleClass:styleClass, href:"#summary", title:texts.summary}) );
    }

    function createBreadcrumb( map){
    	var pageElm = $('<li />');
        if ( map.styleClass ) {
            pageElm.attr({"class": map.styleClass});
        }
        pageElm.append(clone('link').attr({'href':map.href, "class":"breadcrumb"}).append(map.title));
        return pageElm;
    }

    function createButton( map ) {
        return makeButton(map, false);
    }

    function createSmallButton( map ) {
        return makeButton(map, true);
    }
    
    function makeButton( map, small ) {
        var image, button;
        if ( map.image ) {
            image = clone( map.image );
        }
        if ( !map.disabled ) {
            button = clone('link').attr({'href':map.href,"class":"button positive"});
            small? button.attr("class", "smallbutton positive"):button.attr("class","button positive");
            if ( map.confirm ) {
                setConfirm( button, map.confirm );
            }
        } else {
            if ( image ) image.fadeTo(0, 0.4);
            button = (small?clone('disabledsmall'):clone('disabled')).attr('href', map.href);
            //button = clone('disabled').attr('href', map.href);
        }
        return button.append( image ).append( map.name );
    }

    function setConfirm( button, confirmMessage ) {
        button.attr("onClick", "return false;");
        button.click( function() {
            $(this).fastConfirm({
                position: "right",
                proceedText: "Ja",
                cancelText: "Nej",
                questionText: confirmMessage,
                onProceed: function(trigger) {
                    location.hash = button.attr('href');
                }
            });
        });
    }

    function enableSmallButton(id){
    	$(id).attr('class', 'smallbutton positive');
    	$(id).find('img').removeAttr('style');
    	$(id).removeAttr("onclick");
    }

    function firstPage( page ) {
        return ( page == 0);
    }

    function clone( templateId ) {
        return $('#'+templateId).clone().attr('id', 'inserted_'+templateId );
    }

    return inner;
}());
