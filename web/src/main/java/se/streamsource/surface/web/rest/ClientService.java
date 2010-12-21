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

import org.qi4j.api.composite.PropertyMapper;
import org.qi4j.api.configuration.Configuration;
import org.qi4j.api.entity.EntityBuilder;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.injection.scope.This;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.service.Activatable;
import org.qi4j.api.service.ImportedServiceDescriptor;
import org.qi4j.api.service.ServiceComposite;
import org.qi4j.api.service.ServiceImporter;
import org.qi4j.api.service.ServiceImporterException;
import org.qi4j.api.unitofwork.NoSuchEntityException;
import org.qi4j.api.unitofwork.UnitOfWork;
import org.qi4j.api.unitofwork.UnitOfWorkFactory;
import org.qi4j.api.usecase.UsecaseBuilder;
import org.restlet.Client;
import org.restlet.Context;
import org.restlet.data.Protocol;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * ServiceImporter for the Restlet Client. Handles instantiation, configuration and activation.
 * Configure using ClientConfiguration.
 */
@Mixins(ClientService.Mixin.class)
public interface ClientService
   extends ServiceComposite, ServiceImporter, Activatable
{
   class Mixin
      implements ServiceImporter, Activatable
   {
      Map<String, Client> clients = new HashMap<String, Client>( );
      Map<String, ClientConfiguration> configs = new HashMap<String, ClientConfiguration>( );

      @Structure
      UnitOfWorkFactory uowf;

      @This
      Configuration<ClientConfiguration> config;

      public void activate() throws Exception
      {
      }

      public void passivate() throws Exception
      {
         for (Client client : clients.values())
         {
            try
            {
               client.stop();
            } catch (Exception e)
            {
               LoggerFactory.getLogger( getClass() ).warn( "Could not stop Client", e );
            }
         }
      }

      public Object importService( ImportedServiceDescriptor importedServiceDescriptor ) throws ServiceImporterException
      {
         Client client = clients.get(importedServiceDescriptor.identity() );

         if (client == null)
         {
            client = new Client( Protocol.HTTP);
         } else
         {
            try
            {
               // This is a restart of the service
               client.stop();
            } catch (Exception e)
            {
               throw new ServiceImporterException( e );
            }
         }

         // Configure client
         try
         {
            ClientConfiguration conf = getConfiguration(importedServiceDescriptor.identity());

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

            clients.put( importedServiceDescriptor.identity(), client );
         } catch (Exception e)
         {
            throw new ServiceImporterException( "Could not start Client", e );
         }

         return client;
      }

      public boolean isActive( Object o )
      {
         return ((Client)o).isStarted();
      }

      public boolean isAvailable( Object o )
      {
         return ((Client)o).isAvailable();
      }

      public synchronized ClientConfiguration getConfiguration( String identity ) throws InstantiationException
      {
         ClientConfiguration config = configs.get( identity );
         if (config == null)
         {
            UnitOfWork uow = uowf.newUnitOfWork( UsecaseBuilder.newUsecase( "Create Client configuration" ));

            try
            {
               config = uow.get( ClientConfiguration.class, identity );
            } catch (NoSuchEntityException e)
            {
               EntityBuilder<ClientConfiguration> configBuilder = uow.newEntityBuilder( ClientConfiguration.class, identity );

               // Check for defaults
               String s = identity + ".properties";
               InputStream asStream = ClientConfiguration.class.getResourceAsStream( s );
               if( asStream != null )
               {
                   try
                   {
                       PropertyMapper.map( asStream, configBuilder.instance() );
                   }
                   catch( IOException e1 )
                   {
                       uow.discard();
                       InstantiationException exception = new InstantiationException( "Could not read underlying Properties file." );
                       exception.initCause( e1 );
                       throw exception;
                   }
               }

               config = configBuilder.newInstance();
            }
            uow.pause();

            configs.put( identity, config );
         }

         return config;
      }
   }
}
