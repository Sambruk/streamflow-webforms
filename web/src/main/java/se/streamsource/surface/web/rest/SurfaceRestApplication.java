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

import java.util.logging.Logger;

import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.object.ObjectBuilderFactory;
import org.qi4j.api.unitofwork.UnitOfWorkFactory;
import org.qi4j.bootstrap.Energy4Java;
import org.qi4j.spi.structure.ApplicationSPI;
import org.restlet.Application;
import org.restlet.Restlet;
import org.restlet.data.MediaType;
import org.restlet.resource.Directory;
import org.restlet.routing.Filter;
import org.restlet.routing.Router;
import org.restlet.routing.Template;

import se.streamsource.dci.restlet.server.ExtensionMediaTypeFilter;
import se.streamsource.surface.web.assembler.SurfaceWebAssembler;
import se.streamsource.surface.web.mypages.MyPagesAccessFilter;
import se.streamsource.surface.web.mypages.MyPagesAccessFilterService;
import se.streamsource.surface.web.resource.SurfaceRestlet;

public class SurfaceRestApplication extends Application
{

   public static final MediaType APPLICATION_SPARQL_JSON = new MediaType( "application/sparql-results+json",
         "SPARQL JSON" );
   @Service 
   MyPagesAccessFilterService filterService;
   
   @Structure
   ObjectBuilderFactory factory;
   
   @Structure
   UnitOfWorkFactory unitOfWorkFactory;

   @Structure
   ApplicationSPI app;

   public SurfaceRestApplication() throws Exception
   {
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
      Router surfaceRouter = new Router();
      Router mypagesRouter = new Router();

      Restlet cqr = factory.newObjectBuilder( SurfaceRestlet.class ).use( getContext() ).newInstance();
      StreamflowProxyRestlet proxyRestlet = factory.newObject( StreamflowProxyRestlet.class );
      EidProxyRestlet eidProxyRestlet = factory.newObject( EidProxyRestlet.class );
      IndexRestlet indexRestlet = factory.newObject( IndexRestlet.class );
      surfaceRouter.attachDefault( indexRestlet );
      surfaceRouter.attach( "/eidproxy", eidProxyRestlet, Template.MODE_STARTS_WITH );
      surfaceRouter.attach( "/proxy", proxyRestlet, Template.MODE_STARTS_WITH );
      surfaceRouter.attach( "/surface", new ExtensionMediaTypeFilter( getContext(), cqr ), Template.MODE_STARTS_WITH );
      surfaceRouter.attach( "/texts", new TextsRestlet() );
      surfaceRouter.attach( "/static", new Directory( getContext(), "clap://thread/files/" ) );
      
      Filter mypagesFilter = factory.newObjectBuilder( MyPagesAccessFilter.class ).use( getContext(), mypagesRouter, filterService ).newInstance(); 

      surfaceRouter.attach( "/mypages", mypagesFilter, Template.MODE_STARTS_WITH);
      mypagesRouter.attach( "/static", new Directory( getContext(), "clap://thread/files/" ) );
      mypagesRouter.attach( "/texts", new TextsRestlet() );
      mypagesRouter.attach( "/cases", new CasesRestlet(), Template.MODE_EQUALS );
      mypagesRouter.attach( "/profile", new ProfileRestlet(), Template.MODE_STARTS_WITH );
      mypagesRouter.attach( "/fake", new FakeRestlet(), Template.MODE_EQUALS );
      mypagesRouter.attach( "/login", factory.newObject( LoginRestlet.class ), Template.MODE_STARTS_WITH );

      getTunnelService().setLanguageParameter( "locale" );

      return surfaceRouter;
   }

   @Override
   public void start() throws Exception
   {
      try
      {
         // Start Qi4j
         Energy4Java is = new Energy4Java();
         app = is.newApplication( new SurfaceWebAssembler( this, getMetadataService() ) );

         app.activate();

         app.findModule( "Web", "REST" ).objectBuilderFactory().newObjectBuilder( SurfaceRestApplication.class )
               .injectTo( this );

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
