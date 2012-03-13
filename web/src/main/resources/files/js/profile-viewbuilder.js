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
streamsource.mypages.profile.Form = (function() {
	
	var inner = {};
    var messages = {};
	var TEMPLATE_ELEMENT_ID = 'components';
	var PROFILE_FORM_CLASS = 'mypages_profile_form';
	var PROFILE_FORM_ID = 'profile_form';
	
	function getRequest() {
		return streamsource.mypages.profile.Request;
	}
	
	function create(elementName) {
		return document.createElement(elementName);
	}
	
	/*
	 * Create a text input element with a label.
	 * 
	 * params:
	 * 	name	- the name and id value used for the input element
	 * 	label	- The label value
	 *  value   - The input elements value
	 *  parent  - The parent element where the label and input element
	 *  		will be added as childs
	 *  
	 * returns:
	 * 	A dictionary with a 'label' and a 'text' field.
	 */
	function createTextInput(name, label, value, parent) {
		
		labelElement = create("label");
		labelElement.htmlFor = name;
		labelElement.innerHTML = label;
		labelElement.className = 'profile_label';
		
		textElement = create("input");
		textElement.id = name;
		textElement.name = name;
		textElement.value = value;
		
		result = {"label": labelElement, "text": textElement};
		
		if ( parent ) {
			parent.appendChild(result.label);
			parent.appendChild(result.text);
		}
		return result;
	}
				
	/*
	 * params:
	 *   emailFieldset		- A fieldset element where label and text
	 *   		fields for email addresses are added as children.
	 *   
	 *   emailAddresses		- An array of email addresses according to 
	 *   		the following structure:
	 *   
	 *   	{"emailAddress": "", "contactType": "HOME"}
	 */
	function buildEmailFields(emailFieldset, emailAddresses) {
		var email = null;
		if ( emailAddresses === null || emailAddresses.length == 0 ) {
			email = {"emailAddress":""};
		}
		else {
			email = emailAddresses[0];
		}
		
		legendElm = emailFieldset.getElementsByTagName('legend');
		if ( legendElm ) {
			legendElm[0].innerHTML = texts.labelemailaddresses;
		}
		createTextInput('email', texts.labelemail, email.emailAddress, emailFieldset);
	}
	
	/*
	 * params:
	 *   phoneFieldset      - Required, a fieldset element where the label and text
	 *      field for phone numbers are added as children.
	 *      
	 *   phoneNumbers 		- Required, is an array of one or more phone
	 *   	numbers according to the following structure:
	 *   	
	 *   	{"phoneNumber": "", "contactType": "HOME"} 
	 */
	function buildPhoneFields(phoneFieldset, phoneNumbers) {
		var phonenumber = null;
		if ( phoneNumbers === null || phoneNumbers.length == 0 ) {
			phonenumber = {"phoneNumber": ""};
		}
		else {
			phonenumber = phoneNumbers[0];
		}
		
		legendElm = phoneFieldset.getElementsByTagName('legend');
		if ( legendElm ) {
			legendElm[0].innerHTML = texts.labelphones;
		}
		
		createTextInput('phone', texts.labelphone, phonenumber.phoneNumber, phoneFieldset);
	}
	
	/*
	 * params:
	 * 	 addressFieldset		- Required, a fieldset element where label and text
	 * 		input fields for address data are added.
	 * 
	 * 	 addresses				- Required, an array of address objects according to 
	 * 		the following structure:
	 * 
	 * 		{
	 * 			"address" : "",
	 * 			"zipCode" : "",
	 * 			"city"	  : "",
	 *          "region"  : "",
	 *          "country" : "",
	 *          "contactType" : "HOME"
	 * 		}
	 */
	function buildAddressFields(addressFieldset, addresses) {
		
		var address = null;
		if ( addresses === null || addresses.length == 0 ) {
			address = {"address":"", "city":"", "country":"", "region":"", "zipCode": ""};
		}
		else {
			address = addresses[0];
		}

		legendElm = addressFieldset.getElementsByTagName('legend');
		if ( legendElm ) {
			legendElm[0].innerHTML = texts.labeladdresses;
		}
		
		createTextInput('address', texts.labeladdress, address.address, addressFieldset);
		createTextInput('zipCode', texts.labelzipcode, address.zipCode, addressFieldset);
		createTextInput('city', texts.labelcity, address.city,addressFieldset);				
		createTextInput('region', texts.labelregion, address.region, addressFieldset);				
		createTextInput('country', texts.labelcountry, address.country, addressFieldset);
	}
	
				
	/*
	 * UTIL: Clones a DOM element found with the specified
	 * selector as a child of the source element. The function 
	 * returns the cloned element is returned. 
	 */
	function cloneElement(sourceElement, selector) {
		result = null;
		if ( sourceElement && selector ) {
			result = $(selector, sourceElement).clone();
		}
		return result.get(0);
	}
	
	function clone(id, newId) {
		if (!newId)
			return $('#' + id).clone().attr('id', 'inserted_' + id);
		return $('#' + id).clone().attr('id', newId);
	}

	/*
	 * Build the form and populate it with the specified data.
	 */
	function buildForm(containerElement, data) {
		sourceElement = document.getElementById(TEMPLATE_ELEMENT_ID);
		
		selector = "form." + PROFILE_FORM_CLASS; 
		formElement = cloneElement(sourceElement, selector);
		formElement.id = PROFILE_FORM_ID;
		
		fieldSet = formElement.getElementsByTagName('fieldset');
		for( i = 0; i < fieldSet.length; i++ ) {
			fieldsetElement = fieldSet[i];
			className = fieldsetElement.className;
			id = fieldsetElement.id;
			if ( 'emails' === id ) {
				buildEmailFields(fieldsetElement, data.emailAddresses);
			}
			else if ( 'phones' === id ) {
				buildPhoneFields(fieldsetElement, data.phoneNumbers);
			}
			else if ( 'addresses' === id ) {
				buildAddressFields(fieldsetElement, data.addresses);
			}					
		}
		
//		$('button', formElement).html('Uppdatera').bind('click', buttonClicked);				
		containerElement.appendChild(formElement);
		var userObj = LoginModule.currentUser();
		$('#profile-header').text(texts.labelprofileheader);
		$('#user-info').text(userObj.name + ' - ' + userObj.contactId);
		$('#profile_submit submit_text').text(texts.labelupdate);
		$('#profile_submit').click(buttonClicked);	
	}
				
	/*
	 * Event handler function for the one and only button being
	 * clicked. It will update the current profile information
	 * by posting it to the server.
	 */
	function buttonClicked(event) {
		if ( event ) {
			event.preventDefault();
		}
		
//		profileJSON = buildProfileJSON();
//		$(.mypages_profile_form).serialize()
		try {
			getRequest().update($("#profile_form").serialize(), function (response, status) {
				// Notify user of successful save! (or error)
				messages = { info: texts.profilesuccessfulupdate };
	            showMessages();
			});
		} catch ( e ) {
            messages = { error: e.info };
            showMessages();
		}
	}

	function buildProfileJSON() {
		emailJSON = extractEmails()[0];
//		getRequest().update(emailJSON, function(response, status) {
//			;
//		});
		
		phoneJSON = extractPhonenumbers()[0];
//		getRequest().update(phoneJSON, function(response, status){
//			;
//		});
						
		addressJSON = extractAddresses()[0];
//		getRequest().update(addressJSON, function(response, status){
//			;
//		});		
		
		profileJSON = getRequest().profileJSON();
		profileJSON.emailAddresses[0] = emailJSON = extractEmails()[0];
		profileJSON.phoneNumbers[0] = emailJSON = extractPhonenumbers()[0];
		profileJSON.addresses[0] = emailJSON = extractAddresses()[0];
		
		return profileJSON;
		
	}
	
	// Data extraction functions
	/*
	 * Extract email addresses on the form and return
	 * them as an array of JSON objects. This currently only return
	 * a single object, in future there might be more...
	 */
	function extractEmails() {				
		result = getRequest().emailJSON();
		result.emailAddress = $("#email").attr('value');
		return [result];
	}
	
	/*
	 * Extract phone numbers on the form and return them as an
	 * array of JSON objects. This currently only return a single
	 * object, in future there might be more... 
	 */
	function extractPhonenumbers() {
		result = getRequest().phonenumberJSON();
		result.phoneNumber = $("#phone").attr('value');
		return [result];
	}
	
	/*
	 * Surprise, surprise. This function extracts addresses on the form and
	 * return as an array of JSON objects....
	 */
	function extractAddresses() {
		result = getRequest().addressJSON();
		result.address = $("#address").attr('value');
		result.zipCode = $("#zipCode").attr('value');
		result.city = $("#city").attr("value");
		result.region = $("#region").attr("value");
		result.country = $("#country").attr("value");
		return [result];
	}
	
    function showMessages() {
        if ( messages && messages.info ) {
            $('#app').prepend( clone( 'InfoMessage' ).append( messages.info ) );
        }
        if ( messages && messages.warning ) {
            $('#app').prepend( clone( 'WarningMessage' ).append( messages.warning ) );
        }
        if ( messages && messages.error ) {
            $('#app').prepend( clone( 'ErrorMessage' ).append( messages.error ) );
        }
        messages = {};
    }

	
	/*
	 * Public function that will setup and render the form
	 */
	inner.profile = function() {
		
		containerElement = document.getElementById('app');		
		if ( !containerElement ) {
			return;
		}
		
		$(containerElement).empty();
		
		callback = function(profileData) {
			buildForm(containerElement, profileData);
		};
		
		getRequest().get(callback);		
	};
		
	return inner;
}());