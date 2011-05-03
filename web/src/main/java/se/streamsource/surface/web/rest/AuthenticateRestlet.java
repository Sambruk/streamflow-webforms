package se.streamsource.surface.web.rest;

import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.service.qualifier.Tagged;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.Uniform;
import org.restlet.data.Form;
import org.restlet.data.Method;
import org.restlet.data.Reference;
import org.restlet.data.Status;
import org.restlet.resource.ResourceException;

/**
 * TODO
 */
public class AuthenticateRestlet
   extends Restlet
{
   @Service
   @Tagged("eid")
   Uniform proxyService;

   @Override
   public void handle(Request request, Response response)
   {
      super.handle(request, response);

      Form query = request.getResourceRef().getQueryAsForm();
      String provider = query.getFirstValue("provider");

      if (provider == null)
         throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, "Missing provider query parameter");

      Form headers = (Form) request.getAttributes().get("org.restlet.http.headers");

      String cert = headers.getFirstValue("SSL_CLIENT_CERT");

      cert = cert.substring("-----BEGIN CERTIFICATE----- ".length(), cert.length()-" -----END CERTIFICATE-----".length());

      Form certForm = new Form();
      certForm.set("certificate", cert);
      certForm.set("provider", provider);
      Request certRequest = new Request(Method.POST, new Reference("/authentication/verify"), certForm.getWebRepresentation());
      proxyService.handle(certRequest, response);
   }
}
