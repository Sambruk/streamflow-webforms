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


streamsource.mypages.profile.Request = (function() {
	
	var inner = {};
	
	var _userId = null;
	
	function getUrl() {
		return streamsource.mypages.profile.Url;
	}
	
	/*
	 *  Creates and returns an empty profile JSON structure.
	 */
	inner.profileJSON = function () {
		result = {
				"addresses":[],
				"company":null,
				"contactId":_userId,
				"emailAddresses":[],
				"isCompany":false, 
				"name":null,
				"note":null,
				"phoneNumbers":[],
				"picture":null
		};
		return result;
	}
	
	/*
	 * Creates and returns an empty email JSON structure.
	 */
	inner.emailJSON = function() {
		result = {
				"contactType":"HOME", 
				"emailAddress": null
		};
		return result;
	}
	
	/*
	 * Create and returns an empty phone number JSON structure.
	 */
	inner.phonenumberJSON = function() {
		result = {
				"contactType":"HOME",
				"phoneNumber":null
		};
		return result;
	}
	
	/*
	 * Create and returns an emtpy address JSON structure.
	 */
	inner.addressJSON = function() {
		result = {
				"contactType": "HOME",
				"address": null,
				"zipCode": null,
				"city": null,
				"region": null,
				"country":null
		}
		return result;
	}
	
	/*
	 * 
	 */
	inner.setUser = function(userId) {
		_userId = userId;
	}
	
	function request(type, url) {
        return {type:type, url:url, async:false, cache:false, error:errorPopup, dataType:'json'};
    }
	
	function getData( parameters ) {
        parameters.error = function(xhr) { 
			if (xhr.status == "401"){
				LoginModule.login(function () {
					$.ajax(parameters);
				});
			} else
			{
		        errorPopup();
			}
		};
        $.ajax(parameters);
    }
	
	function invoke( fn, arguments, message ) {
        var failed = false;
        if( !arguments.error ) {
        	arguments.error = function() {  failed = true; };
        }
        var result = fn( arguments );
        if ( failed ) {
            throw message;
        }
        return result;
    }
	
	function errorPopup() {
		throw "http call failed";
	}
	
	/*
	 * Retrieves the profile data for the specified
	 * user id and calls the specified callback with 
	 * the retrieved data, i.e. user profile JSON structure.
	 */
	inner.get = function(callback) {
		//url = streamsource.mypages.profile.Url.profileUrl(_userId, '/index.json');
		//$.get(url, callback);	
		var parameters = request('GET', streamsource.mypages.profile.Url.profileUrl(_userId, '/index.json') );
		parameters.success = callback;
        return invoke( getData, parameters, texts.eidServiceUnavailable );
	}
	
	
	/*
	 * Updates the profile for the current user.
	 */
	inner.update = function(profileData, callback) {
		//url = streamsource.mypages.profile.Url.profileUrl(_userId, '/' + 'update');				
		//$.post(url, profileData, callback);
		var parameters = request('POST', streamsource.mypages.profile.Url.profileUrl(_userId, '/update') );
		parameters.data = profileData;
		parameters.success = callback;
        return invoke( getData, parameters, texts.eidServiceUnavailable );
	}				
	
	return inner;
}());