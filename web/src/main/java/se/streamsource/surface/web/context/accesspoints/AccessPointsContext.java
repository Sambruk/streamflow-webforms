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
import org.qi4j.api.value.ValueBuilder;
import se.streamsource.dci.api.Context;
import se.streamsource.dci.api.ContextMixin;
import se.streamsource.dci.value.LinkValue;
import se.streamsource.dci.value.LinksValue;
import se.streamsource.streamflow.infrastructure.application.LinksBuilder;
import se.streamsource.surface.web.context.IndexInteractionLinksValue;
import se.streamsource.dci.api.ContextNotFoundException;
import se.streamsource.dci.api.SubContexts;
import se.streamsource.dci.restlet.client.CommandQueryClient;

/**
 */
@Mixins(AccessPointsContext.Mixin.class)
public interface AccessPointsContext
      extends SubContexts<AccessPointContext>, Context
{

   LinksValue surfacelinks();

   abstract class Mixin
         extends ContextMixin
         implements AccessPointsContext
   {
      public LinksValue surfacelinks()
      {
         CommandQueryClient client = roleMap.get( CommandQueryClient.class );

         try
         {
            LinksValue linksValue = client.query( "index", LinksValue.class );
            LinksBuilder builder = new LinksBuilder( module.valueBuilderFactory() );
            ValueBuilder<LinkValue> linkBuilder = module.valueBuilderFactory().newValueBuilder( LinkValue.class );

            for (LinkValue linkValue : linksValue.links().get())
            {
               linkBuilder.withPrototype( linkValue );
               linkBuilder.prototype().href().set( "../../?ap="+linkValue.id().get() );
               builder.addLink( linkBuilder.newInstance() );
            }

            return builder.newLinks();
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
         return null;
      }

      public AccessPointContext context( String id ) throws ContextNotFoundException
      {
         roleMap.set( roleMap.get( CommandQueryClient.class ).getSubClient( id ));
         return subContext( AccessPointContext.class );
      }
   }

}