

var Builder = (function() {
    var inner = {};
    var info;

    inner.formSubmitted = function( args, caseName, formId, caseUrl ) {
        var message = args.node.find('#end_message');
        message.text(texts.formSubmittedThankYou);

        if ( typeof( args.caseName )!="undefined") {
            message.append( '<br/> ' + texts.caseidmessage + ' ' + args.caseName );
        }
        var url = args.caseUrl +'submittedforms/'+ args.formId + '/generateformaspdf';
        createButton({image: 'print', name:texts.print, href:url}).attr('target','_new').appendTo(args.node);
    }

    inner.page = function( args ) {
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

    inner.providers = function( args ) {
        args.node.append( texts.provider );
        $.each( args.eIdProviders, function(idx, link ) {
            args.node.append( '<br/>');
            createButton( {name:link.text, href:location.hash+'/'+ link.href.split('=')[1] } ).appendTo( args.node );
        });
    }

    inner.requiredSignatures = function( args ) {
        var list = $('<ul />');

        $.each( args.required, function(idx, signature) {
            var button;
            // for now only allow one signature
            if ( args.signatures.length > 0 ) {
                button = createButton({image:'signed', name: signature.name, disabled:true});
                button.aToolTip({ tipContent: 'Signed by ' + args.signatures[0].signerName });
            } else {
                button = createButton({name:signature.name, href:'#signatures/'+idx});
            }
            list.append( $('<li />').append( button ) );
        });

        args.node.append( list );
        args.node.append( createButton({image:'summary', name:texts.summary, href:'#summary'} ) );
    }

    inner.summary = function( args ) {
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
        var formCanSubmit = formOk && ( args.signatures.length == args.addedSignatures.length );

        var button = createButton( {image:'submit', name:texts.submit, href:'#submit', disabled:!formCanSubmit });
        summaryStatus.append( button );
        summaryStatus.append( createButton( {image:'discard', name:texts.discard, href:'#discard'}) );

        if ( args.signatures.length != 0 ) {
            summaryStatus.append( createButton( {image:'signatures', name:texts.signatures, href:'#signatures', disabled:!formOk }) );
        }

        if ( !formOk ) {
            button.aToolTip({ tipContent: errorString });
        }
    }

    inner.updateField = function(fn, fieldId, fieldValue) {
        var fieldDTO = {
            field: fieldId,
            value: fieldValue
        };
        var image = $('#'+fieldId+' .fieldwaiting > img').show();
        try{
            return fn( fieldDTO );
        } catch( e ) {
            info = e;
            showInfo();
            return "";
        }finally{
            image.hide();
        }
    }


    inner.discard = function( args ) {
        args.node.find('#end_message').text( texts.formdiscarded );
    }

    inner.show = function( id, fn, args ) {
        args.node = clone( id );
        fn( args );
        $('#app').empty().append( args.node );
    }

    inner.runView = function( view ) {
        try {
            view();
            showInfo();
            $(window).scrollTop( 0 );
            return "";
        } catch ( e ) {
            if ( e.info ) info = e.info;
            if ( e.redirect ) return e.redirect;
            //default redirect
            return "0";
        }
    }

    function showInfo() {
        if ( info ) {
            $('#app').prepend( clone( 'ErrorMessage' ).append( info ) );
            info = null;
        }
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

    function lastPage( page, pages ) {
        return ( page == pages.length -1);
    }

    function firstPage( page ) {
        return ( page == 0);
    }

    function clone( templateId ) {
        return $('#'+templateId).clone().attr('id', 'inserted_'+templateId );
    }

    return inner;
}());
