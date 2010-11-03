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


jQuery(document).ready(function()
{
    function login() {
        RequestModule.verifyAccessPoint();
        RequestModule.selectEndUser();
        var data = RequestModule.getUser();
        RequestModule.createUserUrl( data.entity );
        setupContexts();
        setupView();
    }

    function setupCaseAndForm() {
        if ( state.formDraft ) return;
        var data = RequestModule.getCaseForm();
        if ( data.caze && data.form )
        {
            RequestModule.createCaseUrl( data.caze );
            RequestModule.createFormDraftUrl( data.form );
            state.formDraft = RequestModule.getFormDraft();
        } else {
            parseEvents( RequestModule.createCaseWithForm() );
        }
    }

    updateFieldValue = function(fieldId, fieldValue) {
        var image = $('#'+fieldId+' .fieldwaiting > img');
        image.show();
        var fieldDTO = {
            field: fieldId,
            value: fieldValue
        };

        var updated = parseEvents( RequestModule.updateField( fieldDTO ) );
        image.hide();
        return updated;
    }

    function submitAndSend() {
        RequestModule.submitAndSend();
        var caseName = RequestModule.getCaseName();
        var formId = state.formDraft.form;
        var caseUrl = RequestModule.getCaseUrl();
        state.formDraft = null;
        insertFormSubmitted( caseName, formId, caseUrl );
    }

    function discard() {
        RequestModule.discard();
        state.formDraft = null;
        insertDiscard();
    }

    function gotoProviders( index ) {
        state.requiredSignatureName = state.formSignatures[ index ].name;
        insertProviders( state.eIdProviders.links );
    }

    function gotoSummary() {
        var description = state.formDraft.description;
        var pages = state.formDraft.pages;
        var signatures = state.formSignatures.length != 0;
        insertSummary( description, pages, signatures );
    }

    function gotoSignatures() {
        var hasSignature = state.formDraft.signatures.length > 0;
        var required = state.formSignatures;
        insertRequiredSignatures( hasSignature, required );
    }

    function setupSignatures() {
        if ( state.formSignatures ) return;
        state.formSignatures = RequestModule.getFormSignatures();
    }

    function setupProviders() {
        if ( state.eIdProviders ) return;
        state.eIdProviders = RequestModule.getProviders();
    }

    function getFormTBS() {
        var tbs = "";
        $.each( state.formDraft.pages, function(idx, page) {
            $.each( page.fields, function(fieldIdx, field) {
                // filter fieldtype comment
                tbs += field.field.description + ' = ' + field.value + '. ';
            })
        })
        return tbs;
    }

    function parseEvents( eventMap ) {
        var match = false;
        $.each( eventMap.events, function( idx, event){
            if ( event.name == "createdCase")
            {
                var caseId = $.parseJSON(event.parameters)['param1'];
                RequestModule.createCaseUrl( caseId );
                match = true;
            } else if ( event.name == "changedFormDraft" )
            {
                RequestModule.createFormDraftUrl( event.entity );
                state.formDraft = $.parseJSON($.parseJSON(event.parameters)['param1']);
                match = true;
            } else if ( event.name == "changedFieldValue" ) {
                var fieldId = $.parseJSON(event.parameters)['param1'];
                var fieldValue = $.parseJSON(event.parameters)['param2'];

                var onPage = updateFormDraftField( fieldId, fieldValue );
                if ( onPage == parseInt( state.hash.substring(1) )) {
                    FieldTypeModule.setFieldValue( fieldId, fieldValue );
                }
                match = true;
            }
        });
        return match;
    }

    function updateFormDraftField( fieldId, fieldValue ) {
        var pageNumber = -1;
        $.each( state.formDraft.pages, function(idx, page) {
            $.each( page.fields, function(fieldIdx, field) {
                if ( field.field.field == fieldId ) {
                    field.value = fieldValue;
                    pageNumber = idx;
                }
            });
        });
        return pageNumber;
    }

    function lastPage( page, pages ) {
        return ( page == pages.length -1);
    }

    function firstPage( page ) {
        return ( page == 0);
    }

    function performSign( provider ) {
        var tbs = getFormTBS();

        var signDTO = {
            transactionId: state.formDraft.form,
            tbs: tbs,
            provider: provider,
            successUrl: "#success",
            errorUrl: "#failed"
        };

        var htmlSnippet = RequestModule.sign( signDTO );
        $('#app').html( htmlSnippet ).hide();

        doSign();

        // strip parameters
        var verifyDTO = {};
        $.each( $('#app').find('form > input:hidden'), function(idx, value ) {
            verifyDTO[ value.name ] = value.value;
        });
        var signatureDTO = RequestModule.verify( verifyDTO );

        signatureDTO.form = tbs;
        signatureDTO.encodedForm = verifyDTO.encodedTbs;
        signatureDTO.provider = provider;
        signatureDTO.name = state.requiredSignatureName;
        RequestModule.addSignature( signatureDTO );
        state.formDraft = RequestModule.getFormDraft();

        $('#app').show();
        redirect("signatures");
    }

    /**
     * Functions that creates DOM nodes and inserts them
     */
    function createButton( name, href, disabled ) {
        if ( !disabled ) {
            var img = clone(name);
            return clone('link').attr({'href':href,"class":"button"}).append( img ).append( texts[ name ] );
        } else {
            var img = clone(name).fadeTo(0, 0.4);
            return clone('disabled').append( img ).append( texts[ name ] );
        }
    }

    function insert( node ) {
        $('#app').empty().append( node );
    }

    function insertFormSubmitted( caseName, formId, caseUrl ) {
        var node = clone('thank_you_div');
        var message = node.find('#end_message');
        message.text(texts.formSubmittedThankYou);

        if ( typeof( caseName )!="undefined") {
            message.append( '<br/> ' + texts.caseidmessage + ' ' + caseName );
        }
        var url = caseUrl +'submittedforms/'+ formId + '/generateformaspdf';
        var print_node = clone('print');
        var print_url = print_node.find("#print_link").attr("href", url );
        print_node.appendTo(node);

        insert( node );
    }

    function insertPage( page, pages, description ) {
        var formFillingDiv = clone('form_filling_div');
        formFillingDiv.find('#form_description').text( description );
        var toolbar = formFillingDiv.find('#form_buttons_div');

        toolbar.append( createButton('previous', '#'+(page-1), firstPage(page) ) );
        toolbar.append( createButton('next', '#'+(page+1), lastPage(page, pages) ) );
        toolbar.append( createButton('discard', '#discard') );
        toolbar.append( createButton('summary', '#summary' ) );

        appendPageNames( page, pages, formFillingDiv.find('#form_pages') );
        var fieldList = formFillingDiv.find('#form_table_body');
        $.each( pages[ page ].fields, function(idx, field){
            FieldTypeModule.render( field, fieldList );
        });
        insert( formFillingDiv );
    }

    function appendPageNames( current, pages, pagesNode )
    {
        $.each( pages, function(idx, page){
            var pageElm = $('<li />').text(page.title );
            if ( current == idx ) {
                pageElm.attr({"class": "selected"});
            }
            pagesNode.append( pageElm );
            if ( idx < pages.length - 1 ) {
                pagesNode.append( $('<li />').text('>>') );
            }
        });
    }

    function insertProviders( eIdProviders ) {
        var div = clone('form_signing_div');
        var providers = div.find('#signing_providers');
        $.each( eIdProviders, function(idx, link ) {
            providers.append( clone('link').attr({"class":"button", "href":location.hash+'/'+ link.href.split('=')[1] }).text( link.text ) );
            providers.append( '<br/>');
        });
        insert( div );
    }

    function insertRequiredSignatures( hasSignature, required ) {
        var requiredSignatures = clone('required_signatures_div');
        var list = $('<ul />');

        var submitDisabled = true;
        $.each( required, function(idx, signature) {
            var button;
            // for now only allow one signature
            if ( hasSignature ) {
                submitDisabled = false;
                var img = clone('signed').fadeTo(0, 0.4);
                button = clone('disabled').append( img ).append( signature.name );
            } else {
                button = clone('link').attr({'href':'#signatures/'+idx, "class":"button"}).removeAttr('id').text( signature.name );
            }
            list.append( $('<li />').append( button ) );
        });

        requiredSignatures.find('#required_signatures_list').append( list );
        requiredSignatures.append( createButton( 'summary', '#summary' ) );
        requiredSignatures.append( createButton( 'submit', '#submit', submitDisabled ) );
        insert( requiredSignatures );
    }

    function insertSummary( description, pages, signatures ) {
        var summaryDiv = clone('form_summary_div');
        var errorString = "";
        summaryDiv.find('#form_description').text( description );
        var summaryPages = summaryDiv.find('#form_pages_summary');
        var summaryStatus = summaryDiv.find('#form_submission_status');

        $.each( pages, function(idx, page){
            var pageDiv = clone('form_page_summary');

            pageDiv.find('h3').append( clone('link').attr('href','#'+idx).text(page.title) );
            var ul = pageDiv.find('ul');
            $.each( page.fields, function( fieldIdx, field ){
                FieldTypeModule.displayReadOnlyField( field, ul );
                if ( field.field.mandatory && !field.value) {
                    errorString += texts.missingfield + " '"+field.field.description+"' <br>";
                }
            });
            summaryPages.append( pageDiv );
        });
        var formOk = (errorString=="");
        var button;
        if ( signatures ) {
            button = createButton( 'signatures', '#signatures', !formOk);
        } else {
            button = createButton( 'submit', '#', !formOk);
        }

        summaryStatus.append( button );
        if ( !formOk ) {
            button.aToolTip({ tipContent: errorString });
        }
        insert( summaryDiv );
    }

    function insertDiscard() {
        var node = clone('thank_you_div');
        node.find('#end_message').text( texts.formdiscarded );
        insert( node );
    }

    function translate( )
    {
        $('*', 'body')
            .andSelf()
            .contents()
            .filter(function(){
                return this.nodeType === 3;
            })
            .filter(function(){
                // Only match when contains '$' anywhere in the text
                return this.nodeValue.indexOf( '$' ) != -1;
            })
            .each(function(){
                var words = this.nodeValue.split(' ');
                $.each( words, function(idx, word){
                    if ( word.length > 0 && word.charAt(0)=='$' )
                    {
                        words[ idx ] = texts[ $.trim( word.substring(1) ) ];
                    }
                });
                this.nodeValue = words.join(' ');
            });
    }


    function clone( templateId, insertedId ) {
        if ( !insertedId ) {
            return $('#'+templateId).clone().attr('id', 'inserted_'+templateId );
        } else {
            return $('#'+templateId).clone().attr('id', insertedId );
        }
    }

    function redirect( view ) {
        location.hash = '#'+view;
    }

    error = function( message ) {
        insert( clone('ErrorMessage').text( message ) );
        throw message;
    }

    function gotoPage( page ) {
        if ( !page ) {
            redirect('0');
        } else {
            var pages = state.formDraft['pages'];
            insertPage( parseInt( page ), pages, state.formDraft.description );
        }
    }

    function showInfo() {
        if ( state.info ) {
            $('#app').prepend('<p>'+state.info+'</p>');
            state.info = null;
        }
    }

    function setupView() {
        // the event notifier sometimes calls twice
        // so ensure this is called only once
        if ( state.hash == location.hash ) return;
        state.hash = location.hash;
        var segments = trim( location.hash.substring(1).split('/') );
        try {
            state.rootContext.initialize();
            var view = findView( state.rootContext, segments, {});
            view();
            showInfo();
            $(window).scrollTop( 0 ); 
        } catch ( e ) {
            state.info = e;
            redirect('0');
        }
    }

    function trim(a){
        var tmp=new Array();
        for(j=0;j<a.length;j++)
            if(a[j]!='')
                tmp[tmp.length]=a[j];
        a.length=tmp.length;
        for(j=0;j<tmp.length;j++)
            a[j]=tmp[j];
        return a;
    }


    function findView( context, segments, map ) {
        var subContext = context.getSubContext( segments, map );
        if ( !subContext ) return function() { context.view( map[context]) }
        return findView( subContext, segments.slice(1), map );
    }

    function verifyListSignatures() {
        if (state.formSignatures.length == 0)
            throw "No Signatures Needed";

        formIsFilled( "You must fill in the form before it can be signed" );
    }

    function formIsFilled( errorMessage ) {
        // is form filled in
        $.each(state.formDraft.pages, function(idx, page){
            $.each( page.fields, function( fieldIdx, field ){
                if ( field.field.mandatory && !field.value) {
                    throw errorMessage;
                }
            });
        });
    }

    function verifySubmit() {
        formIsFilled( "Form cannot be submitted" );
        //is form signed
        if ( state.formSignatures.length > 0 ) {
            if ( state.formSignatures.length != state.formDraft.signatures.length ) {
                throw "Form must be signed before it can be submitted";
            }
        }
    }

    function verifySelectedSignature( number ) {
        var nr = parseInt( number );
        var max = state.formSignatures.length;
        if ( isNaN(nr) || nr < 0 || nr >= max ) {
            throw "Required signature not valid: "+number;
        }
    }

    function verifyPage( pageSegment ) {
        var page = parseInt( pageSegment );
        var pages = state.formDraft['pages'].length;
        if ( isNaN(page) || page < 0 || page >= pages ) {
            throw "Page not valid: "+pageSegment;
        }
    }

    function setupContexts() {
        state.rootContext     = new Context( gotoPage, setupCaseAndForm);
        var summaryContext    = new Context( gotoSummary, setupSignatures );
        var signaturesContext = new Context( gotoSignatures, setupSignatures, verifyListSignatures);
        var pageContext       = new Context( gotoPage, $.noop, verifyPage );
        var providersContext  = new Context( gotoProviders, setupProviders, verifySelectedSignature );
        var signatureContext  = new Context( performSign );
        var discardContext    = new Context( discard );
        var submitContext     = new Context( submitAndSend, $.noop, verifySubmit );

        state.rootContext.addSubContext( 'summary', summaryContext );
        state.rootContext.addSubContext( 'signatures', signaturesContext );
        state.rootContext.addSubContext( 'discard', discardContext );
        state.rootContext.addSubContext( 'submit', submitContext );
        state.rootContext.addIdContext( pageContext );

        signaturesContext.addIdContext( providersContext );

        providersContext.addIdContext( signatureContext );
    }

    function Context( view, initialize, verifier ) {
        this.subContexts = {};
        this.initialize = initialize ? initialize : $.noop;
        this.verify = verifier ? verifier : $.noop;
        this.view = view;
    }

    Context.prototype.addSubContext = function( name, context ) {
        this.subContexts[ name ] = context;
    }

    Context.prototype.addIdContext = function( context ) {
        this.addSubContext( 'idContext', context );
    }

    Context.prototype.getSubContext = function( segments, map ) {
        if ( segments.length == 0 ) return null;
        var name = segments[0];
        var subContext;
        if ( this.subContexts[ name ] ) {
            subContext = this.subContexts[ name ];
        } else {
            if ( !this.subContexts.idContext ) return null;
            map[ this.subContexts.idContext ] = name;
            subContext = this.subContexts.idContext;
        }
        subContext.initialize();
        subContext.verify( name );
        return subContext;
    }

    /**
     * Main
     */
    var state = {
        info: ''
    };

	$('#app').empty();
	$('#components').hide().load('static/components.html', function() {
        translate( );
        RequestModule.updateAccesspoint( accesspoint );
        login();
        $(window).hashchange( setupView );
	});
})
