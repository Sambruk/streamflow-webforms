/**
 *
 * Copyright 2009-2010 Streamsource AB
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
