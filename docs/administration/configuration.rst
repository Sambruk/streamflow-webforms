Surface setup
#############

Setup Surface in VisualVM
*************************

VisualVM - Getting started
^^^^^^^^^^^^^^^^^^^^^^^^^^
    VisualVM is a managing and profiling tool included in the Java JDK installation and can be found under the installation folder in the bin directory. The simplest is to run the application on the server itself , but with the right settings of firewall etc , you can use from a client computer.

    Streamflow is utilizing this tool for managing services and configurations.

    The executable file is **JAVA_HOME/bin/jvisualvm(.exe)** or you can download it from https://visualvm.github.io/download.html

    If you run on the server and the OS is Windows then VisualVM needs to run as Administrator. VisualVM should have rights to view Java processes that belong to the system profile . Initially, you also need to install VisualVm - MBeans plugin available under Tools / Plugin.

    Under *"Local"* you need to add a JMX connection that goes against **localhost:1099**with the administrator user.

    .. image:: images/visual_vm_1_3_6.gif
        :align: center
        :width: 100%

    Service Configuration is made on **MBeans** tab under **Qi4j/StreamflowServer/**

    On the first start we need to install the *MBean* plugin to be able to manage *Streamflow*.
    Choose Tools - Plugin on the menu bar and on the tab **Available Plugins -> VisualVM-MBeans -> Install**. Follow the install wizard.

    .. image:: images/visualvm_plugin.gif
        :align: center
        :width: 100%

Connect Streamflow locally on your server
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    Right click on Local node in the tree and add a new JMX connection.
    Provide **localhost:1099** as address and the streamflow administrator user and password.

    .. image:: images/visualvm_remotehost.gif
        :align: center
        :width: 100%

Connect Streamflow remotely from your PC
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    Right click on Remote node and add a new Remote host.

    .. image:: images/visualvm_remotejmx.gif
        :align: center
        :width: 100%

    Right click on the new remote host and add a new JMX connection.

Manage Streamflow
*****************

    Open the JMX connection by double-clicking on the representing tree node.
    Change to the the MBeans tab and select/open the Qi4j tree node.
    All Qi4j applications running in this java process ( JVM ) will show up under the Qi4j node.

    .. image:: images/visualvm_mbeans.gif
        :align: center
        :width: 100%


Setup Surface in VisualVM
^^^^^^^^^^^^^^^^^^^^^^^^^

    To configure go to location showed at follow screen

    .. image:: images/visualvm_surface_streamflowproxy.png
        :align: center
        :width: 100%

    To make it possible for Surface to talk to Streamflow we have to configure the Streamflow proxy user and the Streamflow address to use for the connection to Streamflow.

    Proxy users, access points and functions connected to the access points are set up in the Streamflow administrative UI.

enabled - ``boolean``
"""""""""""""""""""""
    Tells whether this service is enabled or not.

enabled - ``String``
""""""""""""""""""""
    The streamflow proxy user password.

enabled - ``String``
""""""""""""""""""""
    The url to the streamflow surface resource.

enabled - ``String``
""""""""""""""""""""
    The username of the proxy user.

Integration on a web site (CMS)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you want to run a form as an integral part of a web site and not open the forms in a separate window, there are essentially two ways to integrate them.

#. Using an iframe. This is something all of our customers are doing today. The advantage is that it is very easy.
    Here is an example which uses this approach
    `Jonkping.se <http://www.jonkoping.se/trafikinfrastruktur/trafikochgator/parkeringarijonkopingskommun/boendeparkering/boendeparkeringansokan.4.56ba11941391f90d845259.html>`_

    Here is an example with a pop up where a forms started
    `Kalmar.se <http://www.kalmar.se/Demokrati/kontakta-kalmar-kommun/>`_
    Press the "Tyck till"

#. Let a module of the CMS load the service and return it as a natural part of the whole page.
    This is not used by any of our customers today. Because the forms uses JavaScript such a solution must modify the url to these scripts so that they are perceived to come from the same server, otherwise you will get cross-site scripting problems. Likewise, the calls that are made to the underlying server must go through this module. SiteVision has a proxy module that can do this. If EPiServer has something similar it could also be used.
