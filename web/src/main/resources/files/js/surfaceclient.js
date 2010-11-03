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
        Contexts.init( contexts );
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
        Builder.show( 'thank_you_div', Builder.formSubmitted, {caseName:caseName, formId:formId, caseUrl:caseUrl} );
    }

    discard = function() {
        RequestModule.discard();
        state.formDraft = null;
        Builder.show( 'thank_you_div', Builder.discard, {});
    }

    function gotoPage( page ) {
        if ( !page ) {
            redirect('0');
        } else {
            var pages = state.formDraft['pages'];
            Builder.show( 'form_filling_div', Builder.page, {page:parseInt( page ), pages:pages, description: state.formDraft.description});
        }
    }

    gotoProviders = function( index ) {
        state.requiredSignatureName = state.formSignatures[ index ].name;
        Builder.show('form_signing_div', Builder.providers, { eIdProviders:state.eIdProviders.links });
    }

    gotoSummary = function() {
        var description = state.formDraft.description;
        var pages = state.formDraft.pages;
        var signatures = state.formSignatures.length != 0;
        Builder.show( 'form_summary_div' , Builder.summary, {description: description, pages:pages, signatures:signatures});
    }

    gotoSignatures = function() {
        var hasSignature = state.formDraft.signatures.length > 0;
        var required = state.formSignatures;
        Builder.show( 'required_signatures_div', Builder.requiredSignatures, {hasSignature:hasSignature, required:required});
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
                if ( onPage == parseInt( location.hash.substring(1) )) {
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

    error = function( message ) {
        Builder.show('ErrorMessage', function(args){args.node.text(message)}, {});
        throw message;
    }

    function redirect( view ) {
        location.hash = '#'+view;
    }

    function setupView() {
        if ( !Builder.runView( Contexts.findView( ) ) ) {
            // error when executing view
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

    var contexts = {view:gotoPage, initialize:setupCaseAndForm, subContexts: {
        'summary'   : {view:gotoSummary, initialize:setupSignatures},
        'discard'   : {view:discard},
        'submit'    : {view:submitAndSend, verifier:verifySubmit},
        'named'     : {view:gotoPage, verifier:verifyPage},
        'signatures': {view:gotoSignatures, initialize: setupSignatures, subContexts: {
             'named': {view:gotoProviders, initialize:setupProviders, verifier:verifySelectedSignature, subContexts: {
                'named': {view:performSign}}}}}}};

    var state = {};
	$('#components').hide().load('static/components.html', function() {
        RequestModule.updateAccesspoint( accesspoint );
        login();
        $(window).hashchange( setupView );
	});
})
