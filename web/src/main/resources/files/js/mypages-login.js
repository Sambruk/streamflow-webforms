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
var LoginModule = (function() {
    var inner = {};
	
	var username, password, allFields, tips;

	function updateTips( t ) {
		tips
			.text( t )
			.addClass( "ui-state-highlight" );
		setTimeout(function() {
			tips.removeClass( "ui-state-highlight", 1500 );
		}, 500 );
	}
	
	function checkLength( o, n, min, max ) {
		if ( o.val().length > max || o.val().length < min ) {
			o.addClass( "ui-state-error" );
			updateTips( "Length of " + n + " must be between " +
				min + " and " + max + "." );
			return false;
		} else {
			return true;
		}
	}
	
	function checkRegexp( o, regexp, n ) {
		if ( !( regexp.test( o.val() ) ) ) {
			o.addClass( "ui-state-error" );
			updateTips( n );
			return false;
		} else {
			return true;
		}
	}
	
	inner.logout = function() {
		$.cookie('SF_MYPAGES_USER', null, {path: '/'});
	};
	
	inner.login = function(successFunction) {
		$( "#dialog-login" ).bind( "dialogbeforeclose", function(event, ui) {
			  successFunction();
			});
		$( "#dialog-login" ).dialog( "open" );
	};

	inner.currentUser = function() {
		return JSON.parse($.cookie("SF_MYPAGES_USER"));
	};
	
	inner.init = function() {
		
		username = $( "#username" ),
		password = $( "#password" ),
		allFields = $( [] ).add( username ).add( password ),
		tips = $( ".validateTips" );
		
		$( "#dialog-login" ).dialog({
			autoOpen: false,
			height: 300,
			width: 350,
			modal: true,
			buttons: {
				"Login": function() {
					var bValid = true;
					allFields.removeClass( "ui-state-error" );
		
					bValid = bValid && checkLength( username, "username", 3, 16 );
					bValid = bValid && checkLength( password, "password", 5, 16 );
		
					bValid = bValid && checkRegexp( username, /^[a-z]([0-9a-z_])+$/i, "Username may consist of a-z, 0-9, underscores, begin with a letter." );
					bValid = bValid && checkRegexp( password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );
		
					if ( bValid ) {
						jQuery.get( "../login", { username: username.val(), password: password.val() } ,function(data){
							var strValue = JSON.stringify(data);
							$.cookie('SF_MYPAGES_USER', JSON.stringify(data), {expires: 1, path: '/'});
							$( "#dialog-login" ).dialog( "close" );
						} )
						.error(function() { 
							$( "#dialog-message" ).dialog({
								modal: true,
								buttons: {
									Ok: function() {
										$( this ).dialog( "close" );
										username.focus();
										username.select();
									}
								}
							});}
						);
					}
				},
				Cancel: function() {
					$( "#dialog-login" ).unbind( "dialogbeforeclose");
					$( this ).dialog( "close" );
				}
			},
			close: function() {
				allFields.val( "" ).removeClass( "ui-state-error" );
			}
		});
    };
		
	return inner;
}());