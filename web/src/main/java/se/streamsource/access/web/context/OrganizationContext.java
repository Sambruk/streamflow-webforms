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

package se.streamsource.access.web.context;

import org.qi4j.api.mixin.Mixins;
import se.streamsource.access.web.context.accesspoints.AccessPointsContext;
import se.streamsource.access.web.context.projects.ProjectsContext;
import se.streamsource.access.web.context.proxyusers.ProxyUsersContext;
import se.streamsource.dci.api.IndexInteraction;
import se.streamsource.dci.api.Interactions;
import se.streamsource.dci.api.InteractionsMixin;
import se.streamsource.dci.api.SubContext;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.StringValue;

/**
 */
@Mixins(OrganizationContext.Mixin.class)
public interface OrganizationContext
      extends Interactions, IndexInteraction<StringValue>
{

   //@SubContext
   //ProjectsContext projects();

   @SubContext
   AccessPointsContext accesspoints();

   //@SubContext
   //ProxyUsersContext proxyusers();

   abstract class Mixin
         extends InteractionsMixin
         implements OrganizationContext
   {
      /*public ProjectsContext projects()
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( "projects" ));
         return subContext( ProjectsContext.class );
      } */

      public AccessPointsContext accesspoints()
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( "accesspoints" ));
         return subContext( AccessPointsContext.class );
      }

      /*public ProxyUsersContext proxyusers()
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( "proxyusers" ));
         return subContext( ProxyUsersContext.class );
      } */

      public StringValue index()
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            return client.query( "index", StringValue.class );
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
         return null;
      }
   }

}
