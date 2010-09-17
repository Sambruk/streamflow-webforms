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

package se.streamsource.surface.web.context.accesspoints;

import org.qi4j.api.mixin.Mixins;
import se.streamsource.dci.api.Context;
import se.streamsource.dci.api.ContextMixin;
import se.streamsource.dci.api.SubContext;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.StringValue;
import se.streamsource.surface.web.context.accesspoints.endusers.EndUsersContext;

/**
 */
@Mixins(AccessPointContext.Mixin.class)
public interface AccessPointContext
   extends Context
{
   @SubContext
   EndUsersContext endusers();

   abstract class Mixin
         extends ContextMixin
         implements AccessPointContext
   {
      public EndUsersContext endusers()
      {
         roleMap.set( roleMap.get( CommandQueryClient.class ).getSubClient( "endusers" ));
         return subContext( EndUsersContext.class );
      }
   }

}