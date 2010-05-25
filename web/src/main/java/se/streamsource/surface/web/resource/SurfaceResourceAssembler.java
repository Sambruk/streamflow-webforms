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

import org.qi4j.api.common.Visibility;
import org.qi4j.bootstrap.Assembler;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.ModuleAssembly;
import org.qi4j.spi.service.importer.NewObjectImporter;
import se.streamsource.surface.web.ClientEventSourceService;
import se.streamsource.surface.web.rest.CookieResponseHandler;
import se.streamsource.dci.restlet.client.ResponseHandler;
import se.streamsource.dci.restlet.server.DCIAssembler;
import se.streamsource.dci.restlet.server.DefaultResponseWriterFactory;

/**
 */
public class SurfaceResourceAssembler
   implements Assembler
{
   public void assemble( ModuleAssembly module ) throws AssemblyException
   {
     module.addObjects( DefaultResponseWriterFactory.class, EventsCommandResult.class );
      new DCIAssembler().assemble( module );

      module.importServices( SurfaceRootContextFactory.class ).importedBy( NewObjectImporter.class );

      // Resources
      module.addObjects(
            SurfaceRootContextFactory.class
      );

      module.addServices( ClientEventSourceService.class ).visibleIn( Visibility.application );
      
      module.importServices( ResponseHandler.class ).importedBy( NewObjectImporter.class ).visibleIn( Visibility.application );

      module.addObjects( CookieResponseHandler.class ).visibleIn( Visibility.application );

   }
}