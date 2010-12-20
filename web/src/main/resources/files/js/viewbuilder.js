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
    var messages = {};
    var formState;

    inner.error = function( message ) {
        var node = clone('ErrorMessage');
        node.text( message );
        displayView( node );
    }

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

    inner.submit = function() {
        RequestModule.submitAndSend();
        var caseName = RequestModule.getCaseName();
        var formId = formState.formDraft.form;
        formState.formDraft = null;
        formState.formSignatures = null;

        var node = clone( 'thank_you_div' );
        var message = clone('SuccessMessage');
        message.append(texts.formSubmittedThankYou).prependTo( node );
        
        if ( typeof( caseName )!="undefined") {
            var caseidmessage = node.find('#caseid_message');
            caseidmessage.text(texts.caseidmessage);
            
            var caseid = node.find('#caseid');
            caseid.text(caseName);
        }
        var url = RequestModule.getPrintUrl( formId );
        new inner.Button( node ).image('print').name(texts.print).href(url).attr('target','_new');
        displayView( node );
    }

    inner.formPage = function( args ) {
        var node = clone( 'form_filling_div' );
        addHeader( node, args.segment );

        var page = parseInt( args.segment );
        $.each( formState.formDraft.pages[ page ].fields, function(idx, field){
            FieldTypeModule.render( field, node );
        });

        addFooter( node, args.segment );
        displayView( node );
    }

    inner.summary = function( args ) {
        var node = clone( 'form_summary_div' );
        addHeader( node, -1 );

        var summaryPages = node.find('#form_pages_summary');
        var errorString = "";
        $.each( formState.formDraft.pages, function(idx, page){
            var pageDiv = clone('form_page_summary');

            pageDiv.find('h3').append( clone('link').attr('href',getPage(idx)).text(page.title) );
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

        var footer = addFooter( node, args.segment );

	    var formOk = addSignaturesDiv(node.find('#form_signatures'), errorString );
	    addSubmit( footer, formOk, errorString );
        displayView( node );
    }

    inner.sign = function( args ) {
        var retVal = doSign();
        if ( retVal != 0 ) {
            throw { warning: texts.signatureAborted +retVal, redirect:getSummary() };
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
            messages = {};
            if ( e.info ) messages.info = e.info;
            if ( e.warning ) messages.warning = e.warning;
            if ( e.error ) messages.error = e.error;
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
            return RequestModule.updateField( fieldDTO );
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

    function addHeader( node, page ) {
        var header = clone('form_header');
        header.find('#form_description').text( formState.formDraft.description );
        appendPageNames( page, formState.formDraft.pages, header.find('#form_pages') );
        node.prepend( header );
    }

    function addFooter( node, page ) {
        var footer = clone('form_footer');
	    new inner.Button( footer ).image('previous').name(texts.previous).href( getPrevious( page ) ).enable( page!=0 );
	    new inner.Button( footer ).image('next').name(texts.next).href(getNext( page ) ).enable( page!='summary' );
	    new inner.Button( footer ).image('discard').name(texts.discard).href(getDiscard()).confirm(texts.confirmDiscard);
        node.append( footer );
        return footer;
    }

    function getPrevious( segment ) {
        var current = parseInt( segment );
        if ( isNaN( current ) ) {
            var pages = formState.formDraft.pages;
            return getPage( pages.length-1 );
        } else {
            return getPage( current-1);
        }
    }

    function getNext( segment ) {
        var current = parseInt( segment );
        var pages = formState.formDraft.pages;
        if ( isNaN( current ) || (current == pages.length-1 ) ) {
            return getSummary();
        } else {
            return getPage( current+1 );
        }
    }

    function getPage( page ) {
        return '#' + Contexts.findUrl( inner.formPage, [page]);
    }

    function getSummary() {
        return '#' + Contexts.findUrl( inner.summary );
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

    function addSignaturesDiv( summarySignatures, errorString ) {
        var formOk = (errorString=="");
        if ( formState.formSignatures.length > 0 ) {
            addSignatures( summarySignatures );
            return formOk && ( formState.formSignatures.length == formState.formDraft.signatures.length );
        }
	    return formOk;
    }
    
    function addSubmit( footer, formOk, errorString ) {
        var button = new inner.Button( footer ).image('submit').name(texts.submit).href(getSubmit()).enable(formOk);

        if ( errorString != "" ) {
            button.elm.aToolTip({ tipContent: errorString });
        }
    }

    function addSignatures( summarySignatures ) {
    	    	
    	summarySignatures.find("#form_signatures_heading").append( $('<h3 />').text( texts.signatures ) );

    	var column_1 = summarySignatures.find("#form_signatures_column_1");
    	var column_2 = summarySignatures.find("#form_signatures_column_2");

    	$.each( formState.formSignatures, function(idx, reqSign ) {
            column_1.append( clone('signature_label').append(reqSign.name + ":") );
            var signatureValue = clone('signature');
            var signature = getSignature( reqSign.name, formState.formDraft.signatures);
            if ( signature ) {
            	signatureValue.append(signature.signerName);
            } else {
            	signatureValue.attr("class", "signature_value_unsigned").append( eidProviders(idx) ).append( "&nbsp;&nbsp;");
            	new inner.Button( signatureValue )
            	    .image('pencil_small')
            	    .name(texts.sign)
            	    .href(getSign(idx))
            	    .small()
            	    .attr('id',"link_" + idx)
            	    .enable(false);
            }
            column_2.append( signatureValue );
        });
        summarySignatures.show();
    }

    function eidProviders( signatureId ){
    	var comboBox = clone('eidProviders').attr({name: signatureId, id: "eIdProvider_" + signatureId});
    	comboBox.change(function() {
            var button = $('#link_'+this.name);
            if ( this.selectedIndex == 0 ) {
    		    enable( button, false );
    		    return;
            }

            var value = this.value;
            button.attr('href', function() {
                return this.href.split('?provider=')[0] + "?provider="+value;
            });
            enable( button, true );

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
        comboBox.append( $('<option>/').append(texts.provider	) );
        $.each(formState.eIdProviders.links, function(idx, link ) {
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

    function displayView( node ) {
        $('#app').empty().append( node );
    }

    function redirect( view ) {
        location.hash = view;
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
        messages = {};
    }

    function appendPageNames( current, pages, pagesNode ) {
        var styleClass;
        $.each( pages, function(idx, page){
        	styleClass = idx==current ? "selected" : "";
            pagesNode.append( createBreadcrumb(styleClass, getPage(idx), page.title) );
        });
        styleClass = current==-1 ? "summary_selected" : "summary";
        pagesNode.append( createBreadcrumb(styleClass, getSummary(), texts.summary) );
    }

    function createBreadcrumb( style, href, title ){
    	var pageElm = $('<li />').attr("class", style);
        pageElm.append(clone('link').attr({'href':href, "class":"breadcrumb"}).append(title));
        return pageElm;
    }

    inner.Button = function( placeholder ) {
        this.elm = clone('button');
        placeholder.append( this.elm );
        return this;
    }

    inner.Button.prototype.confirm = function( message ) {
        var button = this.elm;
        button.attr("onClick", "return false;");
        button.click( function() {
            $(this).fastConfirm({
                position: "right",
                proceedText: "Ja",
                cancelText: "Nej",
                questionText: message,
                onProceed: function(trigger) {
                    location.hash = button.attr('href');
                }
            });
        });
    }

    inner.Button.prototype.small = function() {
        this.elm.addClass('small');
        return this;
    }

    inner.Button.prototype.attr = function(key, value) {
        this.elm.attr(key, value);
        return this;
    }

    inner.Button.prototype.image = function( id ) {
        this.elm.prepend( clone( id ) );
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

    function enable( button, _enable ) {
        if ( _enable ) {
            button.removeClass('disabled').addClass('positive');
            button.find('img').removeAttr('style');
            button.removeAttr("onclick");
        } else {
            button.removeClass('positive').addClass('disabled');
            button.find('img').fadeTo(0, 0.4);
            button.attr("onClick", "return false;");
        }
    }

    function clone( templateId ) {
        return $('#'+templateId).clone().attr('id', 'inserted_'+templateId );
    }

    return inner;
}());
