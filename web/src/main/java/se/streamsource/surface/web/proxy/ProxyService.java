/*
 * Copyright (c) 2010, Rickard Öberg. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

package se.streamsource.surface.web.proxy;

import org.qi4j.api.configuration.Configuration;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.This;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.service.Activatable;
import org.qi4j.api.service.ServiceComposite;
import org.restlet.Client;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Uniform;
import org.restlet.data.ChallengeResponse;
import org.restlet.data.ChallengeScheme;
import org.restlet.data.Reference;
import org.restlet.data.Status;
import org.restlet.engine.io.BioUtils;
import org.restlet.representation.InputRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.ClientResource;
import org.restlet.resource.ResourceException;
import se.streamsource.surface.web.resource.SurfaceRootContextFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ResourceBundle;

/**
 * Proxy service that is used to invoke Streamflow from Surface. Calls from the browser are routed
 * through here and directly to Streamflow. Use the ProxyConfiguration to specify what server to connect to
 * and what username/password to use for the proxy-user.
 */
@Mixins(ProxyService.Mixin.class)
public interface ProxyService
   extends ServiceComposite, Activatable, Configuration, Uniform
{
   class Mixin
      implements Activatable, Uniform
   {
      @Service
      Client client;

      @This
      Configuration<ProxyConfiguration> config;
      public Reference streamflowRef;
      public ChallengeResponse challengeResponse;

      public void activate() throws Exception
      {
         streamflowRef = new Reference(config.configuration().server().get());
         streamflowRef.setPath( "/streamflow/surface" );
         challengeResponse = new ChallengeResponse( ChallengeScheme.HTTP_BASIC, config.configuration().username().get(), config.configuration().password().get() );
      }

      public void passivate() throws Exception
      {
      }

      public void handle( Request request, Response response )
      {
         Reference ref = request.getResourceRef();
         String remaining = ref.getRemainingPart();

         Reference streamflowReference = new Reference( streamflowRef, remaining );

         ClientResource client = new ClientResource( streamflowReference );
         client.setClientInfo( request.getClientInfo() );
         client.setNext( this.client );
         client.setChallengeResponse( challengeResponse );
         client.setMethod( request.getMethod() );
         client.getRequest().setEntity( request.getEntity() );

         try
         {
            Representation representation = client.handle();
            // just a test but should be changed
            //response.setEntity( representation );
            ByteArrayOutputStream bout = new ByteArrayOutputStream( );
            BioUtils.copy( representation.getStream(), bout);
            representation.exhaust();
            representation.release();
            response.setEntity( new InputRepresentation(new ByteArrayInputStream(bout.toByteArray()), representation.getMediaType(), bout.size()) );
         } catch ( ResourceException re )
         {
            response.setStatus( re.getStatus(), re.getCause(), re.getMessage() );
         } catch ( Exception ex )
         {
            response.setStatus( Status.SERVER_ERROR_INTERNAL, ex, ex.getMessage() );
         } finally
         {
            request.release();
         }

      }
   }
}
