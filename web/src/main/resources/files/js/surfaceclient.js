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
    /**
     * Functions that call StreamFlow
     */
    function verifyAccessPoint() {
        var parameters = request('GET', state.streamflow );
        parameters.error = function() { error( texts.invalidaccesspoint ); };
        $.ajax(parameters);
    }

    function login() {
        verifyAccessPoint();
        var parameters = request('POST', state.surface + 'selectenduser.json');
        parameters.error = function() { error( texts.loginfailed ); };
        $.ajax(parameters);

        var params = request('GET', state.surface + 'userreference.json');
        params.error = function() { error( texts.loginfailed ); };
        var data = getData(params);
        state.streamflow += data.entity + '/';
    }

    function setupCaseAndForm() {
        if ( state.formDraft ) return;
        var parameters = request('GET', state.streamflow + 'findcasewithform.json');
        parameters.error = null;
        var data = getData( parameters);
        if ( data.caze && data.form )
        {
            state.caseUrl = state.streamflow + data.caze;
            state.streamflow += data.caze + '/formdrafts/' + data.form + '/';
            var params = request('GET', state.streamflow + 'index.json');
            state.formDraft = getData( params );
        } else {
            createCaseWithForm();
        }
    }

    function createCaseWithForm() {
        var parameters = request('POST', state.streamflow + 'createcasewithform.json');
        parameters.success = parseEvents;
        $.ajax(parameters);
    }

    updateFieldValue = function(fieldId, fieldValue) {
        var image = $('#'+fieldId+' .fieldwaiting > img');
        image.show();
        var fieldDTO = {
            field: fieldId,
            value: fieldValue
        };

        var parameters = request('PUT', state.streamflow + 'updatefield.json');
        parameters.data = fieldDTO;
        parameters.success = parseEvents;
        $.ajax(parameters);
        image.hide();
    }

    function submitAndSend() {
        var parameters = request('POST', state.streamflow + 'summary/submitandsend.json');
        parameters.success = insertFormSubmitted;
        $.ajax(parameters);
        insertFormSubmitted();
    }

    function discard() {
        var parameters = request('POST', state.streamflow + 'discard.json');
        $.ajax(parameters);
        insertDiscard();
    }

    function getFormSignatures() {
        if ( state.formSignatures ) return;
        var parameters = request('GET', state.streamflow + 'summary/signatures.json');
        state.formSignatures = getData(parameters).signatures;
    }

    function getProviderList() {
        if ( state.eIdProviders ) return;
        var parameters = request('GET', state.eid + 'sign/providers.json');
        state.eIdProviders = getData( parameters );
    }

    /**
     * Utility methods
     */
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
                state.caseUrl = state.streamflow + caseId;
                state.streamflow += caseId;
            } else if ( event.name == "changedFormDraft" )
            {
                state.streamflow += '/formdrafts/' + event.entity + '/';
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

    function inferPage( page ) {
        if ( isNaN(page) ) return 0;
        if ( page < 0 ) return 0;
        var pages = state.formDraft['pages'].length;
        if ( page >= pages ) return pages-1;
        return page;
    }

    function request(type, url) {
        return {type:type, url:url, async:false, cache:false, error:errorPopup};
    }

    function errorPopup() {
        alert( texts.erroroccurred );
        throw "http call failed";
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
        var parameters = request('GET', state.caseUrl + '/index.json');
        var caseId = getData( parameters ).caseId;

        var node = clone('thank_you_div');
        var message = node.find('#end_message');
        message.text(texts.formSubmittedThankYou);

        if ( typeof( caseId )!="undefined") {
            message.append( '<br/> ' + texts.caseidmessage + ' ' + caseId );
        }
        var url = state.caseUrl +'/submittedforms/'+state.formDraft.form + '/generateformaspdf';
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
        toolbar.append( createButton('discard', '#') );
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

        $.each( state.formSignatures, function(idx, signature) {
            var button = clone('link').attr({'href':'#signatures/'+idx, "class":"button"}).removeAttr('id').text( signature.name );
            list.append( $('<li />').append( button ) );
        });

        var requiredSignatures = clone('required_signatures_div');
        requiredSignatures.find('#required_signatures_list').append( list );
        requiredSignatures.append( createButton( 'summary', '#summary' ) );
        // check number of signatures on form with number of required
        requiredSignatures.append( createButton( 'submit', '#', true) );
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
            successUrl: "#signsuccess",
            errorUrl: "#signfailed"
        };

        var parameters = request('GET', state.eid + 'sign/sign.htm');
        parameters.data = signDTO;
        var htmlSnippet = getData( parameters );

        //$('#app').html( htmlSnippet.replace(/document.write/g, "$('body').append") );
        $('#app').html( htmlSnippet );

        $('#app').find('form').submit( function() {
            // all params should now be in place
            // don't submit
            return false;
        });
        $('#app').find('form').submit();

        // strip parameters
        var verifyDTO = {};
        $.each( $('#app').find('form:input'), function(idx, value ) {
            verifyDTO[ value.name ] = value.value;
        });
        var parameteres = request('POST', state.eid + 'verify');
        parameteres.data = verifyDTO;
        var signatureDTO = getData( parameteres);

        signatureDTO.form = tbs;
        signatureDTO.encodedForm = verifyDTO.encodedTbs;
        signatureDTO.provider = provider;
        signatureDTO.name = state.requiredSignatureName;

        // put parameters in
        parameteres = request('PUT', state.streamflow + 'addsignature.json');
        parameteres.data = signatureDTO;
        parameteres.success = function() { redirect("signatures") };
        $.ajax(parameteres);
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

    function error( message ) {
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
            currentPage = i
            nferPage( parseInt( page ) );
        }
        showView( insertPage );
    }

    function showView( view ) {
        if ( state.currentlyShowing != location.hash ) {
            view();
            state.currentlyShowing = location.hash;
        }
    }

    function setupView() {
        var segments = trim( location.hash.substring(1).split('/') );
        try {
            showView( findView( state.rootContext, segments, {}) );
        } catch ( e ) {
            alert( e );
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
        context.initialize();
        var subContext = context.getSubContext( segments, map );
        if ( !subContext ) return function() { context.view( map[context]) }
        return findView( subContext, segments.slice(1), map );
    }

    function setupContexts() {
        state.rootContext = new Context( gotoPage, setupCaseAndForm);

        var summaryContext = new Context(insertSummary, getFormSignatures );

        var signaturesContext = new Context( insertRequiredSignatures, function() {
            getFormSignatures();
            if (state.formSignatures.length == 0) throw "No Signatures Needed"
        });

        var pageContext = new Context( gotoPage );

        var signatureContext = new Context( insertSign );

        var providerContext = new Context( insertProviders, getProviderList );

        state.rootContext.addSubContext( 'summary', summaryContext );
        state.rootContext.addSubContext( 'signatures', signaturesContext );
        state.rootContext.addIdContext( pageContext );

        signaturesContext.addIdContext( providerContext );

        providerContext.addIdContext( signatureContext );
    }


    function Context( view, initialize ) {
        this.subContexts = {};
        this.initialize = ( initialize ? initialize : $.noop );
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
        if ( this.subContexts[ name ] ) {
            return this.subContexts[ name ];
        } else {
            if ( !this.subContexts.idContext ) return null;
            map[ this.subContexts.idContext ] = name;
            return this.subContexts.idContext;
        }
    }

    /**
     * Main
     */
    var state = {
        streamflow: "proxy/accesspoints/",
	    surface:    "surface/accesspoints/",
	    eid:        "eidproxy/",
    };

	$('#app').empty();
	$('#components').hide().load('static/components.html', function() {
        translate( );
        if ( accesspoint ) {
            state.surface += accesspoint + '/endusers/';
            state.streamflow += accesspoint + '/endusers/';
            login();
            setupContexts();
            setupView();
            $(window).hashchange( setupView );
        } else {
            error( texts.invalidaccesspoint );
        };
	});
    /**
     * Listeners
     */
    $('#submit_page').live('click',             submitAndSend );
    $('#discard_page').live('click',            discard );
})
