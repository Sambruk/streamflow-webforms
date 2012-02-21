/**
 *
 * Copyright 2009-2012 Streamsource AB
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
package se.streamsource.surface.web.mypages;

import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Uses;
import org.restlet.Context;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.routing.Filter;

/**
 * Interrupts the request if My Pages isn't enabled.
 */
public class MyPagesAccessFilter extends Filter
{
   @Service
   MyPagesAccessFilterService filterService;
  
   public MyPagesAccessFilter(@Uses Context context, @Uses Restlet next, @Uses MyPagesAccessFilterService filterService)
   {
      super(context, next);
      this.filterService = filterService;
   }

   @Override
   protected int beforeHandle(Request request, Response response)
   {
      return filterService.beforeHandle(request, response);
   }

   @Override
   protected void afterHandle( Request request, Response response )
   {
      super.afterHandle( request, response );
   }
}