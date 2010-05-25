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

import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.injection.scope.Uses;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.object.ObjectBuilderFactory;
import org.restlet.Restlet;
import org.restlet.Uniform;
import org.restlet.data.Reference;
import org.restlet.routing.Filter;
import se.streamsource.surface.web.context.accesspoints.AccessPointsContext;
import se.streamsource.dci.api.Interactions;
import se.streamsource.dci.api.InteractionsMixin;
import se.streamsource.dci.api.SubContext;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.restlet.client.NullResponseHandler;

@Mixins(RootContext.Mixin.class)
public interface RootContext
   extends Interactions
{
   @SubContext
   AccessPointsContext accesspoints();

   abstract class Mixin
      extends InteractionsMixin
      implements RootContext
   {
      @Uses
      Filter filter;

      @Uses
      Reference streamflowReference;

      @Service
      Uniform client;

      @Structure
      ObjectBuilderFactory obf;

      public AccessPointsContext accesspoints()
      {
         filter.setNext( (Restlet) client );

         CommandQueryClient cqc = obf.newObjectBuilder( CommandQueryClient.class ).use( filter, streamflowReference, new NullResponseHandler() ).newInstance();
         context.set( cqc.getSubClient( "surface" ).getSubClient( "accesspoints" ) );

         return subContext( AccessPointsContext.class );
      }
   }
}
