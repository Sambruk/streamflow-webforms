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
        Contexts.setupContexts();
        setupView();
    }

    setupCaseAndForm = function() {
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

    submitAndSend = function() {
        RequestModule.submitAndSend();
        var caseName = RequestModule.getCaseName();
        var formId = state.formDraft.form;
        var caseUrl = RequestModule.getCaseUrl();
        state.formDraft = null;
        show( 'thank_you_div', buildFormSubmitted, {caseName:caseName, formId:formId, caseUrl:caseUrl} );
    }

    discard = function() {
        RequestModule.discard();
        state.formDraft = null;
        show( 'thank_you_div', buildDiscard, {});
    }

    gotoPage = function( page ) {
        if ( !page ) {
            redirect('0');
        } else {
            var pages = state.formDraft['pages'];
            show( 'form_filling_div', buildPage, {page:parseInt( page ), pages:pages, description: state.formDraft.description});
        }
    }

    gotoProviders = function( index ) {
        state.requiredSignatureName = state.formSignatures[ index ].name;
        show('form_signing_div', buildProviders, { eIdProviders:state.eIdProviders.links });
    }

    gotoSummary = function() {
        var description = state.formDraft.description;
        var pages = state.formDraft.pages;
        var signatures = state.formSignatures.length != 0;
        show( 'form_summary_div' , buildSummary, {description: description, pages:pages, signatures:signatures});
    }

    gotoSignatures = function() {
        var hasSignature = state.formDraft.signatures.length > 0;
        var required = state.formSignatures;
        show( 'required_signatures_div', buildRequiredSignatures, {hasSignature:hasSignature, required:required});
    }

    setupSignatures = function() {
        if ( state.formSignatures ) return;
        state.formSignatures = RequestModule.getFormSignatures();
    }

    setupProviders = function() {
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

    performSign = function( provider ) {
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
    function createButton( map ) {
        var image, button;
        if ( map.image ) {
            image = clone( map.image );
        }
        if ( !map.disabled ) {
            button = clone('link').attr({'href':map.href,"class":"button positive"});
        } else {
            image.fadeTo(0, 0.4);
            button = clone('disabled');
        }
        return button.append( image ).append( map.name );
    }

    function show( id, fn, args ) {
        args.node = clone( id );
        fn( args );
        $('#app').empty().append( args.node );
    }

    function buildFormSubmitted( args, caseName, formId, caseUrl ) {
        var message = args.node.find('#end_message');
        message.text(texts.formSubmittedThankYou);

        if ( typeof( args.caseName )!="undefined") {
            message.append( '<br/> ' + texts.caseidmessage + ' ' + args.caseName );
        }
        var url = args.caseUrl +'submittedforms/'+ args.formId + '/generateformaspdf';
        createButton({image: 'print', name:texts.print, href:url}).attr('target','_new').appendTo(args.node);
    }

    function buildPage( args ) {
        args.node.find('#form_description').text( args.description );
        var toolbar = args.node.find('#form_buttons_div');

        toolbar.append( createButton({image:'previous', name:texts.previous, href:'#'+(args.page-1), disabled:firstPage(args.page)} ) );
        toolbar.append( createButton({image:'next',name:texts.next,href:'#'+(args.page+1), disabled:lastPage(args.page, args.pages) } ) );
        toolbar.append( createButton({image:'discard',name:texts.discard,href:'#discard'} ) );
        toolbar.append( createButton({image:'summary',name:texts.summary,href:'#summary'} ) );

        appendPageNames( args.page, args.pages, args.node.find('#form_pages') );
        var fieldList = args.node.find('#form_table_body');
        $.each( args.pages[ args.page ].fields, function(idx, field){
            FieldTypeModule.render( field, fieldList );
        });
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

    function buildProviders( args ) {
        args.node.append( texts.provider );
        $.each( args.eIdProviders, function(idx, link ) {
            args.node.append( '<br/>');
            createButton( {name:link.text, href:location.hash+'/'+ link.href.split('=')[1] } ).appendTo( args.node );
        });
    }

    function buildRequiredSignatures( args ) {
        var list = $('<ul />');

        var submitDisabled = true;
        $.each( args.required, function(idx, signature) {
            var button;
            // for now only allow one signature
            if ( args.hasSignature ) {
                button = createButton({image:'signed', name: signature.name, disabled:true});
                submitDisabled = false;
            } else {
                button = createButton({name:signature.name, href:'#signatures/'+idx});
            }
            list.append( $('<li />').append( button ) );
        });

        args.node.append( list );
        args.node.append( createButton({image:'summary', name:texts.summary, href:'#summary'} ) );
        args.node.append( createButton({image:'submit', name:texts.submit, href:'#submit', disabled:submitDisabled} ) );
    }

    function buildSummary( args ) {
        var errorString = "";
        args.node.find('#form_description').text( args.description );
        var summaryPages = args.node.find('#form_pages_summary');
        var summaryStatus = args.node.find('#form_submission_status');

        $.each( args.pages, function(idx, page){
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
        if ( args.signatures ) {
            button = createButton( {image:'signatures', name:texts.signatures, href:'#signatures', disabled:!formOk });
        } else {
            button = createButton( {image:'submit', name:texts.submit, href:'#submit', disabled:!formOk });
        }

        summaryStatus.append( button );
        if ( !formOk ) {
            button.aToolTip({ tipContent: errorString });
        }
    }

    function buildDiscard( args ) {
        args.node.find('#end_message').text( texts.formdiscarded );
    }

    error = function( message ) {
        show('ErrorMessage', function(args){args.node.text(message)}, {});
        throw message;
    }

    function clone( templateId ) {
        return $('#'+templateId).clone().attr('id', 'inserted_'+templateId );
    }

    function redirect( view ) {
        location.hash = '#'+view;
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
        try {
            
            var view = Contexts.findView( );
            view();
            showInfo();
            $(window).scrollTop( 0 ); 
        } catch ( e ) {
            state.info = e;
            redirect('0');
        }
    }

    verifyListSignatures = function() {
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

    verifySubmit = function() {
        formIsFilled( "All mandatory filed must be filled before the form can be submitted" );

        if ( state.formSignatures.length > 0 ) {
            //is form signed
            if ( state.formSignatures.length != state.formDraft.signatures.length ) {
                throw "Form must be signed before it can be submitted";
            }
        }
    }

    verifySelectedSignature = function( number ) {
        var nr = parseInt( number );
        var max = state.formSignatures.length;
        if ( isNaN(nr) || nr < 0 || nr >= max ) {
            throw "Required signature not valid: "+number;
        }
    }

    verifyPage = function( pageSegment ) {
        var page = parseInt( pageSegment );
        var pages = state.formDraft['pages'].length;
        if ( isNaN(page) || page < 0 || page >= pages ) {
            throw "Page not valid: "+pageSegment;
        }
    }

    var state = {};
	$('#components').hide().load('static/components.html', function() {
        RequestModule.updateAccesspoint( accesspoint );
        login();
        $(window).hashchange( setupView );
	});
})
