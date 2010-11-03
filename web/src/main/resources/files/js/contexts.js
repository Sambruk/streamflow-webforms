

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
    var hash;

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
        return this;
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

    Context.prototype.getViewFunction = function( segments, map, fn) {
        var context = this;
        if ( segments.length == 0 ) {
            return function() { fn(); context.view( map[context] )};
        }
        var name = segments[0];
        var subContext;
        if ( this.subContexts[ name ] ) {
            subContext = this.subContexts[ name ];
        } else {
            if ( !this.subContexts.idContext ) return null;
            map[ this.subContexts.idContext ] = name;
            subContext = this.subContexts.idContext;
        }
        return subContext.getViewFunction( segments.slice(1), map,
            function () {
                fn();
                subContext.initialize();
                subContext.verify( name );
            });
    }


    function findView( context, segments, map, fn ) {
        var subContext = context.getSubContext( segments, map );
        if ( !subContext ) return function() { fn(); context.view( map[context]) }
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
        if ( hash == location.hash ) return $.noop;
        hash = location.hash;
        rootContext.initialize();
        var segments = trim( location.hash.substring(1).split('/') );
        //return findView( rootContext, segments, {});
        return rootContext.getViewFunction( segments, {}, rootContext.initialize );        
    }

    inner.init = function( map ) {
        rootContext = setup( map );
    }

    function setup( map )Ê{
        var context = create( map );
        if ( !map.subContexts ) return create( map );
        $.each( map.subContexts, function(key, value ) {
            if ( key == 'named' ) {
                context.addIdContext( setup( value ) )
            } else {
                context.addSubContext( key, setup( value ) );
            }
        })
        return context;
    }

    function create( map ) {
        return new Context( map.view, {initialize:map.initialize, verifier:map.verifier});
    }

    return inner;
}());

/*
{view:gotoPage, initialize:setupCaseAndForm, subContexts: {
    'summary'   : {view:gotoSummary, initialize:setupSignatures},
    'discard'   : {view:discard},
    'submit'    : {view:submitAndSend, verifier:verifySubmit},
    'named'     : {view:gotoPage, initialize:verifyPage},
    'signatures': {view:gotoSignatures, initialize: setupSignatures, subContexts: {
         'named': {view:gotoProviders, initialize:setupProviders, verifier:verifySelectedSignature, subContexts: {
            'named': {view:performSign}}}}}}};
  */