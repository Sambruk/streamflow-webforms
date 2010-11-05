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
        return this;
    }

    Context.prototype.addIdContext = function( context ) {
        this.addSubContext( 'idContext', context );
    }

    Context.prototype.buildViewFunction = function( segments, map, fn) {
        var context = this;
        if ( segments.length == 0 ) {
            return function() { fn(); context.view( map[context] )};
        }
        var name = segments[0];
        var subContext;
        if ( this.subContexts[ name ] ) {
            subContext = this.subContexts[ name ];
        } else {
            if ( !this.subContexts.idContext ) return function() { fn(); context.view( map[context] )};
            map[ this.subContexts.idContext ] = name;
            subContext = this.subContexts.idContext;
        }
        return subContext.buildViewFunction( segments.slice(1), map,
            function () {
                fn();
                $.each( subContext.init, function(idx, fn ){
                    fn( name );
                });
            });
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
        var fn = function() {
            $.each( rootContext.init, function(idx, fun ){
                fun( );
            });
        }
        return rootContext.buildViewFunction( segments, {}, fn );
    }

    inner.init = function( map ) {
        rootContext = build( map );
    }

    function build( map) {
        var context = create( map );
        if ( !map.subContexts ) return create( map );
        $.each( map.subContexts, function(key, value ) {
            if ( key == 'named' ) {
                context.addIdContext( build( value ) )
            } else {
                context.addSubContext( key, build( value ) );
            }
        })
        return context;
    }

    function create( map ) {
        return new Context( map.view, map.init );
    }

    return inner;
}());
