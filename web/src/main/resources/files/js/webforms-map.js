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
	
	inner.createUI = function(field, node) {
		
		var mapCanvas = node.find('#map-canvas').attr({
			id : 'map-canvas' + field.id
		});
		
		var mapAddress = node.find('#map-address-container').attr({
			id : 'map-address-container' + field.id
		});
		
		var mapFindMe = node.find('#map-find-me').attr({
			id : 'map-find-me' + field.id
		});
		
		mapAddress.find('.geocoding > label:first-child').text(texts.mapAddressSearch);
		mapAddress.find('.geocoding button:first-of-type').text(texts.mapAddressSearchButton);
		mapAddress.find('.reversegeocoding > label:first-child').text(texts.mapAddressLocation);
		
		return node;
	}
	
	inner.initMap = function(field, node, updateFieldCallbackFuntion) {
		field.marker = null;
		field.polyline = null;
		field.polygon = null;
		field.init = true;
		
		var mapCanvas = node.find('#map-canvas' + field.id);
		var mapAddress = node.find('#map-address-container' + field.id);
		var mapFindMe = node.find('#map-find-me' + field.id);
		var addressSearchField = mapAddress.find('.geocoding input:first-of-type');
		var adressResultNode = mapAddress.find('.reversegeocoding p:first-of-type');
		var geocodingResultList = mapAddress.find('.geocodingResultList');
		
		var coords = FormModule.settings.location.split(",");
		var startPosition = new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]));
		
		var mapOptions = {
			center : startPosition,
			zoom : FormModule.settings.zoomLevel,
			mapTypeId : google.maps.MapTypeId.ROADMAP
		};

		var map = new google.maps.Map(mapCanvas[0], mapOptions);
		field.map = map;
		
		var clearCurrentMarkersAndLines = function() {
			if (field.marker) {
				field.marker.setMap(null);
			}
			if (field.polyline) {
				field.polyline.setMap(null);
			}
			if (field.polygon) {
				field.polygon.setMap(null);
			}
		}
		
		mapAddress.find('.geocoding button:first-of-type')
		.click(function() {
			geocodingResultList.empty();
			var searchResult = geocode(addressSearchField.val(), map, function( item ) {
				var link = $('<li><a href="">' + item.address + '</a></li>').on('click', function() {
					clearCurrentMarkersAndLines();
					geocodingResultList.empty();
					addressSearchField.val("");
					field.marker = new google.maps.Marker({
					    position: item.location,
					    map: field.map
					});
					var position = field.marker.position.lat() + ", " + field.marker.position.lng();
					field.mapValue.updateLocation(position);
					map.setCenter(field.marker.position);
					map.setZoom( 14 );
						
					reverseGeocode(field.marker.position, adressResultNode, field, function() {
						updateFieldCallbackFuntion( field.id, JSON.stringify(field.mapValue.value));
					});
					return false;
				});
				geocodingResultList.append(link);
			}, function() {
				geocodingResultList.append('<li>' + texts.mapAddressAddressNotFound + '</li>');
			});
		});
		
		// Click the button if the user hits 'enter' in the searchfield
		addressSearchField.keyup(function(event){
		    if(event.keyCode == 13){
		    	mapAddress.find('.geocoding button:first-of-type').click();
		    }
		});
		
		var selectedDrawingModes = new Array();
		var initDrawingMode = null;
		if (field.mapValue) {
			if (field.mapValue.isPoint) {
				initDrawingMode = google.maps.drawing.OverlayType.MARKER;
			} else if (field.mapValue.isPolyline) {
				initDrawingMode = google.maps.drawing.OverlayType.POLYLINE;
			} else if (field.mapValue.isPolygon) {
				initDrawingMode = google.maps.drawing.OverlayType.POLYGON;
			}
		}
		
		if (field.fieldValue.point) {
			selectedDrawingModes.push(google.maps.drawing.OverlayType.MARKER);
			if (!initDrawingMode) {
				initDrawingMode = google.maps.drawing.OverlayType.MARKER;
			}
		}
		if (field.fieldValue.polyline) {
			selectedDrawingModes.push(google.maps.drawing.OverlayType.POLYLINE);
			if (!initDrawingMode) {
				initDrawingMode = google.maps.drawing.OverlayType.POLYLINE;
			}
		}
		if (field.fieldValue.polygon) {
			selectedDrawingModes.push(google.maps.drawing.OverlayType.POLYGON);
			if (!initDrawingMode) {
				initDrawingMode = google.maps.drawing.OverlayType.POLYGON;
			}
		}
		var drawingManager = new google.maps.drawing.DrawingManager({
			drawingMode: initDrawingMode,
			drawingControlOptions: {
			    position: google.maps.ControlPosition.TOP_CENTER,
			    drawingModes: selectedDrawingModes
			},
			drawingControl: true,
			markerOptions: {
				draggable: true
			},
			
		});
		drawingManager.setMap(map);
		
		if (navigator.geolocation) {
			var btnFindMe = node.find('#btn-find-me').attr({id : 'btn-find-me' + field.id });
			btnFindMe.click(function() {
				navigator.geolocation.getCurrentPosition(function(position) {
					geocodingResultList.empty();
					addressSearchField.val("");
					field.marker = new google.maps.Marker({
						position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
						map: field.map
					});
					var position = position.coords.latitude + ", " + position.coords.longitude;
					field.mapValue.updateLocation(position);
					map.setCenter(field.marker.position);
					map.setZoom( 14 );
						
					reverseGeocode(field.marker.position, adressResultNode, field, function() {
						updateFieldCallbackFuntion( field.id, JSON.stringify(field.mapValue.value));
					});
				});
			});
			
			mapFindMe.append(btnFindMe.append(texts.findme));
		} else {
			node.find('#btn-find-me').hide();
		}
		
		field.refreshUI();
		
		google.maps.event.addListener(drawingManager, 'markercomplete', function(newMarker) {
			clearCurrentMarkersAndLines();
			
			field.marker = newMarker;
			var position = newMarker.position.lat() + ", " + newMarker.position.lng();
			field.mapValue.updateLocation(position);
			reverseGeocode(newMarker.position, adressResultNode, field, function() {
				updateFieldCallbackFuntion( field.id, JSON.stringify(field.mapValue.value));
			});
			
		});
		
		google.maps.event.addListener(drawingManager, 'polylinecomplete', function(newLine) {
			clearCurrentMarkersAndLines();
			
			field.marker = newLine;
			var position = newLine.getPath().getArray().toString();
			field.mapValue.updateLocation(position);

			reverseGeocode(newLine.getPath().getArray()[0], adressResultNode, field, function() {
				updateFieldCallbackFuntion( field.id, JSON.stringify(field.mapValue.value));
			});
		});
		
		google.maps.event.addListener(drawingManager, 'polygoncomplete', function(newSurface) {
			clearCurrentMarkersAndLines();

			// Add the first position as the last so that we know that it's a surface
			newSurface.getPath().getArray().push(newSurface.getPath().getArray()[0]);
			field.marker = newSurface;
			var position = newSurface.getPath().getArray().toString();
			field.mapValue.updateLocation(position);

			reverseGeocode(newSurface.getPath().getArray()[0], adressResultNode, field, function() {
				updateFieldCallbackFuntion( field.id, JSON.stringify(field.mapValue.value));
			});
			
		});

		google.maps.event.addListener(drawingManager, 'drawingmode_changed', function(){
			if (drawingManager.drawingMode != null) {
				clearCurrentMarkersAndLines();
			}
		}); 
	}
	
	inner.refreshUI = function(field) {
		if (field.mapValue) {
			var adressResultNode = field.node.find('#map-address-container' + field.id).find('.reversegeocoding p:first-of-type');
			// Detect if it's a single point or a line/surface
			if (field.mapValue.isPoint) {
				if (field.marker) {
					field.marker.setMap(null);
				}
				field.marker = new google.maps.Marker({
				    position: new google.maps.LatLng(field.mapValue.path[0].latitude, field.mapValue.path[0].longitude),
				    map: field.map
				});
				if (!field.mapAddress) {
					reverseGeocode(field.marker.position, adressResultNode, field );
				} else {
					adressResultNode.text(field.mapAddress);
				}
				if (field.init) {
					field.init = false;
					field.map.setCenter(field.marker.position);
					field.map.setZoom( 14 );
				}
			} else {
				var path = new Array();
				$.each( field.mapValue.path, function(index, position) {
					path.push(new google.maps.LatLng(position.latitude, position.longitude));
				});
			
				if (field.mapValue.isPolyline) {
					field.polyline = new google.maps.Polyline();
					field.polyline.setPath(path);
					field.polyline.setMap( field.map );

				} else if (field.mapValue.isPolygon) {
					field.polygon = new google.maps.Polygon();
					field.polygon.setPath(path);
					field.polygon.setMap( field.map );
				}
				if (!field.mapAddress) {
					reverseGeocode(path[0], adressResultNode, field );
				} else {
					adressResultNode.text(field.mapAddress);
				}
				if (field.init) {
					field.init = false;
					if (path.length > 0) {
						field.map.setCenter(path[0]);
						field.map.setZoom( 14 );
					}
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
	
	
	function reverseGeocode( position, resultNode, field, successFunction) {
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
	
	function geocode(searchTerm, map, successFunction, errorFunction ){
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