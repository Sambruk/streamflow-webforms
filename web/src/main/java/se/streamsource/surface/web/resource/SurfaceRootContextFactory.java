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
import org.qi4j.api.injection.scope.Structure;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.data.ChallengeResponse;
import org.restlet.data.ChallengeScheme;
import org.restlet.data.Reference;
import org.restlet.routing.Filter;
import se.streamsource.surface.web.context.RootContext;
import se.streamsource.dci.api.Context;
import se.streamsource.dci.restlet.server.RootInteractionsFactory;

import java.util.ResourceBundle;

/**
 */
public class SurfaceRootContextFactory
   implements RootInteractionsFactory
{
   @Structure
   TransientBuilderFactory tbf;

   private AuthenticationFilter filter;

   private Reference streamflowReference;

   public SurfaceRootContextFactory()
   {
      ResourceBundle bundle = ResourceBundle.getBundle( SurfaceRootContextFactory.class.getName() );

      String url = bundle.getString( "streamflow.url" );
      streamflowReference = new Reference( url );
      streamflowReference.addSegment( "streamflow" ).addSegment( "v1" ).addSegment( "" );

      String proxyusername = bundle.getString( "streamflow.proxyuser.username" );
      String proxypassword = bundle.getString( "streamflow.proxyuser.password" );
      ChallengeResponse challengeResponse = new ChallengeResponse( ChallengeScheme.HTTP_BASIC, proxyusername, proxypassword );
      filter = new AuthenticationFilter( challengeResponse );
   }

   public Object getRoot( Context context )
   {
      return tbf.newTransientBuilder( RootContext.class ).
            use( context, filter, streamflowReference ).newInstance();
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