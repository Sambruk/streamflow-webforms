Uninstall of previous version
=============================

Glassfish
*********
#. Go to administration console of Glassfish by default *http://localhost:4848*
#. After log in at the left-hand menu, select "Applications"
#. Then click the box in front of **surface-web-x.x** and select **Undeploy** from the menu. A dialog box opens where you must confirm that you want to uninstall ("Undeploy") application.
#. Once Streamflow is uninstalled, the list of installed applications will be displayed again.

Tomcat
******
#. Go to management tool of Tomcat by default *http://localhost:8080/manager/html*
#. Find the application named **streamflow-{module}-x.x** in the list. Press **Undeploy** button to the right of application. A dialog box opens where you need to confirm that you want to uninstall (undeploy) the application.
    .. hint::
        Actual streamflow module name are **surface-web-x.x**

#. Once Streamflow is uninstalled, the list of installed applications will be displayed again.
