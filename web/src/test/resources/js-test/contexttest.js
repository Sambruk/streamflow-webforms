ContextsTest = TestCase("Contexts");


ContextsTest.prototype.setUp = function(){
    //jstestdriver.console.info("Hello World!");
    var contexts = {view: rootView,       subContexts: {
       'context' : {view: contextView,  init: [ contextVerify ], subContexts: {
        'idContext': {view:idContextView, init: [ idContextVerify ]}}}}};

    str = "";
    Contexts.init( contexts );
}

var str;

function rootView( args ) {
    general( 'rootView', args );
}

function contextView( args ) {
    general( 'contextView', args );
}

function contextVerify( args ) {
    general( 'contextVerify', args );
}

function idContextView( args ) {
    general( 'idContextView', args );
}

function idContextVerify( args ) {
    general( 'idContextVerify', args );
}


function general( name, args ) {
    if ( !args || !args.segment ) {
        str += name + '()';
        return;
    }
    str += name + '(' + args.segment;
    $.each( args, function(key, value) {
        if ( key != "segment" )
            str += ', '+key + '=' +value;
    });
    str += ') ';
}

 ContextsTest.prototype.testPath = function() {
    Contexts.findView( '#context/xyz' )();
    assertEquals("Evaluation path not as expected", "contextVerify(context) idContextVerify(xyz) idContextView(xyz) ", str);
}

ContextsTest.prototype.testPathWithParam = function() {
    Contexts.findView( '#context/1234?provider=name' )();
    assertEquals("Bad match", "contextVerify(context) idContextVerify(1234, provider=name) idContextView(1234, provider=name) ", str);
}

ContextsTest.prototype.testMultiparam = function() {
    Contexts.findView( '#context?a=first&b=second')();
    assertEquals("Bad match", "contextVerify(context, a=first, b=second) contextView(context, a=first, b=second) ", str);
}

ContextsTest.prototype.testWeirdString = function() {
    Contexts.findView( '#//nafjdk?jk??&' )();
    assertEquals('Bad match', "rootView()", str );
}

ContextsTest.prototype.testNull = function() {
    var fun = Contexts.findView( null );
    assertEquals("must return noop", $.noop, fun);
}

ContextsTest.prototype.testRoot = function() {
    Contexts.findView( '#/' )();
    assertEquals("must return root","rootView()" , str);
}

ContextsTest.prototype.testSameTwice = function() {
    var context = "same";
    Contexts.findView( context );
    var fun = Contexts.findView( context );
    assertEquals("must return noop", $.noop, fun);
}

ContextsTest.prototype.testGetUrl = function() {
    var url = Contexts.findUrl( rootView );
    assertEquals("URL mismatch", "", url );
}

ContextsTest.prototype.testGetContextView = function() {
    var url = Contexts.findUrl( idContextView );
    assertEquals( "URL mismatch", "context/idContext/", url );
}


ContextsTest.prototype.testGetUrlAndView = function() {
    var url = Contexts.findUrl( idContextView );
    Contexts.findView( '#' + url )();
    assertEquals("Bad match", "contextVerify(context) idContextVerify(idContext) idContextView(idContext) ", str);
}
