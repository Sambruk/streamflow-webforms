/**
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
       'a@accesskey':'link.id'
      }
     }
    };

    var contextUrl = "surface/accesspoints/"
    errorHandler = function(XMLHttpRequest, textStatus, errorThrown) { alert(errorThrown ); }

    var url = function(ref, operation) {
        return ref.toString() + operation;
    };


	$('#to_another_div').live('click', function() {
		$('#app').load('components.html #organizations_div', function () {

			$.ajax({
				url: contextUrl + 'index.json',
				success: function(data) {
					$('ul').render(data, directive );
				},
                error: errorHandler
			});
		});
	});

    $('#to_organization_div').live('click', function() {
        contextUrl += $(this).attr('accesskey') + '/';
        $('#app').load('components.html #organization_div', function() {
            $.ajax({
				url: contextUrl+'index.json',
				success: function(data) {
					$('#accesspoint_name').text( data.string );

                    contextUrl += 'endusers/';
					$.ajax( {
					    url: contextUrl + 'userreference.json',
                        success: function(data) {
                           contextUrl += data.entity + '/';
                           $('#login_enduser').hide();
                           $('#to_enduser_inbox').show();
                        },
                        error: function(XMLHttpRequest, textStatus, errorThrown) {
                           $('#login_enduser').show();
                           $('#to_enduser_inbox').hide();
                        }
                    });

				},
                error: errorHandler 
			});
        });

    });

    updateInbox = function(url) {
        $.ajax({
            url: url + 'index.json',
            success: function(data) {
                if (data.links.size == 0)
                {
                    $('ul').hide();
                } else
                {
                    $('li').remove();
                    $('ul').append('<li><a href="#" id="to_case_div" accesskey=""></a></li>');
                    $('ul').show().render(data, directive );
                }
            },
            error: errorHandler
        });
    };

    var userInboxUrl

    $('#login_enduser_operation').live('click', function() {
        $('#app').load('components.html #enduser_inbox_div', function() {
            $.ajax({
                    url: contextUrl + 'selectenduser.json',
                    type: 'POST',
                    success: function(data, textStatus, XMLHttpRequest) {
                        $.ajax({
                            url: contextUrl + 'userreference.json',
                            success: function(data) {
                                contextUrl += data.entity + '/';
                                userInboxUrl = contextUrl;
                                updateInbox(contextUrl);
                            },
                            error: errorHandler
                        });
                    },
                    error: errorHandler
            });
        });
    });

    $('#to_viewenduser_div').live('click', function() {
        $('#app').load('components.html #enduser_inbox_div', function() {
            updateInbox(contextUrl);
        });
    });

    $('#create_case').live('click', function() {
        var caseName = $('#casename').attr('value');

        if ( caseName.length > 0)
        {
            $.ajax({
                url: contextUrl + 'createcase.json',
                data: 'string='+ caseName,
                type: 'POST',
                success: function() {
                    updateInbox(contextUrl);
                    $('#casename').removeAttr('value');
                },
                error: errorHandler
            });
        };
    });

    $('#to_case_div').live('click', function() {
        contextUrl += $(this).attr('accesskey') + '/';
        $('#app').load('components.html #case_div', function() {
            $.ajax({
                url: contextUrl + 'index.json',
                success: function(data) {
                    $('#case_description').text(data.description);
                }
            });
        });
    });

    $('#back_to_index').live('click', function() {
        contextUrl = userInboxUrl;
        $('#app').load('components.html #enduser_inbox_div', function() {
            updateInbox(contextUrl);
        });
    });

    $('#send_case').live('click', function() {
        $.ajax({
            url: contextUrl + "sendtofunction.json",
            type: 'POST',
            success: function(data) {
                contextUrl = userInboxUrl;
                $('#app').load('components.html #enduser_inbox_div', function() {
                    updateInbox(contextUrl);
                });
            },
            error: errorHandler
        });
    });


	$('#to_start').live('click', function() {
		$('#app').load("components.html #start");
	});
})
