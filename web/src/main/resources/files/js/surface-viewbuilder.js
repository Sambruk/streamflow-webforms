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

    inner.error = function( message ) {
        var node = clone('ErrorMessage');
        node.text( message );
        displayView( node );
    }

    inner.discard = function( args ) {
        RequestModule.discard();
        FormModule.destroy();

        var node = clone( 'thank_you_div' );
        var message = clone('InfoMessage');
        message.append(texts.formdiscarded );
        message.appendTo( node );
        displayView( node );
    }

    inner.submit = function() {
        RequestModule.submitAndSend();
        var caseName = RequestModule.getCaseName();
        var printUrl = UrlModule.getPrintUrl( FormModule.getFormId() );
        FormModule.destroy();

        var node = clone( 'thank_you_div' );
        var message = clone('SuccessMessage');
        message.append(texts.formSubmittedThankYou).prependTo( node );

        if ( typeof( caseName )!="undefined") {
            node.find('#caseid_message').text(texts.caseidmessage);
            node.find('#caseid').text(caseName);
        }
        new inner.Button( node ).image('print').name(texts.print).href(printUrl).attr('target','_new');
        displayView( node );
    }

    inner.formPage = function( args ) {
        var node = clone( 'form_filling_div' );
        var page = parseInt( args.segment );
        addHeader( node, page );

        FormModule.foldEditPage( page, function(field) { foldEditField(node, field); });

        addFooter( node, page );
        displayView( node );
    }

    function foldEditField( node, field ) {
        FieldTypeModule.createFieldUI( field );

        var fieldNode = clone( 'FormField', 'Field' + field.id ).appendTo( node );
        var fieldHeader = fieldNode.find('div.fieldname');
        clone('label').append(field.name).appendTo( fieldHeader );
        hint( fieldHeader, field );
        mandatory( fieldHeader, field );
        toolTip( fieldHeader, field );
        fieldNode.find('div.fieldvalue').append( field.node );
        field.refreshUI();
    };

    inner.summary = function( args ) {
        var node = clone( 'form_summary_div' );
        addHeader( node, -1 );

        var pages = node.find('#form_pages_summary');
        FormModule.fold( function( page ) { return foldPage(pages, page ) } );
         
    	addSignaturesDiv(node.find('#form_signatures') );
    	addSubmit( addFooter( node, args.segment ) );
        
    	displayView( node );
    }
    
    function foldPage( node, page ) {
    	var pageDiv = clone('form_page_summary').appendTo( node );
    	pageDiv.find('h3').append( clone('link').attr('href',getPage(page.index)).text(page.title) );
    	return function( field ) {
    		foldField( pageDiv.find('#fields_table'), field );
    	}
    }
    
    function foldField( node, field ) {
        if ( field.fieldType == "CommentFieldValue" ) return;
        var row = clone( 'field_summary', field.id ).appendTo( node );
        var tr = $('<td class="field_label"/>').append( field.name + ':');
    	mandatory( tr, field );
        row.append( tr );
        $('<td class="field_value"/>').append( field.formattedValue ).appendTo( row );
    }

    function mandatory( node, field ) {
        if ( field.field.field.mandatory ) {
            clone('mandatory').appendTo( node );
        }
    }

    function hint( node, field ) {
        if ( field.fieldValue.hint ) {
        	clone('hint').text( ' (' + field.fieldValue.hint + ')' ).appendTo( node );
        }
    }

    function toolTip( node, field ) {
        if ( field.field.field.note != "" && field.fieldType != "CommentFieldValue") {
            node.append( clone('tooltip').aToolTip({ fixed: true, tipContent: field.field.field.note }) );
        }
    }

    function addError( button ) {
        var errorTxt = FormModule.errorTxt();
        if ( errorTxt != "" ) {
            button.elm.aToolTip({ tipContent: errorTxt });
        }
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
            verifyDTO.name = FormModule.getRequiredSignature();
            verifyDTO.form = FormModule.getFormTBS();
            RequestModule.verify( verifyDTO );
            FormModule.init( RequestModule.getFormDraft() );
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
            return RequestModule.updateField( fieldDTO );
        } catch( e ) {
            message = { error: e.info };
            showMessages();
            return "";
        }finally{
            image.hide();
        }
    }

    function addHeader( node, page ) {
        var header = clone('form_header');
        header.find('#form_description').text( FormModule.title() );
        appendPageNames( page, FormModule.pages() , header.find('#form_pages') );
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
            return getPage( FormModule.pageCount()-1 );
        } else {
            return getPage( current-1);
        }
    }

    function getNext( segment ) {
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

    function addSignaturesDiv( summarySignatures ) {
        if ( FormModule.requiredSignaturesCount() > 0 ) {
            addSignatures( summarySignatures );
        }
    }
    
    function addSubmit( footer ) {
        var button = new inner.Button( footer ).image('submit').name(texts.submit).href(getSubmit()).enable( FormModule.canSubmit() );
        addError( button );
    }

    function addSignatures( summarySignatures ) {
    	    	
    	summarySignatures.find("#form_signatures_heading").append( $('<h3 />').text( texts.signatures ) );

    	var column_1 = summarySignatures.find("#form_signatures_column_1");
    	var column_2 = summarySignatures.find("#form_signatures_column_2");

    	$.each( FormModule.getRequiredSignatures(), function(idx, reqSign ) {
            column_1.append( clone('signature_label').append(reqSign.name + ":") );
            var signatureValue = clone('signature');
            var signature = getSignature( reqSign.name, FormModule.getSignatures() );
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

    inner.Button.prototype.click = function( fn ) {
        this.elm.click( fn );
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

    function clone( id, newId ) {
        if ( !newId ) return $('#'+id).clone().attr('id', 'inserted_'+id );
    	return $('#'+id).clone().attr('id', newId );
    }

    return inner;
}());
