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

import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.object.ObjectBuilderFactory;
import org.qi4j.api.unitofwork.UnitOfWorkFactory;
import org.qi4j.bootstrap.Energy4Java;
import org.qi4j.spi.structure.ApplicationSPI;
import org.restlet.Application;
import org.restlet.Restlet;
import org.restlet.resource.Directory;
import org.restlet.routing.Extractor;
import org.restlet.routing.Filter;
import org.restlet.routing.Router;
import org.restlet.routing.Template;

import se.streamsource.surface.web.MyPagesWebAssembler;
import se.streamsource.surface.web.application.security.AuthenticationFilter;
import se.streamsource.surface.web.rest.TextsRestlet;

/**
 * 
 * @author hakansvalin
 *
 */
public class MyPagesRestApplication extends Application
{

   @Structure
   ObjectBuilderFactory factory;
   @Structure
   UnitOfWorkFactory unitOfWorkFactory;

   @Structure
   ApplicationSPI app;
   
   
   @Override
   public Restlet createInboundRoot()
   {
      Router rootRouter = new Router();
      Router apiRouter = new Router();
      
      Filter authenticationFilter = factory.newObjectBuilder( AuthenticationFilter.class ).use( getContext(), apiRouter ).newInstance(); 
      
      Extractor extractor = new Extractor( getContext(), authenticationFilter );
      extractor.extractFromQuery("uid", "uid", true);
      
//      rootRouter.attachDefault( extractor );
      rootRouter.attach("/login", factory.newObject( LoginRestlet.class ), Template.MODE_STARTS_WITH);
      rootRouter.attach("/static", new Directory(getContext(), "clap://thread/files/"));
      rootRouter.attach("/texts", new TextsRestlet());
      rootRouter.attach("/proxy", factory.newObject( StreamflowProxyRestlet.class ), Template.MODE_STARTS_WITH );
      rootRouter.attach("/cases", new CasesRestlet(), Template.MODE_EQUALS);
      rootRouter.attach("/profile", new ProfileRestlet(), Template.MODE_STARTS_WITH);
      
      apiRouter.attach("/cases", new CasesRestlet(), Template.MODE_EQUALS);
      apiRouter.attach("/fake", new FakeRestlet(), Template.MODE_EQUALS);
      apiRouter.attach("/profile", new ProfileRestlet(), Template.MODE_STARTS_WITH);
      apiRouter.attach("/index.html", new IndexRestlet(), Template.MODE_EQUALS);
            
      return rootRouter;
   }
   
   @Override
   public void start() throws Exception
   {
      try
      {
         // Start Qi4j
         Energy4Java is = new Energy4Java();
         app = is.newApplication( new MyPagesWebAssembler( this, getMetadataService() ) );

         app.activate();

         app.findModule( "Web", "REST" ).objectBuilderFactory().newObjectBuilder( MyPagesRestApplication.class ).injectTo( this );

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
   

   Thread shutdownHook = new Thread()
   {
      @Override
      public void run()
      {
         try
         {
            System.out.println( "SHUTDOWN" );
            Logger.getLogger( "mypages" ).info( "VM shutdown; passivating MyPages" );
            app.passivate();
         } catch (Exception e)
         {
            e.printStackTrace();
         }
      }
   };
}
