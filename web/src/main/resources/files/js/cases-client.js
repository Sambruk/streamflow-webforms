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

jQuery(document).ready(function() {
//google.setOnLoadCallback(function () {
    
	var store = {};
    var contexts = {view:rootView,            init: [ setupUser ], subContexts: {
        'open'   	: {view:View.openCases,	  init: [ setupOpenCases ]},
        'closed' 	: {view:View.closedCases, init: [ setupClosedCases ]}}};

	$('#components').hide().load('static/cases-components.html', function() {
		$('#login').load('static/login-components.html', function(){
    		$('#dialog-login').hide();
    		$('#dialog-message').hide();
    		
    		try {
    			Contexts.init( contexts );
    			LoginModule.init();
    			setupView();
    		} catch ( e ) {
    			View.error( e );
    		}
		});
	});
	
    $(window).hashchange( setupView );

    function setupView() {
        View.runView( Contexts.findView( location.hash ));
    }

    function rootView() {
        // Since we have no root view redirect to open cases.
        throw { redirect: Contexts.findUrl( View.openCases, ['0'] ) };
    }

	function setupUser() {
		RequestModule.setupUser( contactid );
	}
	
	function setupOpenCases() {
		UrlModule.setupOpenCasesQuery();
		UrlModule.setupOpenCasesDataSource();
	}

	function setupClosedCases() {
		UrlModule.setupClosedCasesQuery();
		UrlModule.setupClosedCasesDataSource();
	}
	
	function setupPersist() {
		PersistModule.setup();
	}

});
