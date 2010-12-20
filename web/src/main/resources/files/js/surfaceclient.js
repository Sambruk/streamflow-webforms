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
    function login( accesspoint ) {
        RequestModule.init( accesspoint );
        Contexts.init( contexts );
        FieldTypeModule.init( parseEvents, refreshField );
        View.init( state );

        setupView();
        loadEidPlugins();
    }

    function loadEidPlugins() {
    	if ( state.formSignatures.length > 0 ) {
	        $("#signerDiv").append( RequestModule.getHeader() );
	        addSigners($("#signerDiv"));
    	}
    }
    
    function refreshField( fieldId ) {
        var value = RequestModule.refreshField( fieldId );
        updateFormDraftField( fieldId, value );
        return value;
    }

    /** Setup functions **/

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

    function setupSignatures() {
        if ( state.formSignatures ) return;
        state.formSignatures = RequestModule.getFormSignatures();
    }

    function setupProviders() {
        if ( state.eIdProviders ) return;
        if (state.formSignatures.length > 0){
	        state.eIdProviders = RequestModule.getProviders();
	        $.each (state.eIdProviders.links, function(idx, provider) {
	        	var list = provider.href.split('=');
	            if ( list.length  != 2 ) {
	                throw { error: texts.invalidProviderList, redirect:'summary' };
	            } else {
	            	provider.provider = list[1];
	            }
	        });
        }
    }

    function setupRequiredSignature( args ) {
        state.requiredSignatureName = state.formSignatures[ args.segment ].name;
    }

    /** Verify functions **/

    function verifySubmit() {
        formIsFilled( {error: texts.missingMandatoryFields,
            redirect: 'summary'});

        if ( state.formSignatures.length > 0 ) {
            //is form signed
            if ( state.formSignatures.length != state.formDraft.signatures.length ) {
                throw {error:texts.signBeforeSubmit,
                    redirect:'summary'};
            }
        }
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

    function verifyPage( args ) {
        var page = parseInt( args.segment );
        var pages = state.formDraft['pages'].length;
        if ( isNaN(page) || page < 0 || page >= pages ) {
            throw {error: texts.invalidpage+args.segment};
        }
    }

    function verifyFormEditing() {
        if ( state.formDraft.signatures.length > 0) {
            throw {error: texts.signedFormNotEditable, redirect: 'summary' };
        }
    }

    function verifySigner(args ) {
        if (state.formSignatures.length == 0)
            throw {error:texts.noRequiredSignatures, redirect:'summary'};

        formIsFilled( {error:texts.fillBeforeSign, redirect:'summary' } );

        var nr = parseInt( args.segment );
    	var max = state.formSignatures.length;
    	if ( isNaN(nr) || nr < 0 || nr >= max ) {
    		throw {error:texts.requiredSignatureNotValid + args.segment, redirect:'summary' };
        }
    }

    function verifyProvider(args ) {
        var provider = args.provider;

        var found = false;
        $.each(state.eIdProviders.links, function(idx, link ) {
        	if (link.provider == provider) {
        		found = true;
        	};
        });

        if (!found) {
        	throw {error: texts.unknownEidProvider, redirect:'summary' };
        }
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

    function setupView() {
        View.runView( Contexts.findView( location.hash ));
    }

    function rootView() {
        // since we have no root view redirect to first page of form
        throw { redirect: Contexts.findUrl( View.formPage, ['0'] ) }
    }

    var contexts = {view:rootView,          init: [ setupCaseAndForm, setupSignatures ], subContexts: {
        'discard'   : {view:View.discard},
        'idContext' : {view:View.formPage,   init: [ verifyPage, verifyFormEditing ]},
        'summary'   : {view:View.summary,    init: [ setupProviders ], subContexts: {
           'submit'    : {view:View.submit,   init: [ verifySubmit ]},
           'idContext' : {view:View.sign,     init: [ verifySigner, verifyProvider, setupRequiredSignature ]}}}}};

    var state = {};
	$('#components').hide().load('static/components.html', function() {
        try {
            login( accesspoint );
            $(window).hashchange( setupView );
        } catch ( e ) {
            View.error( e );
        }
	});
	
})
