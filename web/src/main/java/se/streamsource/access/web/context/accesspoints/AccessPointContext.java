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

package se.streamsource.access.web.context.accesspoints;

import org.qi4j.api.mixin.Mixins;
import se.streamsource.access.web.context.IndexInteractionLinksValue;
import se.streamsource.access.web.context.accesspoints.endusers.EndUsersContext;
import se.streamsource.dci.api.ContextNotFoundException;
import se.streamsource.dci.api.Interactions;
import se.streamsource.dci.api.InteractionsMixin;
import se.streamsource.dci.api.SubContext;
import se.streamsource.dci.api.SubContexts;
import se.streamsource.dci.restlet.client.CommandQueryClient;

/**
 */
@Mixins(AccessPointContext.Mixin.class)
public interface AccessPointContext
   extends Interactions
{
   @SubContext
   EndUsersContext endusers();

   abstract class Mixin
         extends InteractionsMixin
         implements AccessPointContext
   {
      public EndUsersContext endusers()
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( "endusers" ));
         return subContext( EndUsersContext.class );
      }
   }

}