/*
 *
 * Copyright 2009 Streamsource AB
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
	$('#app').load("components.html #start");

    var directive = {
     'li':{
      'link<-links':{
       'a':'link.text',
       'a@dir':'link.id',
      }
     }
    };

    var baseUrl = "surface/accesspoints/"

	$('#to_another_div').live('click', function() {
		$('#app').load('components.html #organizations_div', function () {

			$.ajax({
				url: baseUrl+'index.json',
				success: function(data) {
					$('ul').render(data, directive );
				},
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert(errorThrown );
                }
			});
		});
	});

    $('#to_organization_div').live('click', function(data) {
        $('#app').load('components.html #organization_div', function() {
          alert(data)
        });

    });

	$('#to_start').live('click', function() {
		$('#app').load("components.html #start");
	});
})
