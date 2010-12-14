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



var Builder = (function() {
    var inner = {};
    var messages;

    inner.formSubmitted = function( args, caseName, formId, caseUrl ) {
        var message = clone('SuccessMessage');
        message.append(texts.formSubmittedThankYou);
        message.prependTo(args.node);
        
        if ( typeof( args.caseName )!="undefined") {
            var caseidmessage = args.node.find('#caseid_message');
            caseidmessage.text(texts.caseidmessage);
            
            var caseid = args.node.find('#caseid');
            caseid.text(args.caseName);
        }
        var url = args.caseUrl +'submittedforms/'+ args.formId + '/generateformaspdf';
        createButton({image: 'print', name:texts.print, href:url}).attr('target','_new').appendTo(args.node);
    }

    inner.page = function( args ) {
        args.node.find('#form_description').text( args.description );
        var toolbar = args.node.find('#form_buttons_div');

        toolbar.append( createButton({image:'previous', name:texts.previous, href:'#'+(args.page-1), disabled:firstPage(args.page)} ) );
        var nextPage = args.page+1
        if (args.page == args.pages.length -1) {
        	nextPage = "summary";
        }
        toolbar.append( createButton({image:'next',name:texts.next,href:'#'+nextPage, disabled:false } ) );
        toolbar.append( createButton({image:'discard',name:texts.discard,href:'#discard', confirm:texts.confirmDiscard} ) );

        appendPageNames( args.page, args.pages, args.node.find('#form_pages') );
        var fieldList = args.node.find('#form_table_body');
        $.each( args.pages[ args.page ].fields, function(idx, field){
            FieldTypeModule.render( field, fieldList );
        });
    }

    function addSignatures( summarySignatures, disabled, signatureArgs ) {
    	    	
    	var heading = summarySignatures.find("#form_signatures_heading");
    	var signature_content = summarySignatures.find("#form_signatures_content");
    	var column_1 = summarySignatures.find("#form_signatures_column_1");
    	var column_2 = summarySignatures.find("#form_signatures_column_2");
    	
        heading.append( $('<h3 />').text( texts.signatures ) );

    	$.each( signatureArgs.required, function(idx, reqSign ) {
            var signatureLabel;
            var signatureValue;
        	signatureLabel = clone('signature_label');
        	signatureLabel.append(reqSign.name + ":");
            var signature = getSignature( reqSign.name, signatureArgs.addedSignatures);
            if ( signature ) {
            	signatureValue = clone('signature_value_signed');
            	signatureValue.append(signature.signerName);
            } else {
            	signatureValue = clone('signature_value_unsigned');
            	var button = createSmallButton({image:"pencil_small", disabled:true, name:texts.sign, href:'#summary/'+idx})
            	var linkId = "link_" + idx;
            	button.attr({id:linkId});
            	signatureValue.append( createEidProviderCombobox(idx, signatureArgs));
            	signatureValue.append( "&nbsp;&nbsp;").append( button);
            }
            column_1.append( signatureLabel );
            column_2.append( signatureValue );
        });
        summarySignatures.show();
    }

    function createEidProviderCombobox( signatureId, signatureArgs ){
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
                transactionId: signatureArgs.transactionId,
                tbs: signatureArgs.tbs,
                provider: value,
                successUrl: "verify",
                errorUrl: "error"
          	};

            var htmlSnippet = RequestModule.sign( signDTO );
            $('#eIdPlugin').html( htmlSnippet ).hide();
    	});
        combobox.append( $('<option>/').append(texts.provider	) );
        $.each(signatureArgs.eIdProviders, function(idx, link ) {
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

    inner.summary = function( args ) {
        var errorString = "";
        args.node.find('#form_description').text( args.description );
        var summaryPages = args.node.find('#form_pages_summary');
        var summarySignatures = args.node.find('#form_signatures');
        var summaryStatus = args.node.find('#form_submission_status');

        $.each( args.pages, function(idx, page){
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
        if ( args.signatures ) {
            addSignatures( summarySignatures, !formOk, args.signatures );

            formOk = formOk && ( args.signatures.required.length == args.signatures.addedSignatures.length );
        }

        appendPageNames( -1, args.pages, args.node.find('#form_pages') );
        
        summaryStatus.append( createButton({image:'previous', name:texts.previous, href:'#'+(args.pages.length-1), disabled:false} ) );
        summaryStatus.append( createButton({image:'next',name:texts.next,href:'#', disabled:true } ) );
        summaryStatus.append( createButton({image:'discard',name:texts.discard,href:'#discard', confirm:texts.confirmDiscard} ) );
        
        var button = createButton( {image:'submit', name:texts.submit, href:'#submit', disabled:!formOk });
        summaryStatus.append( button );

        if ( errorString != "" ) {
            button.aToolTip({ tipContent: errorString });
        }
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


    inner.discard = function( args ) {
        var message = clone('InfoMessage');
        message.append(texts.formdiscarded );
        message.appendTo(args.node);
    }

    inner.show = function( id, fn, args ) {
        var app = $('#app');
        app.empty();
        args.node = clone( id );
        fn( args );
        app.append( args.node );
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
        var image, button;
        if ( map.image ) {
            image = clone( map.image );
        }
        if ( !map.disabled ) {
            button = clone('link').attr({'href':map.href,"class":"button positive"});
            if ( map.confirm ) {
                setConfirm( button, map.confirm );
            }
        } else {
            if ( image ) image.fadeTo(0, 0.4);
            button = clone('disabled');
        }
        return button.append( image ).append( map.name );
    }

    function createSmallButton( map ) {
        var image, button;
        if ( map.image ) {
            image = clone( map.image );
        }
        if ( !map.disabled ) {
            button = clone('link').attr({'href':map.href,"class":"smallbutton positive"});
        } else {
            if ( image ) image.fadeTo(0, 0.4);
            button = clone('disabledsmall').attr('href',map.href);
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
