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
		var header = getHeader();
    	$("#authenticationDiv").append( header );
	    addAuthenticatePlugins($("#authenticationDiv"));
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
		return currentUser;
	}
	
	inner.init = function() {
		
		loadEidPlugin();
		
		$("#login-message").append(texts.loginmessage);
		var bankId = $( "#eid_provider_link").clone().attr('id', "bankId_link");
		bankId.append( "BankId");
		bankId.click( function() {
			doAuthenticate();
		});
		var bankIdDiv = $(document.createElement('div'));
		bankIdDiv.append(bankId);
		$( "#dialog-login" ).append(bankIdDiv);
		
		var nordea = $( "#eid_provider_link").clone().attr('id', "nordea_link");
		nordea.append( "Nordea");
		nordea.click( function() {
			var verifyDTO = {
					provider : "nexus-personal_4",
				};

			verify( verifyDTO, '/surface/mypages/authenticate/verifycert'  );
		});
		var nordeaDiv = $(document.createElement('div'));
		nordeaDiv.append(nordea);
		$( "#dialog-login" ).append(nordeaDiv);
		
		var teliaSonera = $( "#eid_provider_link").clone().attr('id', "teliaSonera_link");
		teliaSonera.append( "TeliaSonera");
		teliaSonera.click( function() {
			var verifyDTO = {
					provider : "netmaker-netid_4",
				};
				
			verify( verifyDTO, '/surface/mypages/authenticate/verifycert'  );
		});
		var teliaSoneraDiv = $(document.createElement('div'));
		teliaSoneraDiv.append(teliaSonera);
		$( "#dialog-login" ).append(teliaSoneraDiv);
		
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
		var data = getChallenge( challengeDTO );
		
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
			var verifyDTO = {
				challenge : data.challenge,
				servertime : data.servertime,
				provider : "nexus-personal_4X",
				signature : authenticate.GetParam('Signature')
			};
			
			verify( verifyDTO, '/surface/mypages/authenticate/verify.json' );
		} else {
			alert('Failed to create signature! retVal = ' + retVal);
			return false;
		}
	}
	
	// ======= Eid requests ========= //

    function invoke( parameters ) {
    	var failed = false;
    	parameters.async = false; 
    	parameters.cache = false;
    	parameters.error = function(){
    		failed = true;
    	};
        $.ajax(parameters);
        if ( failed ) {
            throw parameters.message;
        }
    }
    
    function getHeader() {
    	var result;
    	var parameters = { type: 'GET', url:'/surface/eidproxy/authentication/header.htm', dataType:null, success:function(data){ result = data;}, message:texts.eidServiceUnavailable};
    	invoke(parameters);
    	return result;
    }
    
    function getChallenge( challengeDTO ) {
    	var result;
    	var parameters = { type: 'GET', url:'/surface/eidproxy/authentication/challenge.json', data:challengeDTO, success:function(data){ result = data;}, message:texts.eidServiceUnavailable};
    	invoke(parameters);
    	return result;
    }
    
    function verify( verifyDTO, url) {
    	var parameters = { type: 'POST', url:url, data:verifyDTO, message:texts.eidServiceUnavailable};
    	parameters.success = successfunction = function( data) {
			var strValue = JSON.stringify(data);
			$.cookie('SF_MYPAGES_USER', JSON.stringify(data), {expires: 1, path: '/'});
			$( "#dialog-login" ).dialog( "close" );
			$( "#user_info" ).text(LoginModule.currentUser());
		};
    	invoke(parameters);
    };
    
	return inner;
}());