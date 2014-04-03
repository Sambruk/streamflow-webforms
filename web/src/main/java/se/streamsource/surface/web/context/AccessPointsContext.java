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
package se.streamsource.surface.web.context;

import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.structure.Module;
import org.qi4j.api.value.ValueBuilder;
import org.slf4j.LoggerFactory;
import se.streamsource.dci.api.IndexContext;
import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.link.LinkValue;
import se.streamsource.dci.value.link.LinksBuilder;
import se.streamsource.dci.value.link.LinksValue;

/**
 */
public class AccessPointsContext
      implements IndexContext<LinksValue>
{
   @Structure
   Module module;

   public LinksValue index()
   {
      CommandQueryClient client = RoleMap.current().get( CommandQueryClient.class );

      LinksBuilder builder = new LinksBuilder( module.valueBuilderFactory() );
      try
      {
         LinksValue linksValue = client.query( "index", LinksValue.class );
         ValueBuilder<LinkValue> linkBuilder = module.valueBuilderFactory().newValueBuilder( LinkValue.class );

         for (LinkValue linkValue : linksValue.links().get())
         {
            linkBuilder.withPrototype( linkValue );
            linkBuilder.prototype().href().set( "../../?ap=" + linkValue.id().get() );
            builder.addLink( linkBuilder.newInstance() );
         }

      } catch (Throwable e)
      {
         LoggerFactory.getLogger( getClass() ).warn( "Could not get list of accesspoints", e );
      }
      return builder.newLinks();
   }
}