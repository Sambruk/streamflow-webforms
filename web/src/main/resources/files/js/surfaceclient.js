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
        setupCaseAndForm();
    }

    function setupCaseAndForm() {
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

    function setupFormSignatures() {
        var parameters = request('GET', state.streamflow + 'summary/signatures.json');
        state.formSignatures = getData(parameters).signatures;
    }

    function getProviderList() {
        state.eIdProviders = {"links":[{"classes":"","href":"sign.htm?provider=ibm-cbt_25","id":"1","rel":"sign","text":"BankId"},{"classes":"","href":"sign.htm?provider=nexus-personal_4X","id":"6","rel":"sign","text":"Bank Id"}]};

        /*var parameters = request('GET', state.eid + 'sign/providers.json');
        state.eIdProviders = getData( parameters );*/
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

        toolbar.append( createButton('previous', '#'+(currentPage-1), firstPage ) );
        toolbar.append( createButton('next', '#'+(currentPage+1), lastPage ) );
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
        if ( !state.eIdProviders ) {
            getProviderList();
        }

        var div = clone('form_signing_div');
        var providers = div.find('#signing_providers');
        var signatureDescription = state.formSignatures[ providerIdx ]
        $.each( state.eIdProviders.links, function(idx, link ) {
            providers.append( clone('link').attr({"class":"button", "href":location.hash+'/'+ link.href.split('=')[1] }).text( link.text ) );
            providers.append( '<br/>');
        });
        insert( div );
    }

    function insertRequiredSignatures() {
        if ( !formRequiresSignatures() ) {
            // form does not require signatures
            // redirect to summary page
            redirect( 'summary' );
            return;
        }
        var list = $('<ul />');

        $.each( state.formSignatures, function(idx, signature) {
            //var button = createButton( 'signed', '#signatures/'+idx, function() { checkSignature( signature.name ); } )
            var button = clone('link').attr({'href':'#signatures/'+idx, "class":"button"}).removeAttr('id').text( signature.name );
            list.append( $('<li />').append( button ) );
        });

        var requiredSignatures = clone('required_signatures_div');
        requiredSignatures.find('#required_signatures_list').append( list );
        requiredSignatures.append( createButton( 'summary', '#summary' ) );
        // check number of signatures on form with number of required
        requiredSignatures.append( createButton( 'submit', '#', function() {return true;}) );
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
        insert( summaryDiv );
    }

    formRequiresSignatures = function() {
        if ( !state.formSignatures ) {
            setupFormSignatures();
        }
        return state.formSignatures.length != 0
    }


    function insertDiscard() {
        var node = clone('thank_you_div');
        node.find('#end_message').text( texts.formdiscarded );
        insert( node );
    }

    function insertSign( provider ) {
        var tbs = getFormTBS();

        var htmlSnippet = '<html> <body> <script type="text/javascript"> alert("script evaluated"); if (/MSIE/.test(navigator.userAgent)){ document.write("<object name=' +
        "'signer' classid='CLSID:FB25B6FD-2119-4CEF-A915-A056184C565E'></object> "+
        '"); } else { document.write("<object name='+
        "'signer' type='application/x-personal-signer2'></object> "+
        '"); } function doSign() { var signer2 = document.signer; retVal = signer2.SetParam('+
        "'TextToBeSigned', 'VGVrc3RmZWx0ID0gTWFkcy4gdGVrc3Qgb21yw6VkZSA9IGFzZGZhc2RmLiBDaGVja2Jva3NlciA9IGNoaW1wYW5zZS4gbGlzdGJva3MgPSBLw6VsLiByYWRpb2tuYXBwZXIgPSBLdmluZGUuIGRhdG8gPSAyMDEwLTEwLTA3VDIyOjAwOjAwLjAwMDBaLiBoZWx0YWwgPSAyLiByZWFsdGFsID0gMi4ga29tbWVudGFyID0gbnVsbC4gQ29tYm9ib3ggPSBOZXRhdmlzLiBHb3QgeW91ISA9IG51bGwuIEZpbmFsIHJlbWFyayA9IG51bGwuIA=='); if (0 != retVal) { alert("+
        '"[This is a webpage dialog.] SetParam TextToBeSigned to '+
        "'VGVrc3RmZWx0ID0gTWFkcy4gdGVrc3Qgb21yw6VkZSA9IGFzZGZhc2RmLiBDaGVja2Jva3NlciA9IGNoaW1wYW5zZS4gbGlzdGJva3MgPSBLw6VsLiByYWRpb2tuYXBwZXIgPSBLdmluZGUuIGRhdG8gPSAyMDEwLTEwLTA3VDIyOjAwOjAwLjAwMDBaLiBoZWx0YWwgPSAyLiByZWFsdGFsID0gMi4ga29tbWVudGFyID0gbnVsbC4gQ29tYm9ib3ggPSBOZXRhdmlzLiBHb3QgeW91ISA9IG51bGwuIEZpbmFsIHJlbWFyayA9IG51bGwuIA==' did not return zero.\n "+
        '"+ "retVal = " + retVal); return false; } retVal = signer2.SetParam('+
        "'ServerTime', '1288338227'); if (0 != retVal) { alert("+
        '"[This is a webpage dialog.] SetParam ServerTime to '+
        "'1288338227' did not return zero.\n "+
        '"+ "retVal = " + retVal); return false; } retVal = signer2.SetParam('+
        "'Nonce', 'ASv277kc6nZ++IYKTmdsDzTVPamPWLv6ybJBawpa513X'); if (0 != retVal) { alert("+
        '"[This is a webpage dialog.] SetParam Nonce to '+
        "'ASv277kc6nZ++IYKTmdsDzTVPamPWLv6ybJBawpa513X' did not return zero.\n "+
        '"+ "retVal = " + retVal); return false; } retVal = signer2.PerformAction('+
        "'Sign'); if (retVal == 0) { document.signerData.signature.value = signer2 .GetParam('Signature'); } else { alert('Failed to create signature! retVal = ' + retVal); return false; } document.signerData.submit(); return true; } </script> <form method="+
        '"POST" name="signerData" action="#signsuccess"> <input name="nonce" value="ASv277kc6nZ++IYKTmdsDzTVPamPWLv6ybJBawpa513X" type="hidden"> <input name="signature" value="" type="hidden"> <input name="encodedTbs" value="VGVrc3RmZWx0ID0gTWFkcy4gdGVrc3Qgb21yw6VkZSA9IGFzZGZhc2RmLiBDaGVja2Jva3NlciA9IGNoaW1wYW5zZS4gbGlzdGJva3MgPSBLw6VsLiByYWRpb2tuYXBwZXIgPSBLdmluZGUuIGRhdG8gPSAyMDEwLTEwLTA3VDIyOjAwOjAwLjAwMDBaLiBoZWx0YWwgPSAyLiByZWFsdGFsID0gMi4ga29tbWVudGFyID0gbnVsbC4gQ29tYm9ib3ggPSBOZXRhdmlzLiBHb3QgeW91ISA9IG51bGwuIEZpbmFsIHJlbWFyayA9IG51bGwuIA==" type="hidden"/> <input name="provider" value="nexus-personal_4X" type="hidden"/> <input type="submit" onclick="doSign()" value="Sign"> </form> </body> </html>';

        $('#app').empty().html( htmlSnippet ).hide();

        //$('#app').find('').submit();

        var array = $(htmlSnippet);
        $.each(array, function(idx,element ) {
            switch (element.tagName) {
                case "SCRIPT":
                    //eval( element.text );
                    break;
                case "FORM":
                    var argDTO = {};

                    $.each( $(element).find('input'), function(idx, inputElm)
                    {
                        if ( inputElm.name )
                        {
                            argDTO[ inputElm.name ] = inputElm.value;
                        }
                    });
                    var parameters = request('POST', state.eid + 'sign/verify');
                    parameters.data = argDTO;
                    $.ajax(parameters);
                    break;
            }
        });


/*
        var signDTO = {
            transactionId: state.formDraft.form,
            tbs: tbs,
            provider: provider,
            successUrl: "#signsuccess",
            errorUrl: "#signfailed"
        };

        */
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

    function findView(  ) {
        var segments = location.hash.split('/');
        switch ( segments[0] ) {
            case "#summary":
                showView( function() { insertSummary(); })
                break;
            case "#signatures":
                if ( segments.length == 1 ) {
                    showView( function() { insertRequiredSignatures(); } );
                } else if ( segments.length == 2) {
                    showView( function() { insertProviders( parseInt( segments[1] ) ); } );
                } else {
                    showView( function() { insertSign( segments[2] ); } );
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
                showView( function() { insertPage(); } );
        }
    }

    function showView( renderFunction ) {
        if ( state.currentlyShowing != location.hash ) {
            renderFunction();
            state.currentlyShowing = location.hash;
        }
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
    var state = {
        streamflow: "proxy/accesspoints/",
	    surface:    "surface/accesspoints/",
	    eid:        "eidproxy/",
    };

	$('#app').empty();
	$('#components').hide().load('static/components.html', function() {
        translate( );
        if ( !accesspoint )
        {
            error( texts.invalidaccesspoint );
        } else
        {
            state.surface += accesspoint + '/endusers/';
            state.streamflow += accesspoint + '/endusers/';
            login();
            checkHash();
            $(window).hashchange( findView );
        };
	});
    /**
     * Listeners
     */
    $('#login_enduser_operation').live('click', login );
    $('#submit_page').live('click',             submitAndSend );
    $('#discard_page').live('click',            discard );
})
