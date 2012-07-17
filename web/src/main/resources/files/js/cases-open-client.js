/*
 *
 * Copyright 2009-2012 Jayway Products AB
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
    
	var contactId;
	
	$('#components').hide().load( contextRoot + '/mypages/static/cases-components.html', function() {
		$('#login').load( contextRoot + '/mypages/static/login-components.html', function(){
    		$('#dialog-login').hide();
    		$('#dialog-message').hide();
    		
    		try {
    			LoginModule.init(contextRoot);
    			UrlModule.init(contextRoot);
    			setupView();
    		} catch ( e ) {
    			View.error( e );
    		}
		});
	});
	
    function setupView() {
    	var success = function() {
			RequestModule.setupUser( contactId );
			UrlModule.setupOpenCasesQuery();
			UrlModule.setupOpenCasesDataSource();
			View.openCases();
    	}
    	if (!contactId) 
		{
			var currentUser = LoginModule.currentUser();
			if (! currentUser)
			{
				LoginModule.login( function() {
					contactId = LoginModule.currentUser().contactId;
					success();
				});
			} else {
				contactId = currentUser.contactId;
				success();
			}
		} else {
			success();
		}
    }

});
