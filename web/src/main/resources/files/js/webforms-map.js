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
		
	function MapValue( mapFieldValue ) {
		this.path = new Array();
		this.value = mapFieldValue;
		
		return this;
	}
	
	MapValue.prototype.clearAddress = function() {
		self = this;
		self.value.street = "";
		self.value.zipcode = "";
		self.value.city = "";
		self.value.country = "";
	}
	
	MapValue.prototype.updateLocation = function(newLocation){
		self = this;
		self.path = new Array();
		self.value.location = newLocation;
		self.isPoint = false;
		self.isPolyline = false;
		self.isPolygon = false;
		
		if (newLocation) {
			if (newLocation.indexOf("(") == -1) {			
				self.isPoint = true;
				self.path.push(new LatLong(newLocation));
				
			} else {
				$.each( newLocation.split('),'), function(index, position) {
					self.path.push(new LatLong(position));
				});
				// If first point is the same as the last one its a polygon
				if (self.path[0].equals( self.path[self.path.length-1])) {
					self.isPolygon = true;
				} else {
					self.isPolyline = true;
				}
			}
		} 
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
	
	
	inner.reverseGeocode = function( position, resultNode, field, successFunction) {
		getGeocoder().geocode({'latLng': position}, function(results, status) {
			
		    if (status == google.maps.GeocoderStatus.OK) {
		      if (results[1]) {
		    	  field.mapAddress = results[0].formatted_address;
		    	  resultNode.text(field.mapAddress);
		    	  field.mapValue.clearAddress();
		    	  $.each(results[0].address_components, function(){
		    		  	if(this.types[0]=="street_number"){
		    		  		if (field.mapValue.value.street && field.mapValue.value.street.length > 0) {
		    		  			field.mapValue.value.street = field.mapValue.value.street + " " + this.short_name;
		    		  		} else {
		    		  			field.mapValue.value.street = this.short_name;
		    		  		}
		    		    }
		    		    if(this.types[0]=="route"){
		    		    	if (field.mapValue.value.street && field.mapValue.value.street.length > 0) {
		    		    		field.mapValue.value.street = this.short_name + " " + field.mapValue.value.street;
		    		  		} else {
		    		  			field.mapValue.value.street = this.short_name;
		    		  		}
		    		    }
		    		    if(this.types[0]=="postal_code"){
		    		        field.mapValue.value.zipcode=this.short_name;
		    		    }
		    		    if(this.types[0]=="postal_town"){
		    		        field.mapValue.value.city=this.short_name;
		    		    }
		    		    if(this.types[0]=="country"){
		    		        field.mapValue.value.country=this.short_name;
		    		    }
		    		});
		      } else {
		    	  resultNode.text(texts.mapAddressLocationNotFound);
		      }
		      successFunction();
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
		var mapValue = new MapValue(fieldValue);
		mapValue.updateLocation(fieldValue.location);
		return mapValue;
	}
	
	return inner;
	
}());