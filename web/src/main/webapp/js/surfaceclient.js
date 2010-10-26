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
        var result = false;
        $.ajax({
            url: proxyContextUrl,
            async: false,
            type: 'GET',
            success: function() {
                result = true;
            }
        });
        return result;
    }

    function login() {
        if ( verifyAccessPoint() )
        {
            var loggedIn = true;
            $.ajax({
                url: contextUrl + 'selectenduser.json',
                async: false,
                type: 'POST',
                success: function(data, textStatus, XMLHttpRequest) {
                    $.ajax({
                        url: contextUrl + 'userreference.json',
                        cache: false,
                        async: false,
                        success: function(data) {
                            proxyContextUrl += data.entity + '/';
                        },
                        error: function() {
                            loggedIn = false;
                        }
                    });
                },
                error: function() {
                    loggedIn = false;
                }
            });
            if ( loggedIn )
            {
                if ( !queryCaseForm() )
                {
                    createCaseWithForm();
                }
            } else {
                $('#app').append( $('#ErrorMessage').clone().attr({id:'loginFailed'}).text( texts.loginfailed ) );
            }
        } else {
            $('#app').append( $('#ErrorMessage').clone().attr({id:'illegalAccessPoint'}).text( texts.invalidaccesspoint ) );
        }
    }

    function queryCaseForm() {
        var result = false;
        $.ajax({
            url: proxyContextUrl + 'findcasewithform.json',
            async: false,
            cache: false,
            type: 'GET',
            success: function(data) {
                if ( data.caze != null && data.caze != "" && data.form != null && data.form != "" )
                {
                    caseUrl = proxyContextUrl + data.caze;
                    proxyContextUrl += data.caze + '/formdrafts/' + data.form + '/';
                    $.ajax({
                        url: proxyContextUrl + 'index.json',
                        async: false,
                        cache: false,
                        type: 'GET',
                        success: function( data ) {
                            formDraft = data;
                            navigate( window.top.location.hash.substring(1) );
                            result = true;
                        }
                    });
                }
            }
        });
        return result;
    }


    function createCaseWithForm() {
        $.ajax({
            url: proxyContextUrl + 'createcasewithform.json',
            async: false,
            type: 'POST',
            success: function(data) {
                // get case id and formsubmision id and contruct url
                $.each( data.events, function( idx, event){
                    if ( event.name == "createdCase")
                    {
                        var caseId = $.parseJSON(event.parameters)['param1'];
                        caseUrl = proxyContextUrl + caseId;
                        proxyContextUrl += caseId;
                    } else if ( event.name == "changedFormDraft" )
                    {
                        proxyContextUrl += '/formdrafts/' + event.entity + '/';
                        formDraft = $.parseJSON($.parseJSON(event.parameters)['param1']);
                        navigate( window.top.location.hash.substring(1) );
                    }
                });
            },
            error: errorPopup
        });
    }

    updateFieldValue = function(fieldId, fieldValue) {
        var successfulUpdate = false;
        var image = $('#'+fieldId+' .fieldwaiting > img');
        image.show();
        var fieldDTO = {
            field: fieldId,
            value: fieldValue
        };
        $.ajax({
            url: proxyContextUrl + 'updatefield.json',
            async: false,
            data: fieldDTO,
            type: 'PUT',
            success: function(data) {
                $.each( data.events, function( idx, event) {
                    if ( event.name == "changedFieldValue" ) {
                        var fieldId = $.parseJSON(event.parameters)['param1'];
                        var fieldValue = $.parseJSON(event.parameters)['param2'];

                        var onPage = updateFormDraftField( fieldId, fieldValue );
                        if ( onPage == currentPage) {
                            FieldTypeModule.setFieldValue( fieldId, fieldValue );
                        }
                    }
                });
            },
            error: errorPopup
        });
        image.hide();
        return successfulUpdate;
    }

    function submitAndSend()
    {
        $.ajax({
            url: proxyContextUrl + 'summary/submitandsend.json',
            type: 'POST',
            success: function( ) {
                var caseId = queryCaseInfo();

                var node = $('#thank_you_div').clone();
                var message = node.find('#end_message');
                message.text(texts.formSubmittedThankYou);

                if ( typeof( caseId )!="undefined") {
                    message.append( '<br/> ' + texts.caseidmessage + ' ' + caseId );                    
                }
                var url = caseUrl +'/submittedforms/'+formDraft.form + '/generateformaspdf';
                var print_node = $('#print').clone();
                var print_url = print_node.find("#print_link").attr("href", url );
                print_node.appendTo(node);

                $('#app').empty().append( node );
            },
            error: errorPopup
        });
    }

    function queryCaseInfo()
    {
        var caseId;
        $.ajax({
            url: caseUrl + '/index.json',
            async: false,
            cache: false,
            type: 'GET',
            success: function( data ) {
                caseId = data.caseId;
            }
        });
        return caseId;
    }

    function discard()
    {
        $.ajax({
            url: proxyContextUrl + 'discard.json',
            type: 'POST',
            success: function() {
                var node = $('#thank_you_div').clone();
                node.find('#end_message').text( texts.formdiscarded );
                $('#app').empty().append( node );
            },
            error: errorPopup
        });
    }

    /**
     * Functions that manipulates the DOM
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

    // Based on the formDraft
    // the current page is updated
    function refreshPageComponents() {
        if ( formDraft != null )
        {
            var formFillingDiv = $('#form_filling_div').clone().attr({'id':'inserted_form_filling_div'});
            formFillingDiv.find('#form_description').text( formDraft.description);
            $('#app').empty().append( formFillingDiv );

            createButton('previous', '#'+(currentPage-1), firstPage ).appendTo('#form_buttons_div');
            createButton('next', '#'+(currentPage+1), lastPage ).appendTo('#form_buttons_div');
            createButton('discard', '#').appendTo('#form_buttons_div');
            createButton('summary', '#summary' ).appendTo('#form_buttons_div');

            var pages = formDraft['pages'];
            insertPageOverview( pages );
            $.each( pages[ currentPage ].fields, function(idx, field){
                FieldTypeModule.render( field );
            });
        }
    }

    function createButton( name, href, disabledFunction ) {
        if ( !disabledFunction || !disabledFunction() ) {
            // disabledFunction: is not defined or is defined and returns false
            // => render the enabled button
            return $('#link').clone().attr({id:name+'_page', href:href}).append( $('#'+name).clone() ).append( texts[ name ] );
        } else {
            var img = $('#'+name).clone().fadeTo(0, 0.4);
            return $('#link').clone().attr({id:"disabled","class":"disabledbutton"}).append( img ).append( texts[ name ] );
        }
    }

    function insertPageOverview( pages )
    {
        $.each( pages, function(idx, page){
            var pageElm = $('<li />').text(page.title );
            if ( currentPage == idx ) {
                pageElm.attr({"class": "selected"});
            }
            $('#form_pages').append( pageElm );
            if ( idx < pages.length - 1 ) {
                $('#form_pages').append( $('<li />').text('>>') );
            }
        });
    }

    function formSigning() {
        var url = eidProxyUrl + 'sign/providers.json';

        $.ajax({
            url: url,
            type: 'GET',
            cache: false,
            success: function ( data ) {
                var node = $('<select />');
                node.append( $('<option />') );
                $.each( data.links, function(idx, link ) {
                    node.append( $('<option />').attr({value: link.href, id: 'idProvider_'+idx}).text( link.text ) );
                });
                var div = $('#form_signing_div').clone();
                div.find('#signing_providers').append( node );
                div.append( createButton( 'signature', '#signature') );
                $('#app').empty().append( div );
            },
            error: errorPopup
        })
    }

    function requiredSignaturesPage() {
        if ( !formRequiresSignatures() ) {
            // form does not require signatures
            // redirect to summary page
            navigate('summary');
        }
        var requiredSignatures = $('#required_signatures_div').clone();
        var list = requiredSignatures.find('#required_signatures_list').append( $('<ul />') );

        $.each( formSignatures, function(idx, signature) {
            var link = $('#link').clone().attr('id','signing_page').text( signature.name );
            list.append( $('<li />').append( link ) );
        });

        requiredSignatures.append( createButton( 'summary', '#summary' ) );
        // check number of signatures on form with number of required
        requiredSignatures.append( createButton( 'submit', '#', function() {return true;}) );
        $('#app').empty().append( requiredSignatures );
    }

    function setupFormSignatures() {
        $.ajax({
            url: proxyContextUrl + 'summary/signatures.json',
            type: 'GET',
            cache: false,
            async: false,
            success: function( data ) {
                formSignatures = data.signatures;
            },
            error: errorPopup
        });
    }

    formRequiresSignatures = function() {
        if ( formSignatures == "" ) {
            setupFormSignatures();
        }
        return formSignatures.length != 0
    }

    function navigate( newPage ) {
        switch ( newPage ) {
            case 'summary':
                setupFormSummary();
                break;
            case 'signature':
                requiredSignaturesPage();
                break;
            default:
                var page = parseInt( newPage );
                currentPage = inferPage( page );
                refreshPageComponents();
        }
    }

    function linkNavigate() {
        navigate( this.href.substring(this.href.indexOf('#') + 1) );
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

    function alwaysFalse() { return false; }

    function setupFormSummary() {
        var errorString = "";
        var summaryDiv = $('#form_summary_div').clone().attr({'id':'inserted_form_summary_div'});
        summaryDiv.find('#form_description').text( formDraft.description );
        $('#app').empty().append( summaryDiv );

        $.each(formDraft.pages, function(idx, page){
            var pageDiv = $('#form_page_summary').clone().attr('id', 'page'+idx);
            pageDiv.find('h3').append( $('#goto_page').clone().attr('href','#'+idx).text(page.title) );
            var ul = pageDiv.find('ul');
            $.each( page.fields, function( fieldIdx, field ){
                FieldTypeModule.displayReadOnlyField( field, ul );
                if ( field.field.mandatory && !field.value) {
                    errorString += texts.missingfield + " '"+field.field.description+"' <br>";
                }
            });
            $('#form_pages_summary').append( pageDiv );
        });
        var missingFields = function() { return (errorString!="") }
        var button;
        if ( formRequiresSignatures() ) {
            button = createButton( 'signature', '#signature', missingFields);
        } else {
            button = createButton( 'submit', '#', missingFields);
        }

        $('#form_submission_status').append( button );
        if ( missingFields() ) {
            button.aToolTip({ tipContent: errorString });
        }
    }

    /**
     * Main
     */
    var accesspoint = window.top.location.search.split('=')[1];
	var proxyContextUrl = "surface/proxy/accesspoints/"
	var contextUrl = "surface/surface/accesspoints/";
	var eidProxyUrl = "surface/eidproxy/";
	var caseUrl = "";
	var formDraft;
    var currentPage;
    var formSignatures = "";
	$('#app').empty();
	$('#components').hide().load('components.html', function() {
        translate( );
        if ( accesspoint == null || accesspoint.length < 1 )
        {
            $('#app').append( $('#ErrorMessage').clone().attr({id:'illegalAccessPoint'}).text( texts.invalidaccesspoint ) );
        } else
        {
            contextUrl += accesspoint + '/endusers/';
            proxyContextUrl += accesspoint + '/endusers/';
            login();
        };
	});

    /**
     * Listeners
     */
    $('#login_enduser_operation').live('click', login );
    $('#submit_page').live('click',             submitAndSend );
    $('#discard_page').live('click',            discard );
    $('#signing_page').live('click',            formSigning)

    $('#previous_page').live('click',  linkNavigate );
    $('#next_page').live('click',      linkNavigate );
    $('#goto_page').live('click',      linkNavigate );
    $('#summary_page').live('click',   linkNavigate );
    $('#signature_page').live('click', linkNavigate );

    $('#disabled').live('click', alwaysFalse );
})
