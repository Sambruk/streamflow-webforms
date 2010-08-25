/**
 *
 * Copyright 2009 Streamsource AB
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

package se.streamsource.surface.web.context;

import org.qi4j.api.injection.scope.Uses;
import org.qi4j.api.mixin.Mixins;
import se.streamsource.dci.api.Context;
import se.streamsource.dci.api.IndexContext;
import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.LinksValue;

/**
 */
@Mixins( IndexInteractionLinksValue.Mixin.class )
public interface IndexInteractionLinksValue
   extends IndexContext<LinksValue>
{

   abstract class Mixin
         implements IndexInteractionLinksValue
   {
      @Uses
      RoleMap roleMap;

      public LinksValue index()
      {
         CommandQueryClient client = roleMap.get( CommandQueryClient.class );

         try
         {
            return client.query( "index", LinksValue.class );
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
         return null;
      }
   }

}
