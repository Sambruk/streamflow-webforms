/**
 *
 * Copyright 2009-2014 Jayway Products AB
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
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;

/**
 */
public class IndexRestlet extends Restlet
{
   @Service
   IndexRestletService indexRestletService;
   
   @Override
   public void handle(Request request, Response response)
   {
      super.handle(request, response);

      try
      {
         indexRestletService.handle( request, response );
      } catch (Exception e)
      {
         e.printStackTrace();
      }
   }

}
