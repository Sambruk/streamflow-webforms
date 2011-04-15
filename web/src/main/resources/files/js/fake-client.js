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

jQuery(document).ready(function()
{
	/*
	function getData() {
		jQuery.get( "../fake", function(data){
			alert(data);	
		} )
		.error(function(xhr) { 
			if (xhr.status == "401"){
				LoginModule.login(function () {
					getData();
				});
			}
		})
	}
*/
	function start() {
		$( "#app" ).append( $( "#pushButton").clone().attr('id', "fakePushButton") );
		$( "#fakePushButton").button().click( function() {
			RequestModule.fake(function (message){
				alert( message.message);
			});
		});
		$( "#app" ).append( $( "#pushButton").clone().attr('id', "logoutButton").text("Logout"));
		$( "#logoutButton").button().click( function() {
			LoginModule.logout();
			$("#user_info").replaceWith(LoginModule.currentUser());
		});
		var user_headline = $( "#current_user").clone().attr('id', 'user_info');
		user_headline.append(LoginModule.currentUser().name);
		$( "#app").append( user_headline );
	}
			
	$(document).ready(function() {
        try {
        	$('#components').hide().load('fake-components.html');
        	$('#login').load('login-components.html', function(){
        		$('#dialog-login').hide();
        		$('#dialog-message').hide();
        		LoginModule.init();
        		start();
        	});
        } catch ( e ) {
            alert( e );
        }
    });       
});