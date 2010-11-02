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

        parseEvents( RequestModule.updateField( fieldDTO ) );
        image.hide();
    }

    function submitAndSend() {
        RequestModule.submitAndSend();
        insertFormSubmitted();
    }

    function discard() {
        RequestModule.discard();
        insertDiscard();
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
        $.each( eventMap.events, function( idx, event){
            if ( event.name == "createdCase")
            {
                var caseId = $.parseJSON(event.parameters)['param1'];
                RequestModule.createCaseUrl( caseId );
            } else if ( event.name == "changedFormDraft" )
            {
                RequestModule.createFormDraftUrl( event.entity );
                state.formDraft = $.parseJSON($.parseJSON(event.parameters)['param1']);
            } else if ( event.name == "changedFieldValue" ) {
                var fieldId = $.parseJSON(event.parameters)['param1'];
                var fieldValue = $.parseJSON(event.parameters)['param2'];

                var onPage = updateFormDraftField( fieldId, fieldValue );
                if ( onPage == currentPage) {
                    FieldTypeModule.setFieldValue( fieldId, fieldValue );
                }
            }
        });
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

    function lastPage() {
        var pages = state.formDraft['pages'].length;
        return (currentPage == pages -1);
    }

    function firstPage() {
        return ( currentPage == 0);
    }

    /**
     * Helper functions
     */
    function createButton( name, href, disabled ) {
        if ( !disabled ) {
            var img = clone(name);
            return clone('link', name+'_page').attr({'href':href,"class":"button"}).append( img ).append( texts[ name ] );
        } else {
            var img = clone(name).fadeTo(0, 0.4);
            return clone('disabled').append( img ).append( texts[ name ] );
        }
    }

    /**
     * Functions that creates DOM nodes and inserts them
     */
    function insert( node ) {
        $('#app').empty().append( node );
    }

    function insertFormSubmitted() {
        var caseId = RequestModule.getCaseName();

        var node = clone('thank_you_div');
        var message = node.find('#end_message');
        message.text(texts.formSubmittedThankYou);

        if ( typeof( caseId )!="undefined") {
            message.append( '<br/> ' + texts.caseidmessage + ' ' + caseId );
        }
        var url = RequestModule.getCaseUrl() +'submittedforms/'+state.formDraft.form + '/generateformaspdf';
        var print_node = clone('print');
        var print_url = print_node.find("#print_link").attr("href", url );
        print_node.appendTo(node);

        insert( node );
    }

    function insertPage() {
        var formFillingDiv = clone('form_filling_div');
        formFillingDiv.find('#form_description').text( state.formDraft.description);
        var toolbar = formFillingDiv.find('#form_buttons_div');

        toolbar.append( createButton('previous', '#'+(currentPage-1), firstPage() ) );
        toolbar.append( createButton('next', '#'+(currentPage+1), lastPage() ) );
        toolbar.append( createButton('discard', '#discard') );
        toolbar.append( createButton('summary', '#summary' ) );

        var pages = state.formDraft['pages'];
        appendPageNames( pages, formFillingDiv.find('#form_pages') );
        var fieldList = formFillingDiv.find('#form_table_body');
        $.each( pages[ currentPage ].fields, function(idx, field){
            FieldTypeModule.render( field, fieldList );
        });
        insert( formFillingDiv );
    }

    function appendPageNames( pages, pagesNode )
    {
        $.each( pages, function(idx, page){
            var pageElm = $('<li />').text(page.title );
            if ( currentPage == idx ) {
                pageElm.attr({"class": "selected"});
            }
            pagesNode.append( pageElm );
            if ( idx < pages.length - 1 ) {
                pagesNode.append( $('<li />').text('>>') );
            }
        });
    }

    function insertProviders( providerIdx ) {
        var div = clone('form_signing_div');
        var providers = div.find('#signing_providers');
        state.requiredSignatureName = state.formSignatures[ providerIdx ].name;
        $.each( state.eIdProviders.links, function(idx, link ) {
            providers.append( clone('link').attr({"class":"button", "href":location.hash+'/'+ link.href.split('=')[1] }).text( link.text ) );
            providers.append( '<br/>');
        });
        insert( div );
    }

    function insertRequiredSignatures() {
        var list = $('<ul />');

        var submitDisabled = true;
        $.each( state.formSignatures, function(idx, signature) {
            // for now only allow one signature
            var button;
            if ( state.formDraft.signatures.length > 0 ) {
                submitDisabled = false;
                var img = clone('signed').fadeTo(0, 0.4);
                button = clone('disabled').append( img ).append( signature.name );
            } else {
                button = clone('link').attr({'href':'#signatures/'+idx, "class":"button"}).removeAttr('id').text( signature.name );
            }
            list.append( $('<li />').append( button ) );
        });

        var requiredSignatures = clone('required_signatures_div');
        requiredSignatures.find('#required_signatures_list').append( list );
        requiredSignatures.append( createButton( 'summary', '#summary' ) );
        requiredSignatures.append( createButton( 'submit', '#submit', submitDisabled ) );
        insert( requiredSignatures );
    }

    function insertSummary() {
        var errorString = "";
        var summaryDiv = clone('form_summary_div');
        summaryDiv.find('#form_description').text( state.formDraft.description );
        var summaryPages = summaryDiv.find('#form_pages_summary');
        var summaryStatus = summaryDiv.find('#form_submission_status');

        $.each(state.formDraft.pages, function(idx, page){
            var pageDiv = clone('form_page_summary', 'page_'+idx);

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
        if ( state.formSignatures.length != 0 ) {
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

    function insertSign( provider ) {
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

        $('#app').find('form').submit( function() {
            return false;
        });

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

        // put parameters in
        RequestModule.addSignature( signatureDTO );
        state.formDraft = RequestModule.getFormDraft();
        $('#app').show();
        redirect("signatures");
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

    function getData( parameters ) {
        var data;
        parameters.success = function(arg) { data = arg; };
        $.ajax(parameters);
        return data;
    }

    function gotoPage( page ) {
        if ( !page ) {
            currentPage = 0;
        } else {
            currentPage = parseInt( page );
        }
        insertPage();
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

    function canListSignatures() {
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

    function formCanBeSubmitted() {
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
        var summaryContext    = new Context( insertSummary, setupSignatures );
        var signaturesContext = new Context( insertRequiredSignatures, setupSignatures, canListSignatures);
        var pageContext       = new Context( gotoPage, $.noop, verifyPage );
        var signatureContext  = new Context( insertSign, $.noop );
        var providerContext   = new Context( insertProviders, setupProviders, verifySelectedSignature );
        var discardContext    = new Context( discard, $.noop );
        var submitContext     = new Context( submitAndSend, $.noop, formCanBeSubmitted );

        state.rootContext.addSubContext( 'summary', summaryContext );
        state.rootContext.addSubContext( 'signatures', signaturesContext );
        state.rootContext.addSubContext( 'discard', discardContext );
        state.rootContext.addSubContext( 'submit', submitContext );
        state.rootContext.addIdContext( pageContext );

        signaturesContext.addIdContext( providerContext );

        providerContext.addIdContext( signatureContext );
    }

    function Context( view, initialize, verifier ) {
        this.subContexts = {};
        this.initialize = initialize;
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
