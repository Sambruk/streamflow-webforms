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
	
	function loadEidPlugin() {
    	$("#authenticationDiv").append( RequestModule.getHeader() );
	    addAuthenticatePlugins($("#authenticationDiv"));
    }
	
	function getUrlParams(){
	    var vars = [], param;
	    var params = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	    for(var i = 0; i < params.length; i++)
	    {
	      param = params[i].split('=');
	      vars.push(param[0]);
	      vars[param[0]] = param[1];
	    }
	    return vars;
	 }
	  
	function getUrlParam(name){
	    return getUrlParams()[name];
	}
	
	inner.logout = function() {
		$.cookie('SF_MYPAGES_USER', null, {path: '/'});
	}

	inner.login = function(successFunction) {
		$( "#dialog-login" ).bind( "dialogclose", function(event, ui) {
			  successFunction();
			});
		$( "#dialog-login" ).dialog( "open" );
	}
	
	inner.currentUser = function() {
		var cookieValue = $.cookie("SF_MYPAGES_USER");
		var currentUser = JSON.parse(cookieValue);
		var currentUser = JSON.parse(currentUser);
		if (currentUser)
			return currentUser.name;
		else 
			return "Not logged in";
	}
	
	inner.init = function() {
		
		loadEidPlugin();
		
		$("#login-message").append(texts.loginmessage);
		var bankId = $( "#eid_provider_link").clone().attr('id', "bankId_link");
		bankId.append( "BankId");
		bankId.click( function() {
			doAuthenticate();
		});
		$( "#dialog-login" ).append('<div>').append(bankId).append('</div>');
		
		var nordea = $( "#eid_provider_link").clone().attr('id', "nordea_link");
		nordea.append( "Nordea");
		nordea.click( function() {
			$.ajax( {url: 'https://localhost:8444/login-ajax/login/validateclientcert', success: function(data) {
				alert("You are logged in...");
				$( "#dialog-login" ).dialog( "close" );
				$( "#user_info" ).text(LoginModule.currentUser());
			}, dataType: "json",
			error: function(data) {
				alert(data);
			}});
		});
		$( "#dialog-login" ).append('<div>').append(nordea).append('</div>');
		
		var teliaSonera = $( "#eid_provider_link").clone().attr('id', "teliaSonera_link");
		teliaSonera.append( "TeliaSonera");
		teliaSonera.click( function() {
			alert("You selected TeliaSonera...");
		});
		$( "#dialog-login" ).append('<div>').append(teliaSonera).append('</div>');
		
		$( "#dialog-login" ).dialog({
			autoOpen: false,
			height: 300,
			width: 350,
			modal: true,
			buttons: {
				Cancel: function() {
					$( "#dialog-login" ).unbind( "dialogclose");
					$( this ).dialog( "close" );
				}
			}
		});
    }
		
	function doAuthenticate() {
		var authenticate = document.auth;
		
		var challengeDTO = {
			provider: "nexus-personal_4X"
	    };
		var data = RequestModule.getChallenge( challengeDTO );
		
		retVal = authenticate.SetParam('Challenge', data.challenge);
		if (0 != retVal) {
			alert("SetParam Challenge to '" + data.challenge + "' did not return zero.\n	"
					+ "retVal = " + retVal);
		}
		retVal = authenticate.SetParam('ServerTime', data.servertime);
		if (0 != retVal) {
			alert("SetParam ServerTime to '" + data.servertime + "' did not return zero.\n	"
					+ "retVal = " + retVal);
		}
		retVal = authenticate.PerformAction('Authenticate');

		if (retVal == 0) {
			document.LogonForm.signature.value = authenticate
					.GetParam('Signature');
		} else {
			alert('Failed to create signature! retVal = ' + retVal);
			return false;
		}

		var verifyDTO = {
			challenge : data.challenge,
			servertime : data.servertime,
			//signature : document.LogonForm.signature.value
		};
		
		RequestModule.verify( verifyDTO , function() {
			  $( "#dialog-login" ).dialog( "close" );
			  $( "#user_info" ).text(LoginModule.currentUser());
		});
	}
	return inner;
}());