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

package se.streamsource.surface.web.assembler;

import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.qi4j.api.common.Visibility;
import org.qi4j.api.value.ValueComposite;
import org.qi4j.bootstrap.Assembler;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.ImportedServiceDeclaration;
import org.qi4j.bootstrap.ModuleAssembly;
import org.restlet.Restlet;
import se.streamsource.dci.api.InteractionConstraintsService;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.restlet.client.CommandQueryClientFactory;
import se.streamsource.dci.restlet.client.NullResponseHandler;
import se.streamsource.dci.value.StringValue;
import se.streamsource.dci.value.link.LinkValue;
import se.streamsource.dci.value.link.LinksValue;
import se.streamsource.dci.value.link.TitledLinksValue;
import se.streamsource.streamflow.infrastructure.event.domain.DomainEvent;
import se.streamsource.streamflow.infrastructure.event.domain.TransactionDomainEvents;
import se.streamsource.streamflow.plugin.eid.api.VerifySignatureResponseValue;
import se.streamsource.surface.web.ClientEventSourceService;
import se.streamsource.surface.web.context.AccessPointsContext;
import se.streamsource.surface.web.context.EndUsersContext;
import se.streamsource.surface.web.context.FormDraftContext;
import se.streamsource.surface.web.dto.VerifyDTO;
import se.streamsource.surface.web.resource.*;
import se.streamsource.surface.web.rest.AttachmentResponseHandler;
import se.streamsource.surface.web.rest.CookieResponseHandler;

import static org.qi4j.bootstrap.ImportedServiceDeclaration.INSTANCE;

/**
 */
public class ContextsAssembler
      implements Assembler
{
   public void assemble( ModuleAssembly module ) throws AssemblyException
   {
      module.importedServices(InteractionConstraintsService.class, NullResponseHandler.class).
            importedBy( ImportedServiceDeclaration.NEW_OBJECT ).
            visibleIn( Visibility.application );
      module.objects(InteractionConstraintsService.class,
              CommandQueryClientFactory.class, CommandQueryClient.class, CookieResponseHandler.class, AttachmentResponseHandler.class);
      module.values(TransactionDomainEvents.class, DomainEvent.class).visibleIn( Visibility.application );

      module.services(ClientEventSourceService.class).visibleIn( Visibility.application );

      // Import file handling service for file uploads
      DiskFileItemFactory factory = new DiskFileItemFactory();
      factory.setSizeThreshold( 1024 * 1000 * 30 ); // 30 Mb threshold TODO Make this into real service and make this number configurable
      module.importedServices(FileItemFactory.class).importedBy( INSTANCE ).setMetaInfo( factory );

      module.values(
              LinksValue.class,
              LinkValue.class,
              StringValue.class,
              TitledLinksValue.class,
              ValueComposite.class,
              VerifyDTO.class,
              VerifySignatureResponseValue.class
      ).visibleIn( Visibility.application );

      // Resources
      module.objects(
              SurfaceRestlet.class,
              RootResource.class,
              AccessPointsResource.class,
              AccessPointResource.class,
              EndUsersResource.class,
              EndUserResource.class,
              CaseResource.class,
              FormDraftsResource.class,
              FormDraftResource.class,

              AccessPointsContext.class,
              EndUsersContext.class,
              FormDraftContext.class
      );

      module.importedServices(Restlet.class).visibleIn( Visibility.application );
   }}
