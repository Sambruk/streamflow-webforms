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
        RequestModule.setErrorHandler( error );
        RequestModule.verifyAccessPoint();
        RequestModule.selectEndUser();
        var data = RequestModule.getUser();
        RequestModule.createUserUrl( data.entity );
        Contexts.init( contexts );
        FieldTypeModule.setFieldUpdater( updateField );
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

    function updateField( fieldId, fieldValue ) {
        return parseEvents( Builder.updateField( RequestModule.updateField, fieldId, fieldValue ) );
    }

    function submitAndSend() {
        RequestModule.submitAndSend();
        var caseName = RequestModule.getCaseName();
        var formId = state.formDraft.form;
        var caseUrl = RequestModule.getCaseUrl();
        state.formDraft = null;
        state.formSignatures = null;
        Builder.show( 'thank_you_div', Builder.formSubmitted, {caseName:caseName, formId:formId, caseUrl:caseUrl} );
    }

    function discard() {
        RequestModule.discard();
        state.formDraft = null;
        state.formSignatures = null;
        Builder.show( 'thank_you_div', Builder.discard, {});
    }

    function gotoPage( args ) {
        if ( !args ) {
            throw { redirect:'0' };
        } else {
            var pages = state.formDraft['pages'];
            Builder.show( 'form_filling_div', Builder.page, {page:parseInt( args.segment ), pages:pages, description: state.formDraft.description});
        }
    }

    function gotoProviders( args ) {
        state.requiredSignatureName = state.formSignatures[ args.segment ].name;
        Builder.show('form_signing_div', Builder.providers, { eIdProviders:state.eIdProviders.links });
    }

    function gotoSummary() {
        var description = state.formDraft.description;
        var pages = state.formDraft.pages;
        var signatures = state.formSignatures;
        var addedSignatures = state.formDraft.signatures;
        Builder.show( 'form_summary_div' , Builder.summary, {description: description, pages:pages, signatures:signatures, addedSignatures:addedSignatures});
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
        if ( !eventMap.events ) return false;
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

    function performSign( args ) {
        var tbs = getFormTBS();

        var signDTO = {
            transactionId: state.formDraft.form,
            tbs: tbs,
            provider: args.provider,
            successUrl: "#success",
            errorUrl: "#failed"
        };

        var htmlSnippet = RequestModule.sign( signDTO );

        try {
            $('#app').html( htmlSnippet ).hide();
            if ( !doSign() ) {
                throw { warning:"Signature cancelled: "+retVal, redirect:'summary' };
                //Builder.setWarning( "Signature cancelled: "+retVal );
            } else {
                // strip parameters
                var verifyDTO = {};
                $.each( $('#app').find('form > input:hidden'), function(idx, value ) {
                    verifyDTO[ value.name ] = value.value;
                });
                var signatureDTO = RequestModule.verify( verifyDTO );

                signatureDTO.form = tbs;
                signatureDTO.encodedForm = verifyDTO.encodedTbs;
                signatureDTO.provider = args.provider;
                signatureDTO.name = state.requiredSignatureName;
                RequestModule.addSignature( signatureDTO );
                state.formDraft = RequestModule.getFormDraft();
            }

        } finally {
            $('#app').show();
        }
        throw {info:"Form signed successfully", redirect:'summary'};
    }

    function error( message ) {
        Builder.show('ErrorMessage', function(args){args.node.text(message)}, {});
        throw {error:message};
    }

    function setupView() {
        Builder.runView( Contexts.findView( ));
    }

    function verifyListSignatures() {
        if (state.formSignatures.length == 0)
            throw {error:"No Signatures Needed", redirect:'summary'};

        formIsFilled( {error:"You must fill in the form before it can be signed", redirect:'summary' } );
    }

    function formIsFilled( ifError ) {
        // is form filled in
        $.each(state.formDraft.pages, function(idx, page){
            $.each( page.fields, function( fieldIdx, field ){
                if ( field.field.mandatory && !field.value) {
                    throw ifError;
                }
            });
        });
    }

    function verifySubmit() {
        formIsFilled( {error:"All mandatory filed must be filled before the form can be submitted",
            redirect: 'summary'});

        if ( state.formSignatures.length > 0 ) {
            //is form signed
            if ( state.formSignatures.length != state.formDraft.signatures.length ) {
                throw {error:"Form must be signed before it can be submitted",
                    redirect:'summary'};
            }
        }
    }

    // If a form is signed it must not be edited
    function verifyFormEditing() {
        if ( state.formDraft.signatures.length > 0) {
            throw {error: "Form is signed so it cannot be edited", redirect: 'summary' };
        }
    }

    function needSigning() {
        if ( state.formSignatures.length == 0 )
            throw {error:"Form does not require any signatures", redirect:'summary'};
    }

    function canBeSigned() {
        formIsFilled( {error:"Fill the form before signing", redirect:'summary'} );
    }

    function verifySelectedSignature( args ) {
        var nr = parseInt( args.segment );
        var max = state.formSignatures.length;
        if ( isNaN(nr) || nr < 0 || nr >= max ) {
            throw {error:"Required signature not valid: "+args.segment};
        }

        //check if the selected signature is already signed
        var name = state.formSignatures[ nr ].name;
        $.each( state.formDraft.signatures, function(idx, value) {
            if ( value.name == name )
                throw {error: "'"+name+"' has already signed the form", redirect: 'summary'}
        });
    }

    function verifyPage( args ) {
        var page = parseInt( args.segment );
        var pages = state.formDraft['pages'].length;
        if ( isNaN(page) || page < 0 || page >= pages ) {
            throw {error:"Page not valid: "+args.segment};
        }
    }

    
    var contexts = {view:gotoPage,          init: [ setupCaseAndForm ], subContexts: {
        'discard'   : {view:discard},
        'submit'    : {view:submitAndSend,  init: [ verifySubmit ]},
        'idContext' : {view:gotoPage,       init: [ verifyPage, verifyFormEditing ]},
        'summary'   : {view:gotoSummary,    init: [ setupSignatures ], subContexts: { 
            'idContext': {view:gotoProviders,  init: [ setupProviders, needSigning, canBeSigned, verifySelectedSignature ], subContexts: {
                'idContext': {view:performSign}}}}}}};

    var state = {};
	$('#components').hide().load('static/components.html', function() {
        RequestModule.updateAccesspoint( accesspoint );
        login();
        $(window).hashchange( setupView );
	});
})
