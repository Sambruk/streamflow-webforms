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

package se.streamsource.surface.web.rest;

import org.qi4j.api.injection.scope.Service;
import org.restlet.Client;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.Uniform;
import org.restlet.data.ChallengeResponse;
import org.restlet.data.ChallengeScheme;
import org.restlet.data.Reference;
import se.streamsource.surface.web.resource.SurfaceRootContextFactory;

import java.util.ResourceBundle;

/**
 */
public class ProxyRestlet
   extends Restlet
{
   @Service
   Client client;

   @Override
   public void handle( Request request, Response response )
   {
      super.handle( request, response );
      Reference ref = request.getResourceRef();
      String remaining = ref.getRemainingPart();

      ResourceBundle bundle = ResourceBundle.getBundle( SurfaceRootContextFactory.class.getName() );

      String url = bundle.getString( "streamflow.url" );
      Reference streamflowReference = new Reference( url + "/surface" + remaining );

      String proxyusername = bundle.getString( "streamflow.proxyuser.username" );
      String proxypassword = bundle.getString( "streamflow.proxyuser.password" );
      request.setChallengeResponse( new ChallengeResponse( ChallengeScheme.HTTP_BASIC, proxyusername, proxypassword ) );

      request.setResourceRef( streamflowReference );

      client.handle( request, response );
   }
}
