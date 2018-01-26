Surface restyling
#################

How to tweak the look & feel of WebForms
****************************************
    To change the look and feel of Surface WebForms you have to create a new css file and configure the WebForms server to include it in the page. How this configuration is done is described here and further down in the document there are two different instructions on how to create your own custom css file.

Configure Surface WebForms with a custom css file
-------------------------------------------------
    Make sure to publish the css file with your custom settings somewhere where it is accessible from internet i.e. someplace on your website.

    All configuration of the server is done through JMX and the tool VisualVM is often used for this task. The document :doc:`../administration/configuration` describes how to get started using ViusalVM.

Configure the external css url
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     .. image:: images/viusalvm-webforms-css.png
        :align: center
        :width: 100%

    Browse the the MBeans tree *"Qi4J" -> "Surface" -> "Application" -> "Index" -> "Service" -> "indexrestlet" -> "configuration"*.

    Set the complete url to your css file in the field "cssUrl" and then set "eanbled" to "true".
    Example:

    * **cssUrl:** `http://demo.sf.streamsource.se/custom.css`

    * **enabled:** `true`

    Then switch tab from **Attributes** to **Operations** and hit the **restart** button.

How to create a custom CSS file
-------------------------------

Alternative 1: Manual
^^^^^^^^^^^^^^^^^^^^^
    Use an inspector such as Firebug or the developer tools in Google Chrome and locate the css class of the element that you want to tweak. Add this class to your css file and give it your new settings. There is an example css file attached with some common classes to override. You could use this as a starting point and then add whatever you need to tweak.
    Publish the file to a webserver and configure surface WebForms as describe above.

Alternative 2: Using Bootstrap
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    We use Twitter Bootstrap as framework for the Surface WebForm application. On the download site for Boostrap there is a possibillity do a lot of manual settings before downloading.

    #. Browse to the url: http://twitter.github.com/bootstrap/customize.html
    #. Skip section "1. Choose components" and "2. Select jQuery plugins" and go directly to "3. Customize variables"
    #. Modify the default settings to give it your desired look and feel.
    #. Download the files using the large button "Customize and download" at the end of the page
    #. Unzip the files and locate the file "../css/boostrap.min.css"
    #. Publish that file to a webserver and configure surface WebForms as described above.

Examples
********

CSS files
---------
    :download:`Simple CSS <files/simple_example.css>`.

    :download:`Kalmar CSS file <files/simple_example.css>`.

Usage
-----
    :download:`Kalmar iframe pop-up .pdf <files/simple_example.css>`.

    :download:`Kalmar iframe pop-up .pptx <files/simple_example.css>`.

    :download:`Jonkoping iframe integrated .pdf<files/simple_example.css>`.

    :download:`Jonkoping iframe integrated .pptx<files/simple_example.css>`.

