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

package se.streamsource.surface.web.resource;

import org.qi4j.api.composite.TransientBuilderFactory;
import org.qi4j.api.configuration.Configuration;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.injection.scope.This;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.data.ChallengeResponse;
import org.restlet.data.ChallengeScheme;
import org.restlet.data.Reference;
import org.restlet.routing.Filter;
import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.server.RootContextFactory;
import se.streamsource.surface.web.context.RootContext;
import se.streamsource.dci.api.Context;
import se.streamsource.surface.web.proxy.ProxyConfiguration;
import se.streamsource.surface.web.proxy.ProxyService;

import java.util.ResourceBundle;

/**
 */
public class SurfaceRootContextFactory
   implements RootContextFactory
{
   @Structure
   TransientBuilderFactory tbf;

   private AuthenticationFilter filter;

   private Reference streamflowReference;

   public SurfaceRootContextFactory( @Service ProxyService proxyService )
   {
      ProxyConfiguration config = (ProxyConfiguration) proxyService.configuration();

      streamflowReference = new Reference( config.server().get() );
      streamflowReference.setPath( "/streamflow" );
      ChallengeResponse challengeResponse = new ChallengeResponse( ChallengeScheme.HTTP_BASIC, config.username().get(), config.password().get() );

      filter = new AuthenticationFilter( challengeResponse );
   }

   public Object getRoot( RoleMap roleMap )
   {
      return tbf.newTransientBuilder( RootContext.class ).
            use( roleMap, filter, streamflowReference ).newInstance();
   }

   class AuthenticationFilter extends Filter
   {
      private ChallengeResponse challengeResponse;

      public AuthenticationFilter( ChallengeResponse challengeResponse )
      {
         this.challengeResponse = challengeResponse;
      }

      @Override
      protected int beforeHandle( Request request, Response response )
      {
         request.setChallengeResponse( challengeResponse );
         return super.beforeHandle( request, response );
      }
   }
}