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
    function errorPopup() { alert( texts.erroroccurred ); }

    /**
     * Functions that call StreamFlow
     */
    function verifyAccessPoint() {
        var result = true;
        var parameters = request('GET', proxyContextUrl);
        parameters.error = function() { result = false; };
        $.ajax(parameters);
        return result;
    }

    function login() {
        if ( verifyAccessPoint() ) {
            var loggedIn = true;
            var parameters = request('POST', contextUrl + 'selectenduser.json');
            parameters.success = function(data) {
                var params = request('GET', contextUrl + 'userreference.json');
                params.success = function(data) {
                    proxyContextUrl += data.entity + '/';
                };
                params.error = function() { loggedIn = false; };
                $.ajax(params);
            };
            parameters.error = function() { loggedIn = false; };
            $.ajax(parameters);
            if ( loggedIn )
            {
                if ( !queryCaseForm() )
                {
                    createCaseWithForm();
                }
            } else {
                $('#app').append( clone('ErrorMessage').text( texts.loginfailed ) );
                return false;
            }
        } else {
            $('#app').append( clone('ErrorMessage').text( texts.invalidaccesspoint ) );
            return false;
        }
        return true;
    }

    function queryCaseForm() {
        var result = false;
        var parameters = request('GET', proxyContextUrl + 'findcasewithform.json');
        parameters.error = null;
        parameters.success = function(data) {
                if ( data.caze && data.form )
                {
                    caseUrl = proxyContextUrl + data.caze;
                    proxyContextUrl += data.caze + '/formdrafts/' + data.form + '/';
                    var params = request('GET', proxyContextUrl + 'index.json');
                    params.success = function( data ) {
                                        formDraft = data;
                                        result = true;
                                     };
                    $.ajax(params);
                }
             };
        $.ajax(parameters);
        return result;
    }

    function parseEvents( eventMap ) {
        $.each( eventMap.events, function( idx, event){
            if ( event.name == "createdCase")
            {
                var caseId = $.parseJSON(event.parameters)['param1'];
                caseUrl = proxyContextUrl + caseId;
                proxyContextUrl += caseId;
            } else if ( event.name == "changedFormDraft" )
            {
                proxyContextUrl += '/formdrafts/' + event.entity + '/';
                formDraft = $.parseJSON($.parseJSON(event.parameters)['param1']);
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

    function createCaseWithForm() {
        var parameters = request('POST', proxyContextUrl + 'createcasewithform.json');
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

        var parameters = request('PUT', proxyContextUrl + 'updatefield.json');
        parameters.data = fieldDTO;
        parameters.success = parseEvents;
        $.ajax(parameters);
        image.hide();
    }

    function submitAndSend() {
        var parameters = request('POST', proxyContextUrl + 'summary/submitandsend.json');
        parameters.success = function( ) {
            var caseId = queryCaseInfo();

            var node = clone('thank_you_div');
            var message = node.find('#end_message');
            message.text(texts.formSubmittedThankYou);

            if ( typeof( caseId )!="undefined") {
                message.append( '<br/> ' + texts.caseidmessage + ' ' + caseId );
            }
            var url = caseUrl +'/submittedforms/'+formDraft.form + '/generateformaspdf';
            var print_node = clone('print');
            var print_url = print_node.find("#print_link").attr("href", url );
            print_node.appendTo(node);

            $('#app').empty().append( node );
        }
        $.ajax(parameters);
    }

    function queryCaseInfo() {
        var caseId;
        var parameters = request('GET', caseUrl + '/index.json');
        parameters.success = function( data ) {
                caseId = data.caseId;
            };
        return caseId;
    }

    function discard()
    {
        var parameters = request('POST', proxyContextUrl + 'discard.json');
        parameters.success = function() {
                var node = clone('thank_you_div');
                node.find('#end_message').text( texts.formdiscarded );
                $('#app').empty().append( node );
            };
        $.ajax(parameters);
    }

    function initiateSignature( provider ) {
        var tbs = getFormTBS();

        var signDTO = {
            transactionId: formDraft.form,
            tbs: tbs,
            provider: provider,
            successUrl: "#signsuccess",
            errorUrl: "#signfailed"
        };

        var parameters = request('GET', eidProxyUrl + 'sign/sign.htm');
        parameters.data = signDTO;
        parameters.success = function ( htmlSnippet ) {
                var array = $(htmlSnippet);
                $.each(array, function(idx,element ) {
                    switch (element.tagName) {
                        case "SCRIPT":
                            eval( element );
                            break;
                        case "FORM":
                            $('#app').empty().append( element );
                            break;
                    }
                });
                //$('#app').empty().append( htmlSnippet );
                //$('#app').empty().html( htmlSnippet );
            };
        $.ajax(parameters);
    }

    function getProviderList() {
        //eIdProviders = {"links":[{"classes":"","href":"sign.htm?provider=ibm-cbt_25","id":"1","rel":"sign","text":"BankId"},{"classes":"","href":"sign.htm?provider=nexus-personal_4X","id":"6","rel":"sign","text":"Nexus Personal"}]};

        var parameters = request('GET', eidProxyUrl + 'sign/providers.json');
        parameters.success = function( data ) { eIdProviders = data; };
        $.ajax(parameters);
    }

    function setupFormSignatures() {
        var parameters = request('GET', proxyContextUrl + 'summary/signatures.json');
        parameters.success = function( data ) {
                formSignatures = data.signatures;
            };
        $.ajax(parameters);
    }

    function request(type, url) {
        return {type:type, url:url, async:false, cache:false, error:errorPopup};
    }

    /**
     * Helper functions
     */
    function updateFormDraftField( fieldId, fieldValue ) {
        var pageNumber = -1;
        $.each( formDraft.pages, function(idx, page) {
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
        var pages = formDraft['pages'].length;
        return (currentPage == pages -1);
    }

    function firstPage() {
        return ( currentPage == 0);
    }

    function inferPage( page ) {
        if ( isNaN(page) ) return 0;
        if ( page < 0 ) return 0;
        var pages = formDraft['pages'].length;
        if ( page >= pages ) return pages-1;
        return page;
    }

    function createButton( name, href, disabledFunction ) {
        if ( !disabledFunction || !disabledFunction() ) {
            // disabledFunction: is not defined or is defined and returns false
            // => render the enabled button
            var img = clone(name);
            return clone('link', name+'_page').attr({'href':href,"class":"button"}).append( img ).append( texts[ name ] );
        } else {
            var img = clone(name).fadeTo(0, 0.4);
            return clone('disabled').append( img ).append( texts[ name ] );
        }
    }

    // Based on the formDraft
    // the current page is updated
    function refreshPageComponents() {
        if ( formDraft != null )
        {
            $('#app').empty();
            var formFillingDiv = clone('form_filling_div');
            formFillingDiv.find('#form_description').text( formDraft.description);
            var toolbar = formFillingDiv.find('#form_buttons_div');

            toolbar.append( createButton('previous', '#'+(currentPage-1), firstPage ) );
            toolbar.append( createButton('next', '#'+(currentPage+1), lastPage ) );
            toolbar.append( createButton('discard', '#') );
            toolbar.append( createButton('summary', '#summary' ) );

            var pages = formDraft['pages'];
            insertPageOverview( pages, formFillingDiv.find('#form_pages') );
            var fieldList = formFillingDiv.find('#form_table_body');
            $.each( pages[ currentPage ].fields, function(idx, field){
                FieldTypeModule.render( field, fieldList );
            });
            $('#app').append( formFillingDiv );
        }
    }

    function insertPageOverview( pages, pagesNode )
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

    function providerView( providerIdx ) {
        if ( eIdProviders == "" ) {
            getProviderList();
        }

        var div = clone('form_signing_div');
        var providers = div.find('#signing_providers');
        var signatureDescription = formSignatures[ providerIdx ]
        $.each( eIdProviders.links, function(idx, link ) {
            providers.append( clone('link').attr({"class":"button", "href":location.hash+'/'+ link.href.split('=')[1] }).text( link.text ) );
            providers.append( '<br/>');
        });
        $('#app').empty().append( div );
    }

    function getFormTBS() {
        var tbs = "";
        $.each( formDraft.pages, function(idx, page) {
            $.each( page.fields, function(fieldIdx, field) {
                // filter fieldtype comment
                tbs += field.field.description + ' = ' + field.value + '. ';
            })
        })
        return tbs;
    }

    function requiredSignaturesPage() {
        if ( !formRequiresSignatures() ) {
            // form does not require signatures
            // redirect to summary page
            redirect( 'summary' );
            return;
        }
        //$('#app').empty();
        var list = $('<ul />');

        $.each( formSignatures, function(idx, signature) {
            //var button = createButton( 'signed', '#signatures/'+idx, function() { checkSignature( signature.name ); } )
            var button = clone('link').attr({'href':'#signatures/'+idx, "class":"button"}).removeAttr('id').text( signature.name );
            list.append( $('<li />').append( button ) );
        });

        var requiredSignatures = clone('required_signatures_div');
        requiredSignatures.find('#required_signatures_list').append( list );
        requiredSignatures.append( createButton( 'summary', '#summary' ) );
        // check number of signatures on form with number of required
        requiredSignatures.append( createButton( 'submit', '#', function() {return true;}) );
        $('#app').empty().append( requiredSignatures );
    }

    function checkSignature( name ) {
        var result = false;
        $.each( formDraft.signatures, function( idx, value) {

        });
        return false;
    }

    formRequiresSignatures = function() {
        if ( formSignatures == "" ) {
            setupFormSignatures();
        }
        return formSignatures.length != 0
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

    function setupFormSummary() {
        var errorString = "";
        var summaryDiv = clone('form_summary_div');
        summaryDiv.find('#form_description').text( formDraft.description );
        var summaryPages = summaryDiv.find('#form_pages_summary');
        var summaryStatus = summaryDiv.find('#form_submission_status');

        $.each(formDraft.pages, function(idx, page){
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
        var missingFields = function() { return (errorString!="") }
        var button;
        if ( formRequiresSignatures() ) {
            button = createButton( 'signatures', '#signatures', missingFields);
        } else {
            button = createButton( 'submit', '#', missingFields);
        }

        summaryStatus.append( button );
        if ( missingFields() ) {
            button.aToolTip({ tipContent: errorString });
        }
        $('#app').empty().append( summaryDiv );
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

    function findView(  ) {
        var segments = location.hash.split('/');
        switch ( segments[0] ) {
            case "#summary":
                setupFormSummary();
                break;
            case "#signatures":
                if ( segments.length == 1 ) {
                    requiredSignaturesPage();
                } else if ( segments.length == 2) {
                    providerView( parseInt( segments[1] ) );
                } else {
                    initiateSignature( segments[2] );
                }
                break;
            case "#signsuccess":
                $('#app').empty().append( 'SUCCESS');
                break;
            case "#signfailure":
                $('#app').empty().append( 'FAILURE');
                break;
            default:
                currentPage = inferPage( parseInt( location.hash.substring(1) ) );
                refreshPageComponents();
        }
    }

    function checkLastView() {

    }

    function checkHash() {
        if ( location.hash == "" ) {
            location.hash = "#0";
        } else {
            findView();
        }
    }

    /**
     * Main
     */
    var accesspoint = window.top.location.search.split('=')[1];
	var proxyContextUrl = "proxy/accesspoints/"
	var contextUrl = "surface/accesspoints/";
	var eidProxyUrl = "eidproxy/";
	var caseUrl = "";
	var formDraft;
    var currentPage;
    var formSignatures = "";
    var lastUpdatedHash = "";
    var eIdProviders = "";
	$('#app').empty();
	$('#components').hide().load('static/components.html', function() {
        translate( );
        if ( !accesspoint )
        {
            $('#app').append( clone('ErrorMessage').text( texts.invalidaccesspoint ) );
        } else
        {
            contextUrl += accesspoint + '/endusers/';
            proxyContextUrl += accesspoint + '/endusers/';
            if ( login() ) {
                checkHash();
                $(window).hashchange( findView );
            }
        };
	});
    /**
     * Listeners
     */
    $('#login_enduser_operation').live('click', login );
    $('#submit_page').live('click',             submitAndSend );
    $('#discard_page').live('click',            discard );
})
