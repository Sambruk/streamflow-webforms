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
    function errorPopup() { alert( texts.erroroccurred ); };


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
    };

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
    };

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
                            formSubmissionValue = data;
                            refreshPageComponents();
                            result = true;
                        }
                    });
                }
            }
        });
        return result;
    };


    function createCaseWithForm() {
        $.ajax({
            url: proxyContextUrl + 'createcasewithform.json',
            async: false,
            type: 'POST',
            success: function(data) {
                // get case id and formsubmision id and contruct url
                for ( idx in data.events )
                {
                    var event = data.events[idx];
                    if ( event.name == "createdCase")
                    {
                        var caseId = $.parseJSON(event.parameters)['param1'];
                        caseUrl = proxyContextUrl + caseId;
                        proxyContextUrl += caseId;
                    } else if ( event.name == "changedFormSubmission" )
                    {
                        proxyContextUrl += '/formdrafts/' + event.entity + '/';
                        formSubmissionValue = $.parseJSON($.parseJSON(event.parameters)['param1']);
                        refreshPageComponents();
                    }
                }
            },
            error: errorPopup
        });
    };

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
                successfulUpdate = updateFormSubmissionValue( data );
                formFieldsChanged = {};
                var pages = formSubmissionValue['pages'];
                var page = pages[ formSubmissionValue['currentPage'] ];
                for ( idx in page.fields )
                {
                    FieldTypeUpdateModule.updateField( page.fields[ idx ] );
                }
            },
            error: errorPopup
        });
        image.hide();
        return successfulUpdate;
    };

    function updatePage( command, page )
    {
        var integerDTO = {
            "integer": page
        };
        $.ajax({
            url: proxyContextUrl + command,
            type: 'PUT',
            data: integerDTO
        });
    };

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
                $('#app').empty().append( node );
            },
            error: errorPopup
        });
    };

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
    };

    /**
     * Functions that manipulates the DOM
     */
    function updateFormSubmissionValue( data ) {
        for ( idx in data.events )
        {
            var event = data.events[ idx ];
            if ( event.name == "changedFormSubmission" )
            {
                formSubmissionValue = $.parseJSON($.parseJSON(event.parameters)['param1']);
                return true;
            }
        }
        return false;
    };

    // Based on the formSubmissionValue
    // the current page is updated
    function refreshPageComponents() {
        if ( formSubmissionValue != null )
        {
            formFieldsChanged = {};
            fieldMap = {};
            var formFillingDiv = $('#form_filling_div').clone().attr({'id':'inserted_form_filling_div'});
            formFillingDiv.find('#form_description').text(formSubmissionValue.description);
            $('#app').empty().append( formFillingDiv );

            var currentPage = formSubmissionValue['currentPage'];
            var pages = formSubmissionValue['pages'];
            var page = pages[ currentPage ];

            if (currentPage == 0)
            {
                $('#form_page_previous_disabled').clone().appendTo('#form_buttons_div');
            } else {
                $('#form_page_previous').clone().appendTo('#form_buttons_div');
            }
            if (currentPage == pages.length -1)
            {
                $('#form_page_next_disabled').clone().appendTo('#form_buttons_div');
            } else {
                $('#form_page_next').clone().appendTo('#form_buttons_div');
            }
            $('#form_page_discard').clone().appendTo('#form_buttons_div');
            $('#form_summary').clone().appendTo('#form_buttons_div');

            insertPageOverview( pages, currentPage );
            insertRows( page.fields );
        }
    };

    function insertPageOverview( pages, currentPage )
    {
        var lastIdx = pages.length - 1;
        for ( idx in pages ) {
            var page = $('<li />').text(pages[idx].title );
            if ( currentPage == idx )
            {
                page.attr({"class": "selected"});
            }
            $('#form_pages').append( page );
            if ( idx < lastIdx )
            {
                $('#form_pages').append( $('<li />').text('>>') );
            }
        }
    };


    function insertRows( fields ) {
        for ( idx in fields )
        {
            var field = fields[ idx ];
            FieldTypeModule.setupField( field, idx );
        }
    };

    function changeFormSubmissionPage( page )
    {
        var currentPage = formSubmissionValue['currentPage'];
        var pages = formSubmissionValue['pages'];
        var lastIndex = pages.length-1;
        if ( (page == currentPage) || (page < 0) || (page > lastIndex) ) return false;
        formSubmissionValue['currentPage'] = page;
        return true;
    };

    function changePage( command, page, forceRefresh ) {
        if ( changeFormSubmissionPage( page ) )
        {
            updatePage( command, page );
            refreshPageComponents();
        } else if ( forceRefresh ) {
            refreshPageComponents();
        }
    };

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
                for ( idx in words )
                {
                    var word = words[ idx ];
                    if ( word.length > 0 && word.charAt(0)=='$' )
                    {
                        words[ idx ] = texts[ $.trim( word.substring(1) ) ];
                    }
                }
                this.nodeValue = words.join(' ');
            });
    };


    /**
     * Main
     */
    var accesspoint = window.top.location.search.split('=')[1];
	var proxyContextUrl = "surface/proxy/accesspoints/"
	var contextUrl = "surface/surface/accesspoints/";
	var caseUrl = "";
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
    $('#login_enduser_operation').live('click', function() { login(); });

    $('#form_page_previous').live('click', function() { changePage('previouspage.json', parseInt(formSubmissionValue['currentPage'])-1, false) });

    $('#form_page_previous_disabled').live('click', function() { return false; });

    $('#form_page_next').live('click', function() { changePage('nextpage.json', parseInt(formSubmissionValue['currentPage'])+1, false) });

    $('#form_page_next_disabled').live('click', function() { return false; });

    $('#goto_form_page').live('click', function() { changePage('summary/gotopage.json', $(this).attr('accesskey'), true) });

    $('#form_page_discard').live('click', function() { discard(); });

    $('#form_summary').live('click', function() { setupFormSummary(); });

   $('#form_submit').live('click', function() {
        if ( missingFields == "" )
        {
            submitAndSend();
        }
   });
})
