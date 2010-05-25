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

package se.streamsource.access.web.context.accesspoints.endusers.requiredforms;

import org.qi4j.api.mixin.Mixins;
import se.streamsource.access.web.context.IndexInteractionLinksValue;
import se.streamsource.dci.api.Interactions;
import se.streamsource.dci.api.InteractionsMixin;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.streamflow.resource.roles.EntityReferenceDTO;

/**
 */
@Mixins(RequiredFormsContext.Mixin.class)
public interface RequiredFormsContext
   extends Interactions, IndexInteractionLinksValue
{
   // commands
   void createformdraft( EntityReferenceDTO form );

   abstract class Mixin
      extends InteractionsMixin
      implements RequiredFormsContext
   {
      public void createformdraft( EntityReferenceDTO formReference )
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "createformdraft", formReference );
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
      }
   }
}