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

package se.streamsource.surface.web.resource;

import org.qi4j.api.common.Visibility;
import org.qi4j.bootstrap.Assembler;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.ModuleAssembly;
import se.streamsource.dci.restlet.server.DCIAssembler;
import se.streamsource.dci.restlet.server.NullCommandResult;
import se.streamsource.surface.web.rest.*;

import static org.qi4j.bootstrap.ImportedServiceDeclaration.NEW_OBJECT;

/**
 */
public class SurfaceResourceAssembler
      implements Assembler
{
   public void assemble( ModuleAssembly module )
         throws AssemblyException
   {
      new DCIAssembler().assemble( module );

      module.importedServices(NullCommandResult.class).importedBy( NEW_OBJECT );
      module.objects(NullCommandResult.class).visibleIn( Visibility.layer );

      // Resources
      module.objects(
              IndexRestlet.class,
              StreamflowProxyRestlet.class,
              EidProxyRestlet.class
      );

      module.objects(CookieResponseHandler.class, AttachmentResponseHandler.class).visibleIn( Visibility.layer );
   }
}