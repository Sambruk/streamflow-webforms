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
import org.restlet.data.MediaType;
import org.restlet.data.Reference;
import org.restlet.data.Status;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

/**
 */
public class CasesRestlet extends Restlet
{
//   @Service
//   @Tagged("eid")
//   Uniform proxyService;
//
//   @Service
//   @Tagged("streamflow")
//   Uniform streamflowService;

   @Override
   public void handle(Request request, Response response)
   {
      super.handle(request, response);

//      String accessPointId = request.getResourceRef().getQueryAsForm().getFirstValue("ap");
      String contactId = "197507212475"; //TODO: FIX!

      if (contactId != null)
      {
         try
         {
            String template = getTemplate("cases.html", getClass());
            template = template.replace("$contactid", contactId);
//            template = template.replace("$hostname", request.getResourceRef().getHostIdentifier());

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

}
