/*
 *
 * Copyright 2009-2012 Streamsource AB
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
	var contactId;
		
	$("#components").hide().load( contextRoot + "/mypages/static/profile-components.html", function() {
		$('#login').load( contextRoot + '/mypages/static/login-components.html', function(){
    		$('#dialog-login').hide();
    		$('#dialog-message').hide();
    		
			try {
				LoginModule.init(contextRoot);
				streamsource.mypages.profile.Url.init(contextRoot);
				setupView();
			} catch (e) {
				alert(e);
			}
		});
	});
	
	function setupView() {
		if (!contactId) 
		{
			var currentUser = LoginModule.currentUser();
			if (! currentUser)
			{
				LoginModule.login( function() {
					contactId = LoginModule.currentUser().contactId;
					streamsource.mypages.profile.Request.setUser( contactId );
					streamsource.mypages.profile.Form.profile();
				});
			} else {
				streamsource.mypages.profile.Request.setUser( currentUser.contactId );
				streamsource.mypages.profile.Form.profile();
			}
		} else {
			streamsource.mypages.profile.Request.setUser( contactId );
			streamsource.mypages.profile.Form.profile();
		}
	}
 
});