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
streamsource.ClientSession = function() {
	
	function SessionData (name) {
		if ( !name ) {
			throw new Error("Name for the session missing");
		}
		var self = this;
		
		this.name = name;
		var persistStore = new Persist.Store(name);
		
		this.storage = function() {
			return persistStore;
		};
	};
	
	SessionData.prototype.getAttribute = function(name) {
		var result = null;
		this.storage().get(name, function(ok, val){
			if(ok) {
				result = val;
			}
		});
		return result;
	};
	
	SessionData.prototype.setAttribute = function(name, value) {
		if ( !name ) {
			throw new Error("Name of attribute missing");
		}
		this.storage().set(name, value);
	};
	
	SessionData.prototype.clearAttribute = function(name) {
		/* TODO Fix remove so it works */
		/* this.storage().remove(name); */
		this.setAttribute(name, null);
	};
	
	var inner = {};
	/* Add some stuff in here */
	
	/*
	 * Associates a value with a given name. If there
	 * already is a value associated with the name it
	 * will be replaced.
	 */
	inner.createSession = function(name) {
		return new SessionData(name);
	};
	
	return inner;
}();