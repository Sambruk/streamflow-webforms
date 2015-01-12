/**
 *
 * Copyright 2009-2015 Jayway Products AB
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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.data.MediaType;
import org.restlet.data.Method;
import org.restlet.data.Status;
import org.restlet.representation.InputRepresentation;

public class ProfileRestlet extends Restlet
{

   private static final String PROFILE_PAGE = "profile.html";

   @Override
   public void handle(Request request, Response response)
   {
      super.handle(request, response);
      
      if ( Method.GET.equals(request.getMethod()) )
      {
//         response.setEntity(new InputRepresentation(this.getClass().getResourceAsStream(PROFILE_PAGE), MediaType.TEXT_HTML));
//         response.setStatus(Status.SUCCESS_OK);

      
         String contactId = "197507212475"; //TODO: FIX!

         if (contactId != null)
         {
            try
            {
               String template = getTemplate(PROFILE_PAGE, getClass());
               template = template.replace("$contactid", contactId);
//               template = template.replace("$hostname", request.getResourceRef().getHostIdentifier());

               response.setEntity(template, MediaType.TEXT_HTML);
            } catch (IOException e)
            {
               e.printStackTrace();
            }
         } else
         {
            // What to do? 
         }
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
