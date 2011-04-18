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
	var contexts = {
			view: 			rootView, 
			init: 			[setupUser],
			subContexts: 	null			
	};
		
	function setupView() {
		view = Contexts.findView(location.hash);
		streamsource.mypages.profile.Form.runView(view);
	}
	
	function rootView() {
		view = streamsource.mypages.profile.Form.profile;
		return view;
	}
	
	function setupUser() {
		streamsource.mypages.profile.Request.setUser('197507212475');
	}
			
//	$(window).hashchange( setupView );
	
	$("#components").load("static/profile-components.html", function() {
		try {
			Contexts.init(contexts);
			setupView();
		}
		catch (e) {
			;
		}		
	}).hide();
	
 
});