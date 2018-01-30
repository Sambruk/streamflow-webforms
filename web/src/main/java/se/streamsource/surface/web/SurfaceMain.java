/**
 *
 * Copyright
 * 2009-2015 Jayway Products AB
 * 2016-2018 Föreningen Sambruk
 *
 * Licensed under AGPL, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.gnu.org/licenses/agpl.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package se.streamsource.surface.web;

import org.restlet.Component;
import org.restlet.data.Protocol;
import org.slf4j.bridge.SLF4JBridgeHandler;
import se.streamsource.surface.web.rest.SurfaceRestApplication;

import java.util.logging.Handler;
import java.util.logging.Logger;

/**
 */
public class SurfaceMain
{
   private Component component;

   public static void main( String[] args ) throws Exception
   {
      new SurfaceMain().start();
   }

   public void start() throws Exception
   {
      // Remove default handlers - we do our own logging!
      for (Handler handler : Logger.getLogger( "" ).getHandlers())
      {
         Logger.getLogger( "" ).removeHandler( handler );
      }

      // Install SL4J Bridge. This will eventually delegate to log4j for logging
      SLF4JBridgeHandler.install();

      component = new Component();
      component.getServers().add( Protocol.HTTP, 8282 );
      component.getClients().add( Protocol.CLAP );
      component.getClients().add( Protocol.FILE );
      SurfaceRestApplication application = new SurfaceRestApplication( );
      component.getDefaultHost().attach( "/surface", application );
      component.start();
   }

   public void stop() throws Exception
   {
      component.stop();
   }
}
