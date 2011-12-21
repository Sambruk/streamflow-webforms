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

package se.streamsource.surface.web.proxy;

import org.qi4j.api.configuration.Configuration;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.This;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.service.Activatable;
import org.qi4j.api.service.Availability;
import org.qi4j.api.service.ServiceComposite;
import org.qi4j.api.service.ServiceReference;
import org.qi4j.api.service.qualifier.IdentifiedBy;
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

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

/**
 * Proxy service that is used to invoke Streamflow from Surface. Calls from the browser are routed
 * through here and directly to Streamflow. Use the ProxyConfiguration to specify what server to connect to
 * and what username/password to use for the proxy-user.
 */
@Mixins(ProxyService.Mixin.class)
public interface ProxyService
   extends ServiceComposite, Activatable, Configuration<ProxyConfiguration>, Uniform, Availability
{
   

   class Mixin
      implements Activatable, Uniform, Availability
   {
      @Service
      @IdentifiedBy("client")
      ServiceReference<Uniform> client;

      @This
      Configuration<ProxyConfiguration> config;
      public Reference proxyRef;
      public ChallengeResponse challengeResponse;

      public void activate() throws Exception
      {
         if (config.configuration().enabled().get())
         {
            proxyRef = new Reference(config.configuration().url().get());
            challengeResponse = new ChallengeResponse( ChallengeScheme.HTTP_BASIC, config.configuration().username().get(), config.configuration().password().get() );
         }
      }

      public void passivate() throws Exception
      {
      }

      public boolean isAvailable()
      {
         return config.configuration().enabled().get() && client.isAvailable();
      }

      public void handle( Request request, Response response )
      {
         if (proxyRef == null || !client.isAvailable())
         {
            // Not enabled
            response.setStatus( Status.SERVER_ERROR_SERVICE_UNAVAILABLE, "Streamflow proxy is not enabled" );
            return;
         }

         Reference proxyReference;
         Reference ref = request.getResourceRef();
         if (ref.getBaseRef() == null)
         {
            proxyReference = new Reference( proxyRef.toString()+ref.getPath().substring( 1 ));
         } else
         {
            String remaining = ref.getRemainingPart();
            proxyReference = new Reference( proxyRef.toString()+remaining.substring(1));
         }

         ClientResource client = new ClientResource( proxyReference );
         client.setClientInfo( request.getClientInfo() );
         client.setNext( this.client.get() );
         client.setChallengeResponse( challengeResponse );
         client.setMethod( request.getMethod() );
         client.getRequest().setEntity( request.getEntity() );

         try
         {
            Representation representation = client.handle();

            response.setStatus( client.getStatus() );
            // just a test but should be changed
            //response.setEntity( representation );
            ByteArrayOutputStream bout = new ByteArrayOutputStream( );
            BioUtils.copy( representation.getStream(), bout);
            representation.exhaust();
            representation.release();
            InputRepresentation inputRepresentation = new InputRepresentation( new ByteArrayInputStream( bout.toByteArray() ), representation.getMediaType(), bout.size() );
            inputRepresentation.setDisposition( representation.getDisposition() );
            inputRepresentation.setCharacterSet( representation.getCharacterSet() );
            inputRepresentation.setDigest( representation.getDigest() );
            inputRepresentation.setLanguages( representation.getLanguages() );
            inputRepresentation.setEncodings( representation.getEncodings() );
            inputRepresentation.setExpirationDate( representation.getExpirationDate() );
            inputRepresentation.setModificationDate( representation.getModificationDate() );
            response.setEntity( inputRepresentation );
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
