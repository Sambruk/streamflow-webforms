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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.data.MediaType;

/**
 */
public class StaticFileRestlet extends Restlet
{

   private final String filename;

   public StaticFileRestlet(String filename)
   {
      this.filename = filename;
   }

   @Override
   public void handle(Request request, Response response)
   {
      super.handle(request, response);

      try
         {
            String template = getTemplate(filename, getClass());
            response.setEntity(template, MediaType.TEXT_HTML);
         } catch (IOException e)
         {
            e.printStackTrace();
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
