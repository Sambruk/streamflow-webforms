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

package se.streamsource.surface.web;

import org.qi4j.api.common.Visibility;
import org.qi4j.api.structure.Application;
import org.qi4j.bootstrap.*;
import org.qi4j.entitystore.memory.MemoryEntityStoreService;
import org.qi4j.entitystore.prefs.PreferencesEntityStoreInfo;
import org.qi4j.entitystore.prefs.PreferencesEntityStoreService;
import org.qi4j.rest.MBeanServerImporter;
import org.restlet.Client;
import se.streamsource.streamflow.infrastructure.ConfigurationManagerService;
import se.streamsource.surface.web.context.ContextsAssembler;
import se.streamsource.surface.web.proxy.ProxyConfiguration;
import se.streamsource.surface.web.proxy.ProxyService;
import se.streamsource.surface.web.resource.SurfaceResourceAssembler;
import se.streamsource.surface.web.rest.SurfaceRestAssembler;

import javax.management.MBeanServer;
import java.util.prefs.Preferences;

import static org.qi4j.api.service.qualifier.ServiceTags.tags;

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
      LayerAssembly webLayer = assembly.layerAssembly( "Web" );
      LayerAssembly appLayer = assembly.layerAssembly( "Application" );
      LayerAssembly configLayer = assembly.layerAssembly("Configuration" );

      webLayer.uses( appLayer );
      appLayer.uses( configLayer );

      assembleWebLayer( webLayer );

      assembleAppLayer( appLayer);

      assembleConfigLayer(configLayer);

      for (Object serviceObject : serviceObjects)
      {
         assembly.setMetaInfo( serviceObject );
      }

      return assembly;
   }

   private void assembleConfigLayer( LayerAssembly configLayer ) throws AssemblyException
   {
      ModuleAssembly module = configLayer.moduleAssembly( "Configurations" );

      module.addEntities( ProxyConfiguration.class ).visibleIn( Visibility.application );

      // Configuration store
      Application.Mode mode = module.layerAssembly().applicationAssembly().mode();
      if (mode.equals( Application.Mode.development ))
      {
         // In-memory store
         module.addServices( MemoryEntityStoreService.class ).visibleIn( Visibility.layer );
      } else if (mode.equals( Application.Mode.test ))
      {
         // In-memory store
         module.addServices( MemoryEntityStoreService.class ).visibleIn( Visibility.layer );
      } else if (mode.equals( Application.Mode.production ))
      {
         // Preferences storage
         ClassLoader cl = Thread.currentThread().getContextClassLoader();
         Thread.currentThread().setContextClassLoader( null );
         Preferences node;
         try
         {
            node =  Preferences.userRoot().node( "streamsource/streamflow/surface" );
         } finally
         {
            Thread.currentThread().setContextClassLoader( cl );
         }

         module.addServices( PreferencesEntityStoreService.class ).setMetaInfo( new PreferencesEntityStoreInfo( node ) ).visibleIn( Visibility.layer );
      }
   }

   protected void assembleWebLayer( LayerAssembly webLayer ) throws AssemblyException
   {
      ModuleAssembly restModule = webLayer.moduleAssembly( "REST" );
      new SurfaceRestAssembler().assemble( restModule );
      new SurfaceResourceAssembler().assemble( restModule );
      new ContextsAssembler().assemble( restModule );
   }

   private void assembleAppLayer( LayerAssembly appLayer ) throws AssemblyException
   {
      ModuleAssembly proxyModule = appLayer.moduleAssembly( "Proxy" );

      proxyModule.addServices( ProxyService.class ).
            visibleIn( Visibility.application ).
            identifiedBy( "streamflowproxy" ).
            setMetaInfo(tags("streamflow")).
            instantiateOnStartup();
      proxyModule.addServices( ProxyService.class ).
            visibleIn( Visibility.application ).
            identifiedBy( "eidproxy" ).
            setMetaInfo( tags("eid" )).
            instantiateOnStartup();
      
      proxyModule.importServices( Client.class ).visibleIn( Visibility.application );

      // TODO This should be in its own module (layer?)
      proxyModule.importServices( MBeanServer.class ).importedBy( MBeanServerImporter.class );
      proxyModule.addServices( ConfigurationManagerService.class ).instantiateOnStartup();
   }
}
