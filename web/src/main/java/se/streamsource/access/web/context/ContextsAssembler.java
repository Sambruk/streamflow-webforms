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

package se.streamsource.access.web.context;

import org.qi4j.api.common.Visibility;
import org.qi4j.api.value.ValueComposite;
import org.qi4j.bootstrap.Assembler;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.ModuleAssembly;
import org.qi4j.spi.service.importer.NewObjectImporter;
import org.restlet.Restlet;
import se.streamsource.access.web.ClientEventSourceService;
import se.streamsource.access.web.context.accesspoints.AccessPointContext;
import se.streamsource.access.web.context.accesspoints.AccessPointsContext;
import se.streamsource.access.web.context.accesspoints.endusers.CaseContext;
import se.streamsource.access.web.context.accesspoints.endusers.EndUserContext;
import se.streamsource.access.web.context.accesspoints.endusers.EndUsersContext;
import se.streamsource.access.web.context.accesspoints.endusers.formdrafts.FormDraftContext;
import se.streamsource.access.web.context.accesspoints.endusers.formdrafts.FormDraftsContext;
import se.streamsource.access.web.context.accesspoints.endusers.formdrafts.summary.SummaryContext;
import se.streamsource.access.web.context.accesspoints.endusers.submittedforms.SubmittedFormsContext;
import se.streamsource.access.web.context.OrganizationContext;
import se.streamsource.access.web.context.OrganizationsContext;
import se.streamsource.access.web.context.accesspoints.ProxyUserContext;
import se.streamsource.access.web.context.projects.CaseTypesContext;
import se.streamsource.access.web.context.projects.ProjectsContext;
import se.streamsource.access.web.context.proxyusers.ProxyUsersContext;
import se.streamsource.access.web.context.accesspoints.endusers.requiredforms.RequiredFormsContext;
import se.streamsource.access.web.context.projects.LabelsContext;
import se.streamsource.access.web.rest.CookieResponseHandler;
import se.streamsource.dci.api.InteractionConstraintsService;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.restlet.client.NullResponseHandler;
import se.streamsource.dci.value.IndexValue;
import se.streamsource.dci.value.LinkValue;
import se.streamsource.dci.value.LinksValue;
import se.streamsource.dci.value.StringValue;
import se.streamsource.dci.value.TitledLinksValue;
import se.streamsource.streamflow.domain.form.CommentFieldValue;
import se.streamsource.streamflow.domain.form.DateFieldValue;
import se.streamsource.streamflow.domain.form.FieldDefinitionValue;
import se.streamsource.streamflow.domain.form.FieldSubmissionValue;
import se.streamsource.streamflow.domain.form.FieldValue;
import se.streamsource.streamflow.domain.form.FormSubmissionValue;
import se.streamsource.streamflow.domain.form.NumberFieldValue;
import se.streamsource.streamflow.domain.form.PageSubmissionValue;
import se.streamsource.streamflow.domain.form.SelectionFieldValue;
import se.streamsource.streamflow.domain.form.TextFieldValue;
import se.streamsource.streamflow.infrastructure.event.DomainEvent;
import se.streamsource.streamflow.infrastructure.event.TransactionEvents;
import se.streamsource.streamflow.resource.caze.FieldDTO;
import se.streamsource.streamflow.resource.caze.ProxyUserCaseDTO;
import se.streamsource.streamflow.resource.caze.SubmittedFormListDTO;
import se.streamsource.streamflow.resource.caze.SubmittedFormsListDTO;
import se.streamsource.streamflow.resource.roles.EntityReferenceDTO;
import se.streamsource.streamflow.resource.roles.IntegerDTO;
import se.streamsource.streamflow.resource.user.NewProxyUserCommand;

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
            CommandQueryClient.class, CookieResponseHandler.class );
      module.addValues( TransactionEvents.class, DomainEvent.class ).visibleIn( Visibility.application );

      module.addServices( ClientEventSourceService.class ).visibleIn( Visibility.application );

      module.addValues(
            IndexValue.class,
            LinksValue.class,
            LinkValue.class,
            StringValue.class,
            TitledLinksValue.class,
            NewProxyUserCommand.class,
            ProxyUserCaseDTO.class,
            SubmittedFormsListDTO.class,
            SubmittedFormListDTO.class,
            PageSubmissionValue.class,
            FieldSubmissionValue.class,
            FieldDefinitionValue.class,
            FieldValue.class,
            CommentFieldValue.class,
            DateFieldValue.class,
            NumberFieldValue.class,
            SelectionFieldValue.class,
            TextFieldValue.class,
            ValueComposite.class,
            EntityReferenceDTO.class,
            FormSubmissionValue.class,
            IntegerDTO.class,
            FieldDTO.class
      ).visibleIn( Visibility.application );


      // Only expose the root the upper layers
      module.addTransients(
            RootContext.class).visibleIn( Visibility.application);

      module.addTransients(
            FormDraftContext.class,
            FormDraftsContext.class,
            SummaryContext.class,
            RequiredFormsContext.class,
            SubmittedFormsContext.class,

            AccessPointContext.class,
            AccessPointsContext.class,
            CaseContext.class,
            EndUsersContext.class,
            EndUserContext.class,
            OrganizationContext.class,
            OrganizationsContext.class,
            ProxyUserContext.class,
            ProxyUsersContext.class,

            CaseTypesContext.class,
            LabelsContext.class,
            ProjectsContext.class
      );

      module.importServices( Restlet.class ).visibleIn( Visibility.application );
   }}
