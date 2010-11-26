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

package se.streamsource.surface.web.context;

import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.qi4j.api.common.Visibility;
import org.qi4j.api.value.ValueComposite;
import org.qi4j.bootstrap.Assembler;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.ModuleAssembly;
import org.qi4j.spi.service.importer.NewObjectImporter;
import org.restlet.Restlet;
import se.streamsource.dci.api.InteractionConstraintsService;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.restlet.client.CommandQueryClientFactory;
import se.streamsource.dci.restlet.client.NullResponseHandler;
import se.streamsource.dci.value.LinkValue;
import se.streamsource.dci.value.LinksValue;
import se.streamsource.dci.value.StringValue;
import se.streamsource.dci.value.TitledLinksValue;
import se.streamsource.streamflow.domain.attachment.AttachmentValue;
import se.streamsource.streamflow.domain.form.*;
import se.streamsource.streamflow.infrastructure.event.domain.DomainEvent;
import se.streamsource.streamflow.infrastructure.event.domain.TransactionDomainEvents;
import se.streamsource.streamflow.resource.caze.EndUserCaseDTO;
import se.streamsource.streamflow.resource.caze.FieldDTO;
import se.streamsource.streamflow.resource.caze.SubmittedFormListDTO;
import se.streamsource.streamflow.resource.caze.SubmittedFormsListDTO;
import se.streamsource.streamflow.resource.roles.IntegerDTO;
import se.streamsource.streamflow.resource.user.NewProxyUserCommand;
import se.streamsource.surface.web.ClientEventSourceService;
import se.streamsource.surface.web.resource.AccessPointResource;
import se.streamsource.surface.web.resource.AccessPointsResource;
import se.streamsource.surface.web.resource.CaseResource;
import se.streamsource.surface.web.resource.EndUserResource;
import se.streamsource.surface.web.resource.EndUsersResource;
import se.streamsource.surface.web.resource.FormDraftResource;
import se.streamsource.surface.web.resource.FormDraftsResource;
import se.streamsource.surface.web.resource.RootResource;
import se.streamsource.surface.web.resource.SurfaceRestlet;
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
      module.importServices( InteractionConstraintsService.class, NullResponseHandler.class ).
            importedBy( NewObjectImporter.class ).
            visibleIn( Visibility.application );
      module.addObjects( InteractionConstraintsService.class, 
            CommandQueryClientFactory.class, CommandQueryClient.class, CookieResponseHandler.class, AttachmentResponseHandler.class );
      module.addValues( TransactionDomainEvents.class, DomainEvent.class ).visibleIn( Visibility.application );

      module.addServices( ClientEventSourceService.class ).visibleIn( Visibility.application );

      // Import file handling service for file uploads
      DiskFileItemFactory factory = new DiskFileItemFactory();
      factory.setSizeThreshold( 1024 * 1000 * 30 ); // 30 Mb threshold TODO Make this into real service and make this number configurable
      module.importServices( FileItemFactory.class ).importedBy( INSTANCE ).setMetaInfo( factory );

      module.addValues(
            LinksValue.class,
            LinkValue.class,
            StringValue.class,
            TitledLinksValue.class,
            NewProxyUserCommand.class,
            AttachmentValue.class,
            AttachmentFieldDTO.class,
            EndUserCaseDTO.class,
            SubmittedFormsListDTO.class,
            SubmittedFormListDTO.class,
            PageSubmissionValue.class,
            FieldSubmissionValue.class,
            FieldDefinitionValue.class,
            FieldValue.class,
            AttachmentFieldValue.class,
            CheckboxesFieldValue.class,
            ComboBoxFieldValue.class,
            CommentFieldValue.class,
            DateFieldValue.class,
            ListBoxFieldValue.class,
            NumberFieldValue.class,
            OpenSelectionFieldValue.class,
            OptionButtonsFieldValue.class,
            SelectionFieldValue.class,
            TextAreaFieldValue.class,
            TextFieldValue.class,
            ValueComposite.class,
            FormDraftValue.class,
            IntegerDTO.class,
            FieldDTO.class
      ).visibleIn( Visibility.application );

      // Resources
      module.addObjects(
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

      module.importServices( Restlet.class ).visibleIn( Visibility.application );
   }}
