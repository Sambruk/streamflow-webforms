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

import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.injection.scope.Uses;
import org.qi4j.api.object.ObjectBuilderFactory;
import org.qi4j.api.unitofwork.UnitOfWorkFactory;
import org.qi4j.bootstrap.Energy4Java;
import org.qi4j.spi.structure.ApplicationSPI;
import org.restlet.Application;
import org.restlet.Client;
import org.restlet.Context;
import org.restlet.Restlet;
import org.restlet.data.MediaType;
import org.restlet.data.Protocol;
import org.restlet.routing.Router;
import org.restlet.routing.Template;
import se.streamsource.dci.restlet.server.CommandQueryRestlet;
import se.streamsource.dci.restlet.server.ExtensionMediaTypeFilter;
import se.streamsource.surface.web.SurfaceWebAssembler;

import java.util.logging.Logger;

public class SurfaceRestApplication
   extends Application
{

   public static final MediaType APPLICATION_SPARQL_JSON = new MediaType( "application/sparql-results+json", "SPARQL JSON" );

   @Structure
   ObjectBuilderFactory factory;
   @Structure
   UnitOfWorkFactory unitOfWorkFactory;

   @Structure
   ApplicationSPI app;

   public SurfaceRestApplication( @Uses Context parentContext ) throws Exception
   {
      super( parentContext );

      getMetadataService().addExtension( "srj", APPLICATION_SPARQL_JSON );

   }


   Thread shutdownHook = new Thread()
   {
      @Override
      public void run()
      {
         try
         {
            System.out.println( "SHUTDOWN" );
            Logger.getLogger( "surface" ).info( "VM shutdown; passivating Surface" );
            app.passivate();
         } catch (Exception e)
         {
            e.printStackTrace();
         }
      }
   };

   @Override
   public Restlet createInboundRoot()
   {
      Router router = new Router();

      Restlet cqr = factory.newObjectBuilder( CommandQueryRestlet.class ).use( getContext() ).newInstance();
      StreamflowProxyRestlet proxyRestlet = factory.newObject( StreamflowProxyRestlet.class );
      EidProxyRestlet eidProxyRestlet = factory.newObject( EidProxyRestlet.class );
      router.attach( "/eidproxy", eidProxyRestlet, Template.MODE_STARTS_WITH );
      router.attach( "/proxy", proxyRestlet, Template.MODE_STARTS_WITH );
      router.attach( "/surface", cqr, Template.MODE_STARTS_WITH );
      router.attach("/texts", new TextsRestlet());

      getTunnelService().setLanguageParameter("locale");

      return new ExtensionMediaTypeFilter( getContext(), router );
   }


   @Override
   public void start() throws Exception
   {
      try
      {
         Client client = new Client( Protocol.HTTP );
         client.start();

// Start Qi4j
         Energy4Java is = new Energy4Java();
         app = is.newApplication( new SurfaceWebAssembler( this, client, getMetadataService() ) );

         app.activate();

         app.findModule( "Web", "REST" ).objectBuilderFactory().newObjectBuilder( SurfaceRestApplication.class ).injectTo( this );

         Runtime.getRuntime().addShutdownHook( shutdownHook );

         super.start();
      } catch (Exception e)
      {
         e.printStackTrace();
         throw e;
      }
   }

   @Override
   public void stop() throws Exception
   {
      super.stop();

      Logger.getLogger( "access" ).info( "Passivating Access" );
      app.passivate();

      Runtime.getRuntime().removeShutdownHook( shutdownHook );
   }


}
