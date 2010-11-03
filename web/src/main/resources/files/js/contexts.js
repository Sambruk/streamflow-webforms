

/**
 * Defines the structure of the application (path after the '#' in the URL)
 *
 * E.g.
 * #<number> -> page in the form
 * #signatures/0/ -> required signatures, first one
 */
var Contexts = (function() {
    var inner = {};
    var rootContext;

    // Context has a view, initialize, and a verifyer
    // first initialize is called, then the verifyer
    // if the verifyer succeeds (i.e. does not throws an exception
    // the view will be shown
    function Context( view, args ) {
        this.subContexts = {};
        this.initialize = args.initialize ? args.initialize : $.noop;
        this.verify = args.verifier ? args.verifier : $.noop;
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
        var subContext;
        if ( this.subContexts[ name ] ) {
            subContext = this.subContexts[ name ];
        } else {
            if ( !this.subContexts.idContext ) return null;
            map[ this.subContexts.idContext ] = name;
            subContext = this.subContexts.idContext;
        }
        subContext.initialize();
        subContext.verify( name );
        return subContext;
    }


    function findView( context, segments, map ) {
        var subContext = context.getSubContext( segments, map );
        if ( !subContext ) return function() { context.view( map[context]) }
        return findView( subContext, segments.slice(1), map );
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

    inner.findView = function( ) {
        rootContext.initialize();
        var segments = trim( location.hash.substring(1).split('/') );
        return findView( rootContext, segments, {});
    }

    inner.setupContexts = function() {
        rootContext           = new Context( gotoPage, { initialize:setupCaseAndForm });
        var summaryContext    = new Context( gotoSummary, {initialize:setupSignatures} );
        var signaturesContext = new Context( gotoSignatures, {initialize:setupSignatures, verifier:verifyListSignatures});
        var pageContext       = new Context( gotoPage, { verifier:verifyPage });
        var providersContext  = new Context( gotoProviders, {initialize:setupProviders, verifier:verifySelectedSignature} );
        var signatureContext  = new Context( performSign, {} );
        var discardContext    = new Context( discard, {} );
        var submitContext     = new Context( submitAndSend, {verifier:verifySubmit});

        rootContext.addSubContext( 'summary', summaryContext );
        rootContext.addSubContext( 'signatures', signaturesContext );
        rootContext.addSubContext( 'discard', discardContext );
        rootContext.addSubContext( 'submit', submitContext );
        rootContext.addIdContext( pageContext );

        signaturesContext.addIdContext( providersContext );

        providersContext.addIdContext( signatureContext );
    }

    return inner;
}());