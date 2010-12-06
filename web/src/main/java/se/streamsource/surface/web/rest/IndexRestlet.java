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
import org.restlet.data.ChallengeScheme;
import org.restlet.data.MediaType;
import org.restlet.data.Reference;
import org.restlet.data.Status;
import org.restlet.representation.Representation;
import org.restlet.resource.ClientResource;
import se.streamsource.surface.web.proxy.ProxyService;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

/**
 */
public class IndexRestlet extends Restlet

{

   @Service
   @Tagged("eid")
   ProxyService proxyService;

   @Override
   public void handle(Request request, Response response)
   {
      super.handle(request, response);

      String accessPointId = request.getResourceRef().getQueryAsForm().getFirstValue("ap");

      if (accessPointId != null)
      {
         try
         {
            String template = getTemplate("index.html", getClass());

            template = template.replace("$accesspoint", accessPointId);
            template = template.replace("$hostname", request.getResourceRef().getHostIdentifier());

            boolean shouldSignForm = true;
            if (shouldSignForm)
            {
               template = template.replace("$signerDiv", getSignerDiv());
            } else
            {
               template = template.replace("$signerDiv", "");
            }
            response.setEntity(template, MediaType.TEXT_HTML);
         } catch (IOException e)
         {
            e.printStackTrace();
         }
      } else
      {
         response.setLocationRef(new Reference(request.getResourceRef(), "/surface/surface/accesspoints/index"));
         response.setStatus(Status.REDIRECTION_TEMPORARY);
      }
   }

   public static String getTemplate(String resourceName, Class resourceClass) throws IOException
   {
      StringBuilder template = new StringBuilder("");
      InputStream in = resourceClass.getResourceAsStream(resourceName);
      BufferedReader reader = new BufferedReader(new InputStreamReader(in));
      String line;
      while ((line = reader.readLine()) != null)
         template.append(line + "\n");
      reader.close();

      return template.toString();
   }

   private String getSignerDiv()
   {
      StringBuffer buffer = new StringBuffer("<div id=\"signerDiv\">\n");

      try
      {
         if (proxyService.configuration().enabled().get())
         {
            ClientResource clientResource = new ClientResource(proxyService.configuration().url().get()
                  + "sign/header.htm");
            
            clientResource.setChallengeResponse(ChallengeScheme.HTTP_BASIC, proxyService.configuration().username()
                  .get(), proxyService.configuration().password().get());

            // Call plugin
            Representation result = clientResource.get();
            buffer.append(result.getText());

         } else
         {
            throw new IllegalStateException("This form requires signatur but the eId service is not available");
         }
      } catch (Exception e)
      {
         throw new IllegalStateException("This form requires signatur but the eId service is not available");
      }

      buffer.append("</div>");

      return buffer.toString();
   }
}
