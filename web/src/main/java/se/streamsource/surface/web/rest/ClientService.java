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

package se.streamsource.surface.web.rest;

import org.qi4j.api.configuration.Configuration;
import org.qi4j.api.injection.scope.This;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.service.Activatable;
import org.qi4j.api.service.Availability;
import org.qi4j.api.service.ServiceComposite;
import org.restlet.Client;
import org.restlet.Context;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Uniform;
import org.restlet.data.Protocol;

import java.util.Arrays;

/**
 * Service that exposes the Uniform interface and is backed by a Restlet Client that is configurable.
 */
@Mixins(ClientService.Mixin.class)
public interface ClientService
   extends ServiceComposite, Uniform, Activatable, Configuration<ClientConfiguration>, Availability
{
   class Mixin
      implements Uniform, Activatable, Availability
   {
      Client client;

      @This
      Configuration<ClientConfiguration> config;

      public void activate() throws Exception
      {
         if (config.configuration().enabled().get())
         {
            client = new Client( Arrays.asList( Protocol.HTTP, Protocol.HTTPS ));

            // Configure client
            ClientConfiguration conf = config.configuration();

            client.setConnectTimeout( conf.connectTimeout().get() );
            Context context = new Context();
            context.getParameters().add( "idleCheckInterval", conf.idleCheckInterval().toString() );
            context.getParameters().add( "idleTimeout", conf.idleTimeout().toString() );
            context.getParameters().add( "maxConnectionsPerHost", conf.maxConnectionsPerHost().toString() );
            context.getParameters().add( "maxTotalConnections", conf.maxTotalConnections().toString() );
            context.getParameters().add( "socketTimeout", conf.socketTimeout().toString() );
            context.getParameters().add( "stopIdleTimeout", conf.stopIdleTimeout().toString() );
            context.getParameters().add( "tcpNoDelay", conf.tcpNoDelay().toString() );
            context.getParameters().add( "followRedirects", conf.followRedirects().toString() );

            if (conf.proxyHost().get() != null)
               context.getParameters().add( "proxyHost", conf.proxyHost().toString() );

            if (conf.proxyPort().get() != null)
               context.getParameters().add( "proxyPort", conf.proxyPort().toString() );

            client.setContext( context );

            client.start();
         }
      }

      public void passivate() throws Exception
      {
         client.stop();
         client = null;
      }

      public boolean isAvailable()
      {
         return client != null;
      }

      public void handle( Request request, Response response )
      {
         if (client != null)
            client.handle( request, response );
      }
   }
}
