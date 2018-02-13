Streamflow server setup
#######################

In order to make surface work at server part needed to perform some configuration

Setup proxy user
****************

#. Open main container at admin tool

    .. image:: images/sf-core_admin_proxy_window.png
        :align: center
        :width: 100%

#. Chose **Proxy Users** tab on the left
#. Click **Add** button on the bottom
#. Input description and password at opened modal

    .. image:: images/sf-core_admin_proxy_new.png
            :align: center
            :width: 100%

#. Input that values at visualVM manager at described at configuration page

Setup web access points
***********************

Actually at this point is setting up forms which will be accessible thought surface.

To add new form you should do the following:

    #. Open main container at admin tool
    #. Chose **Web Access Points** tab on the left

        .. image:: images/sf-core_admin_wap_empty.png
            :align: center
            :width: 100%

    #. Press **Add** to add new and input desired name.

        .. note::
            It will be shown at surface later

    #. Open desired access point
    #. Configure each point by pressing appropriate button, step by step starting with **Project** field

    .. image:: images/sf-core_admin_wap_example.png
        :align: center
        :width: 100%

    .. note:: Until you will not choose end form, access point will not be shown on the web

    .. important::
        If you you're not using eId than **Signature 1** and **Signature 2** could be skipped
