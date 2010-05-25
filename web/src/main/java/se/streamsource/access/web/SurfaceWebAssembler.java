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

package se.streamsource.access.web;

import org.qi4j.bootstrap.ApplicationAssembler;
import org.qi4j.bootstrap.ApplicationAssembly;
import org.qi4j.bootstrap.ApplicationAssemblyFactory;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.LayerAssembly;
import org.qi4j.bootstrap.ModuleAssembly;
import se.streamsource.access.web.context.ContextsAssembler;
import se.streamsource.access.web.resource.SurfaceResourceAssembler;
import se.streamsource.access.web.rest.SurfaceRestAssembler;

public class SurfaceWebAssembler
   implements ApplicationAssembler
{
      private Object[] serviceObjects;

   public SurfaceWebAssembler( Object... serviceObjects )
   {
      this.serviceObjects = serviceObjects;
   }

   public ApplicationAssembly assemble( ApplicationAssemblyFactory applicationFactory ) throws AssemblyException
   {
      ApplicationAssembly assembly = applicationFactory.newApplicationAssembly();
      assembly.setName( "StreamFlowSurface" );
      assembly.setVersion( "0.3.20.962" );
      LayerAssembly contextLayer = assembly.layerAssembly( "Context" );
      LayerAssembly webLayer = assembly.layerAssembly( "Web" );

      webLayer.uses( contextLayer );

      assembleWebLayer( webLayer );

      assembleContextLayer( contextLayer );

      for (Object serviceObject : serviceObjects)
      {
         assembly.setMetaInfo( serviceObject );
      }

      return assembly;
   }


   protected void assembleWebLayer( LayerAssembly webLayer ) throws AssemblyException
   {
      ModuleAssembly restModule = webLayer.moduleAssembly( "REST" );
      new SurfaceRestAssembler().assemble( restModule );
      new SurfaceResourceAssembler().assemble( restModule );
   }

   protected void assembleContextLayer( LayerAssembly contextLayer ) throws AssemblyException
   {
      ModuleAssembly moduleAssembly = contextLayer.moduleAssembly( "Context" );
      new ContextsAssembler().assemble( moduleAssembly );
   }
}
