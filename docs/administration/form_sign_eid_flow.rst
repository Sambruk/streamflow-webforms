Signing in WebForms with eID Plugin
###################################

Technical details
*****************
    This page contains a description of the signing flow in WebForms using eID-plugin as well as other technical documentation.

    .. important::
        This documentation is valid for **WebForms 1.17+** and **eID-plugin 1.8+**.

Streamflow WebForms signing flow
--------------------------------
    This is an attempt to describe the signing flow(s) in Streamflow WebForms. The signing flow is different depending on service/API used, i.e. GRP (CGI, Visma) or Authify ( Svensk e-identitet).

Things that are good to know
^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    * The documented flow(s) only includes steps relevant to signing, a lot of non related things are left out.
    * Only "happy flow" is described.
    * Signing flow involves three components, all separately deployed applications:

        * Streamflow WebForms (Surface) - Javascript, HTML, Java (Qi4J, Restlet)
        * Streamflow eID-plugin - Java (Qi4J, Restlet)
        * External eID-service:

            * CGI (GRP)
            * Visma - Should work exactly as CGI but is not verifyed yet..
            * Authify (Svensk e-identitet)
    * Streamflow WebForms is a single page web application.
    * All calls from Streamflow WebForms to Streamflow eID-plugin api goes through a proxy in Streamflow WebForms.
    * SF = Streamflow
    * AP = Access point

CGI GRP flow
^^^^^^^^^^^^
    Below is a graphical sequence diagram and below that a more elaborate description referencing steps in the diagram ([n]). Some hints on where to look in the code are given with italic text, note however that those hints may not be valid depending on what has been changed since this document was written.

    .. image:: images/sf_sign_GRP.png
        :align: center
        :width: 100%

    **Load AP summary - Render signing section & hidden modal**

    [1] The user has filled the entire form (possibly spread out in several pages) and presses "Nästa" button to enter the Summary page.
    `WebForms: webforms-client.js: contexts.summary`

    [2-3] A request is made to the eID-plugin (/api/services/.json) to get name/link to enabled eID service. JSON containing the name/link of the service is returned.
    WebForms: webforms-client.js: setupSigningService()
    `eID-plugin: RootResource.services()`

    [4-7] A "signing section" is created on the Summary page. Since the form is not yet signed a signing modal is created (not shown) along with a "Signera" button to be used to open the modal. A request is made to the eID-plugin (/api/services/grp/providers.json) to fetch a list of available identity providers. JSON containing a list of providers is returned. A drop-down list with the returned providers are added to the modal (still not visible).
    WebForms: webforms-viewbuilder.js: View.summary(), addSignaturesDiv(), createGrpSigningDialog()
    `eID-plugin: GrpContext.providers()`

    **Open signing modal**

    [8-9] The user clicks "Signera" button in signing section on the Summary page. The signing modal is shown, displaying first step with providers drop-down.
    `WebForms: webforms-viewbuilder.js: addSignaturesDiv()`

    **Choose identity provider and sign - Perform signing and showing status**

    [10] The user chooses identity provider in the drop-down and clicks "Signera" button in modal.

    [11] The content in modal changes to show a spinner instead of providers drop-down.
    `WebForms: webforms-viewbuilder.js: grpSigningPerform()`

    [12] A request is made to the eID-plugin (/api/services/grp/sign.json) with the text to be signed to start the signing process.
    WebForms: webforms-viewbuilder.js: grpSigningPerform()
    `eID-plugin: GrpContext.sign(), EidGrpService.sign()`

    [13-14] A request is made to GRP service to start the signing process.
    `eID-plugin: EidGrpService.sign()`

    [15] JSON containing information to use in the subsequent status check call and to open BankID application is returned.
    `eID-plugin: GrpContext.sign(), EidGrpService.sign()`

    [16] The BankID application is opened, via an Iframe added to the modal. Also a button that could be used to open BankID app manually is displayed after a few seconds (there is a bug/feature in Chrome preventing the BankID app to open automatically).
    `WebForms: webforms-viewbuilder.js: grpSigningPerform()`

    [17] An interval is started making status requests to the eID-plugin continuously (/api/services/grp/collect.json).
    WebForms: webforms-viewbuilder.js: grpSigningPerform()
    `eID-plugin: GrpContext.collect(), EidGrpService.collect()`

    [18-19] A request is made to GRP service to collect status and signature. Status is returned. When signing is done signature is returned, along with status COMPLETE (see step 23-24).
    `eID-plugin: EidGrpService.collect()`

    [20] JSON with status is returned.
    `eID-plugin: GrpContext.collect(), EidGrpService.collect()`

    [21] A status message is shown to the user, continuously updated on new status responses.
    `WebForms: webforms-viewbuilder.js: grpSigningPerform()`

    [22] The user signs the data in the BankID application.

    [23-24] GRP service and eID-plugin returns status COMPLETE and signature.
    `eID-plugin: GrpContext.collect(), EidGrpService.collect()`

    **Signing done - save signature and let user save form**

    [25] Signature is saved to form draft, draft is reloaded and the content in the modal changes to show a "signing completed message".
    `WebForms: webforms-viewbuilder.js: grpSigningDone(), FormDraftContext.verify() (java class)`

    [26] User closes modal.

    [27] Summary page shows name of signer in "signing section" instead of "Signera" button. Also the "Skicka in" button is enabled.
    `WebForms: webforms-viewbuilder.js: View.finishSigning(), View.summary(), addSignaturesDiv()`


Svensk e-identitet Authify flow
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    In short: The Authify signing flow is implemented in JSP (/authify-signing in eID-plugin). WebForms uses the eID-plugin API (/api) to get the url to the JSP flow and opens it in a new window. While signing redirects to Authify and back to eID-plugin are done. After a successful signing a redirect back to a callback page in WebForms is done with signature data.

    Below is a graphical sequence diagram and below that a more elaborate description referencing steps in the diagram ([n]). Some hints on where to look in the code are given with italic text, note however that those hints may not be valid depending on what has been changed since this document was written.

    .. image:: images/sf_sign_Authify(Svensk_e-identitet).png
        :align: center
        :width: 100%

    **Load AP summary - Render signing section**

    [1] The user has filled the entire form (possibly spread out in several pages) and presses "Nästa" button to enter the Summary page.
    `WebForms: webforms-client.js: contexts.summary`

    [2-3] A request is made to the eID-plugin (/api/services/.json) to get name/link to enabled eID service. JSON containing the name/link of the service is returned.
    WebForms: webforms-client.js: setupSigningService()
    `eID-plugin: RootResource.services()`

    [4] A "signing section" is created on the Summary page. Since the form is not yet signed a "Signera" button is shown, to be used to open the signing flow.
    WebForms: webforms-viewbuilder.js: View.summary(), addSignaturesDiv()

    **Open signing flow**

    [5-9] The user clicks "Signera" button in signing section on the Summary page. A request is made to the eID-plugin (/api/services/authify/signing.json) to get url to startpage of signing flow and characters invalid for signing with Authify. The signing flow (url received from the api) is opened in a new (small) browser window with the text to be signed and path to the page to do a callback to after signing is successfully performed.
    WebForms: webforms-viewbuilder.js: View.summary(), addSignaturesDiv()
    `eID-plugin: AuthifyContext.signing()`

    **Perform signing**

    [10-11] First page in signing flow (/authify-signing/index) contains a drop-down list with available providers. A (background) login to Authify is also done on this page.
    `eID-plugin: index.jsp`

    [12-13]
    The user chooses provider and presses "Nästa" button. The second page is shown (/authify-signing/data_to_sign). On this page the text that will be signed is shown.
    `eID-plugin: data_to_sign.jsp`

    [14-17]
    The user presses "Nästa" on the page where the text to be signed is shown. The third page (/authify-signing/sign_data) sends signing information to Authify (containing chosen provider and the text to be signed among other things) and redirects to Authify.
    `eID-plugin: sign_data.jsp`

    [18-19]
    The signing is performed at Authify pages, depending on which provider the user has chosen.

    [20-22]
    After a successful signing a redirect is made from Authify back to the last page in the eID-plugin JSP signing flow (/authify-signing/view_sign). This page gets the signature data from Authify and posts it back to a callback page in WebForms (provided when the signing flow was opened).
    `eID-plugin: view_sign.jsp`

    **Signing done - save signature and let user save form**

    [23]
    The WebForms callback page (/?authify_callback=1) saves the signature and closes the signing flow window. Summary page now shows name of signer in "signing section" instead of "Signera" button. Also the "Skicka in" button is enabled.
    `WebForms: authify-callback.html, webforms-viewbuilder.js: View.handleAuthifyCallback()`

Double signing
--------------

When double signing is activated for a form the summary page contains form fields for collecting information about the second signer, including email address. When the form is submitted Streamflow sends an email to the submitted second signer email address containing a link to WebForms. This link points to a "task" (rather than to an access point) where the form (possibly spread out in several pages) connected to the second signature is presented. At the summary page of this form the second signer has to sign the form in the same way as the first signer (i.e. in the way that is documented above).

The link to a "task" is /?tid=xxx, instead of /?ap=yyy as for access points. The task flow reuses some code from the access point flow but also has its own version of some javascript files (named webforms-task-*.js).

Other documentation
-------------------

GRP
^^^^
    CGI GRP documentation is found here: https://funktionstjanster.primeportal.com/.

    Recommended documents:

    * eID / Generellt / 4 Anslutning GRP General Relaying Party API / GRP_API.pdf
    * eID / Generellt / 4 Anslutning GRP General Relaying Party API / Flöde användning GRP.pdf
    * eID / Generellt / 2. Teknisk anslutning till tjänsten / Tekniskt Bilaga eID.doc

Authify
^^^^^^^
    At http://www.authify.com/developer documentation about Authify is found, along with downloadable demos (including Java/JSP) for login/logout flow. The signing flow is documented using PHP.
