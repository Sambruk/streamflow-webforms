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

    var contextUrl = "surface/accesspoints/";
    var userInboxUrl;
    errorHandler = function(XMLHttpRequest, textStatus, errorThrown) { alert(errorThrown ); };

    updateList = function(url, list_id, element_id) {

        $.ajax({
            url: url + 'index.json',
            success: function(data) {
                if (data.links.length == 0)
                {
                    $('ul#'+list_id ).hide();
                } else
                {
                    $('ul#'+list_id+' > li:gt(0)').remove();
                    $('ul#'+list_id ).show().render(data, directive );
                }
            },
            error: errorHandler
        });
    };

    toInbox = function(userInboxUrl) {
        contextUrl = userInboxUrl;
        $('#app').load('components.html #enduser_inbox_div', function() {
            updateList(contextUrl, 'case_list', 'case_element');
        });
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
                           userInboxUrl = contextUrl;
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
                                updateList(contextUrl, 'case_list', 'case_element');
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
            updateList(contextUrl, 'case_list', 'case_element');
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
                    updateList(contextUrl, 'case_list', 'case_element');
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
            //updateList(contextUrl + 'submittedforms/', 'submitted_forms_list', 'submitted_form');
            updateList(contextUrl + 'formdrafts/',     'form_drafts_list', 'form_draft');
            updateList(contextUrl + 'requiredforms/',  'required_forms_list', 'required_form');
        });
    });

    $('#back_to_index').live('click', function() {
        toInbox( userInboxUrl );
    });

    $('#send_case').live('click', function() {
        $.ajax({
            url: contextUrl + "sendtofunction.json",
            type: 'POST',
            success: function(data) {
                toInbox(userInboxUrl );
            },
            error: errorHandler
        });
    });

    $('#create_form_draft').live('click', function() {
        var entity = $(this).attr('accesskey');
        $.ajax({
            url: contextUrl + 'requiredforms/createformdraft.json',
            type: 'POST',
            data: 'entity=' + entity,
            success: function(data) {
                updateList(contextUrl + 'formdrafts/',     'form_drafts_list', 'form_draft');
            }
        });
    });

	$('#to_start').live('click', function() {
		$('#app').load("components.html #start");
	});
})
