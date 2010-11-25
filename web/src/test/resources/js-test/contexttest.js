ContextsTest = TestCase("Contexts");


ContextsTest.prototype.setUp = function(){
    //jstestdriver.console.info("Hello World!");
    var contexts = {view: view,       subContexts: {
       'context' : {view: view,  init: [ verify ], subContexts: {
        'idContext': {view:view, init: [ verify ]}}}}};

    str = "";
    Contexts.init( contexts );
}

var str;

function verify( args ) {
    if ( !args || !args.segment ) {
        str += 'verify()';
        return;
    }
    str += 'verify('+args.segment;
    $.each( args, function(key, value) {
        if ( key != "segment" )
            str += ', '+key + '=' +value;
    });
    str += '), ';
}

function view( args ) {
    if ( !args || !args.segment ) {
        str += 'view()';
        return;
    }
    str += 'view('+args.segment;
    $.each( args, function(key, value) {
        if ( key != 'segment' )
            str += ', '+key + '=' +value;
    });
    str += ')';
}


ContextsTest.prototype.testPath = function() {
    Contexts.findView( '#context/xyz' )();
    assertEquals("Evaluation path not as expected", "verify(context), verify(xyz), view(xyz)", str);
}

ContextsTest.prototype.testPathWithParam = function() {
    Contexts.findView( '#context/1234?provider=name' )();
    assertEquals("Bad match", "verify(context), verify(1234, provider=name), view(1234, provider=name)", str);
}

ContextsTest.prototype.testMultiparam = function() {
    Contexts.findView( '#context?a=letter&1=integer')();
    assertEquals("Bad match", "verify(context, 1=integer, a=letter), view(context, 1=integer, a=letter)", str);
}

ContextsTest.prototype.testWeirdString = function() {
    Contexts.findView( '#//nafjdk?jk??&' )();
    assertEquals('Bad match', "view()", str );
}

ContextsTest.prototype.testNull = function() {
    var fun = Contexts.findView( null );
    assertEquals("must return noop", $.noop, fun);   
}

ContextsTest.prototype.testSameTwice = function() {
    var context = "same";
    Contexts.findView( context );
    var fun = Contexts.findView( context );
    assertEquals("must return noop", $.noop, fun);   
}