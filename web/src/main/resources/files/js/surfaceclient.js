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
        FieldTypeModule.setFieldRefresher( refreshField );
        FieldTypeModule.setAttachmentUpload( RequestModule.attach );
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

    function refreshField( fieldId ) {
        var value = RequestModule.refreshField( fieldId );
        updateFormDraftField( fieldId, value );
        return value;
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

    function setupRequiredSignature( args ) {
        state.requiredSignatureName = state.formSignatures[ args.segment ].name;
    }

    function gotoSummary() {
        var description = state.formDraft.description;
        var pages = state.formDraft.pages;
        Builder.show( 'form_summary_div' , Builder.summary, {description: description, pages:pages, signatures: signatures()});
    }

    function signatures() {
        if ( state.formSignatures.length > 0 ) {
            return {
                required:  state.formSignatures,
                addedSignatures: state.formDraft.signatures,
                eIdProviders:state.eIdProviders.links,
                transactionId:state.formDraft.form,
                tbs:getFormTBS()
            };
        } else {
            return null;
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
	                throw { error:"Provider list is incorrect", redirect:'summary' };
	            } else {
	            	provider.provider = list[1];
	            }
	        });
        }
    }

    function getFormTBS(){
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
        try {
        	var retVal = doSign();
            if ( retVal != 0 ) {
                throw { warning:"Signature aborted (errorcode: " +retVal + ")", redirect:'summary' };
            } else {
                // strip parameters
                var verifyDTO = {};
                $.each( $('#app').find('form > input:hidden'), function(idx, value ) {
                    if ( value.name ) {
                        verifyDTO[ value.name ] = value.value;
                    }
                });
                verifyDTO.name = state.requiredSignatureName;
                verifyDTO.form = getFormTBS();
                RequestModule.verify( verifyDTO );
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
        Builder.runView( Contexts.findView( location.hash ));
    }

    function verifySigner(args ) {
        if (state.formSignatures.length == 0)
            throw {error:"No Signatures Needed", redirect:'summary'};

        formIsFilled( {error:"You must fill in the form before it can be signed", redirect:'summary' } );

        var nr = parseInt( args.segment );
    	var max = state.formSignatures.length;
    	if ( isNaN(nr) || nr < 0 || nr >= max ) {
    		throw {error:"Required signature not valid: "+args.segment, redirect:'summary' };
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
        	throw {error:"You have selected an unknown eId provider", redirect:'summary' };
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

    function verifyPage( args ) {
        var page = parseInt( args.segment );
        var pages = state.formDraft['pages'].length;
        if ( isNaN(page) || page < 0 || page >= pages ) {
            throw {error:"Page not valid: "+args.segment};
        }
    }

    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
    
    var contexts = {view:gotoPage,          init: [ setupCaseAndForm ], subContexts: {
        'discard'   : {view:discard},
        'submit'    : {view:submitAndSend,  init: [ verifySubmit ]},
        'idContext' : {view:gotoPage,       init: [ verifyPage, verifyFormEditing ]},
        'summary'   : {view:gotoSummary,    init: [ setupSignatures, setupProviders ], subContexts: {
           'idContext': {view:performSign,     init:[verifySigner,verifyProvider,setupRequiredSignature]}}}}};

    var state = {};
	$('#components').hide().load('static/components.html', function() {
        RequestModule.updateAccesspoint( accesspoint );
        login();
        $(window).hashchange( setupView );
	});
})
