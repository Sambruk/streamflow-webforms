/**
 *
 * Copyright 2009-2015 Jayway Products AB
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
package se.streamsource.surface.web.assembler;

import static org.qi4j.bootstrap.ImportedServiceDeclaration.NEW_OBJECT;

import org.qi4j.api.common.Visibility;
import org.qi4j.bootstrap.Assembler;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.ModuleAssembly;

import se.streamsource.dci.restlet.server.DCIAssembler;
import se.streamsource.dci.restlet.server.NullCommandResult;
import se.streamsource.dci.value.ValueAssembler;
import se.streamsource.streamflow.surface.api.assembler.SurfaceAPIAssembler;
import se.streamsource.surface.web.rest.AttachmentResponseHandler;
import se.streamsource.surface.web.rest.AuthenticateRestlet;
import se.streamsource.surface.web.rest.CookieResponseHandler;
import se.streamsource.surface.web.rest.EidProxyRestlet;
import se.streamsource.surface.web.rest.IndexRestlet;
import se.streamsource.surface.web.rest.ProfileRestlet;
import se.streamsource.surface.web.rest.StreamflowProxyRestlet;
import se.streamsource.surface.web.rest.TextsRestlet;

/**
 */
public class SurfaceResourceAssembler
      implements Assembler
{
   public void assemble( ModuleAssembly module )
         throws AssemblyException
   {
      new ValueAssembler().assemble( module );
      new DCIAssembler().assemble( module );
      new SurfaceAPIAssembler().assemble( module );

      module.importedServices(NullCommandResult.class).importedBy( NEW_OBJECT );
      module.objects(NullCommandResult.class).visibleIn( Visibility.layer );

      // Resources
      module.objects(
              IndexRestlet.class,
              StreamflowProxyRestlet.class,
              EidProxyRestlet.class,
              ProfileRestlet.class,
              TextsRestlet.class,
              AuthenticateRestlet.class
      );

      module.objects(CookieResponseHandler.class, AttachmentResponseHandler.class).visibleIn( Visibility.layer );
   }
}