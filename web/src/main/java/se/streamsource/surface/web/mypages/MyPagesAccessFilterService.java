/**
 *
 * Copyright 2009-2012 Jayway Products AB
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

import org.qi4j.api.configuration.Configuration;
import org.qi4j.api.injection.scope.This;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.service.Activatable;
import org.qi4j.api.service.Availability;
import org.qi4j.api.service.ServiceComposite;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.data.Status;
import org.restlet.routing.Filter;

/**
 * Proxy service that is used to stop calls to My Pages if My Pages is
 * configured to be disabled. Otherwise continue the filter chain.
 */
@Mixins(MyPagesAccessFilterService.Mixin.class)
public interface MyPagesAccessFilterService extends ServiceComposite, Activatable, Configuration<MyPagesAccessConfiguration>, Availability
{
   public int beforeHandle(Request request, Response response);

   abstract class Mixin implements Activatable, Availability, MyPagesAccessFilterService
   {
      @This
      Configuration<MyPagesAccessConfiguration> config;

      public void activate() throws Exception
      {
         config.configuration();
      }

      public void passivate() throws Exception
      {
      }

      public boolean isAvailable()
      {
         return config.configuration().enabled().get();
      }

      public int beforeHandle(Request request, Response response)
      {
         if (!isAvailable())
         {
            // Not enabled
            response.setStatus( Status.SERVER_ERROR_SERVICE_UNAVAILABLE, "My Pages is not enabled" );
            return Filter.STOP;
         }

         return Filter.CONTINUE;
      }
   }
}
