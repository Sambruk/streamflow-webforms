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
    var rootInit;
    var hash;

    // Context has a view, and an array of setup functions
    // before showing the view the setup functions are called
    function Context( view, init ) {
        this.subContexts = {};
        this.init = init ? init : [];
        this.view = view;
    }

    Context.prototype.addSubContext = function( name, context ) {
        this.subContexts[ name ] = context;
    }

    Context.prototype.sub = function( name ) {
        if ( this.subContexts[ name ] ) {
            return this.subContexts[ name ];
        } else {
            return this.subContexts.idContext;
        }
    }

    Context.prototype.viewFn = function( fn, args ) {
        var context = this;
        return function() { fn(); context.view( args )};
    }

    Context.prototype.initFn = function( fn, args ) {
        var context = this;
        if ( !args ) {
            return function() {
                $.each( context.init, function(idx, fun ){
                    fun( );
                });
            }
        } else {
            return function () {
                fn();
                $.each( context.init, function(idx, fun ){
                    fun( args );
                });
            };
        }
    }

    Context.prototype.buildViewFunction = function( segments, previous, fn) {
        var context = this;
        if ( segments.length == 0 ) {
            return context.viewFn( fn, previous );
        }
        var args = getArgs( segments[0] );
        var subContext = context.sub( args.segment );
        if ( !subContext ) {
            return context.viewFn( fn, previous );
        }
        return subContext.buildViewFunction( segments.slice(1), args, subContext.initFn( fn, args ) );
    }

    function getArgs( segment ) {
        args = {};
        if ( segment.indexOf('?') > 0 ) {
            var split = segment.split('?');
            args[ 'segment' ] = split[0];
            var list = split[1].split('=');
            if ( list.length % 2 != 0 ) return args;
            $.each( list, function(idx,val) {
                if ( idx % 2 == 0) {
                    args[ val ] = list[ idx +1 ];
                }
            })
        } else {
            args[ 'segment' ] = segment;
        }
        return args;
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
        var segments = trim( location.hash.substring(1).split('/') );
        return rootContext.buildViewFunction( segments, '', rootInit );
    }

    inner.init = function( map ) {
        rootContext = build( map );
        rootInit = rootContext.initFn();
    }

    function build( map) {
        var context = create( map );
        if ( !map.subContexts ) return create( map );
        $.each( map.subContexts, function(key, value ) {
            context.addSubContext( key, build( value ) );
        })
        return context;
    }

    function create( map ) {
        return new Context( map.view, map.init );
    }

    return inner;
}());
