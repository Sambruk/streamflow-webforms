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


/**
 * Module that handles the Google Maps api
 */
var MapModule = (function() {
	var inner = {};
	
	var geocoder = null;
	
	function MapValue( fieldValue ) {
		this.path = new Array();
		this.isPoint = false;
		this.isPolyline = false;
		this.isPolygon = false;
		
		if ( fieldValue == "")
			return this;
		
		var path = this.path;
		
		if (fieldValue.indexOf("(") == -1) {			
			this.isPoint = true;
			path.push(new LatLong(fieldValue));
			
		} else {
			$.each( fieldValue.split('),'), function(index, position) {
				path.push(new LatLong(position));
			});
			// If first point is the same as the last one its a polygon
			if (path[0].equals( path[path.length-1])) {
				this.isPolygon = true;
			} else {
				this.isPolyline = true;
			}
		}
		return this;
	}
	
	function SearchResultItem( result ) {
		var address = "";
		var location = null;
		
		this.address = result.formatted_address;
		this.location = result.geometry.location;
		
		return this;
	}
	
	function LatLong( fieldValueString ) {
		var latLong = fieldValueString.split(',');
		this.latitude = cleanUpPosition(latLong[0]);
		this.longitude = cleanUpPosition(latLong[1]);
	}
	
	LatLong.prototype.equals = function( second ) {
		return this.latitude === second.latitude && this.longitude === second.longitude;
	}
	
	function cleanUpPosition( position) {
		if (position.indexOf("(") == 0) {
			position = position.substring(1);
		}
		if (position.indexOf(")") != -1) {
			position = position.substring(0, position.indexOf(")"));
		}
		return $.trim(position);
	}
	
	function getGeocoder() {
		if (!geocoder)
			geocoder = new google.maps.Geocoder();
		return geocoder;
	}
	
	
	inner.reverseGeocode = function( position, resultNode, field) {
		getGeocoder().geocode({'latLng': position}, function(results, status) {
			
		    if (status == google.maps.GeocoderStatus.OK) {
		      if (results[1]) {
		    	  field.mapAddress = results[0].formatted_address;
		    	  resultNode.text(field.mapAddress);
		      } else {
		    	  addressField.text(texts.mapAddressLocationNotFound);
		      }
		    }
		});
	}
	
	inner.geocode = function(searchTerm, map, successFunction, errorFunction ){
		var request = { 
				'address': searchTerm,
				'bounds' : map.getBounds()
				};
		
		getGeocoder().geocode( request, function(results, status)  {
			if (status == google.maps.GeocoderStatus.OK) {
				$.each( results, function(index, result) {
					successFunction( new SearchResultItem(result));
				});
			} else {
				errorFunction();
			}
		})
	}

	inner.createMapValue = function( fieldValue){
		return new MapValue(fieldValue);
	}
	
	return inner;
	
}());