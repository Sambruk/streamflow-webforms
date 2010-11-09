/***
@title:
Removable File Upload

@version:
1.0

@author:
Andreas Lagerkvist

@date:
2010-09-27

@url:
http://andreaslagerkvist.com/jquery/removable-file-upload/

@license:
http://creativecommons.org/licenses/by/3.0/

@copyright:
2010 Andreas Lagerkvist (andreaslagerkvist.com)

@requires:
jquery

@does:
This plug-in adds a "remove"-link next to input[type=file]:s that allows the user to remove a selected file from the input.

@howto:
jQuery('#file-uploader input[type=file]').removableFileUpload(); would make the input with type=file in the #file-uploader element removable.

@exampleHTML:
<input type="file" name="foo"/>

@exampleJS:
$('#jquery-removable-file-upload-example input[type=file]').removableFileUpload();
***/
jQuery.fn.removableFileUpload = function (conf) {
	var config = jQuery.extend({
		remove:	'remove'
	}, conf);

	return this.each(function () {
		var input		= $(this);
		var remove		= $('<span class="jquery-removable-file-upload"><strong></strong> [<a href="#">' + config.remove + '</a>]</span>').insertAfter(input).hide();
		var onchange	= function () {
			var file = input.val();
				file = file.substring(file.lastIndexOf('\\') + 1);

			if (file) {
				remove.show().find('strong').text(file);
			}
			else {
				remove.hide();
			}
		};

		input.change(onchange);

		remove.find('a').click(function () {
			remove.hide();

			input = $('<input type="file" name="' + input.attr('name') + '"/>').replaceAll(input).change(onchange);

			return false;
		});
	});
};
