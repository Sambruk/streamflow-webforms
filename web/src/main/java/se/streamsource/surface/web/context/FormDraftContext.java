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

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileItemFactory;
import org.qi4j.api.entity.EntityReference;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.structure.Module;
import org.qi4j.api.value.ValueBuilder;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.data.Disposition;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.ext.fileupload.RestletFileUpload;
import org.restlet.representation.InputRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.ResourceException;
import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.LinkValue;
import se.streamsource.dci.value.LinksValue;
import se.streamsource.streamflow.domain.form.AttachmentFieldDTO;
import se.streamsource.surface.web.rest.AttachmentResponseHandler;

import java.io.BufferedInputStream;
import java.util.List;

import static se.streamsource.streamflow.infrastructure.event.domain.source.helper.Events.withNames;

/**
 */
public class FormDraftContext
{
   @Structure
   Module module;

   @Service
   FileItemFactory factory;

   public void createattachment( Response response )
   {
      deleteOldAttachment();

      Request request = response.getRequest();
      Representation representation = request.getEntity();

      if (MediaType.MULTIPART_FORM_DATA.equals( representation.getMediaType(), true ))
      {
         RestletFileUpload upload = new RestletFileUpload( factory );

         try
         {
            List items = upload.parseRequest( request );
            if ( items.size() != 1 ) return; // handle only one attachment
            final FileItem fi = (FileItem) items.get( 0 );

            Representation input = new InputRepresentation(new BufferedInputStream(fi.getInputStream()));
            Form disposition = new Form();
            disposition.set( Disposition.NAME_FILENAME, fi.getName() );
            disposition.set( Disposition.NAME_SIZE, Long.toString(fi.getSize()) );

            input.setDisposition( new Disposition(Disposition.TYPE_NONE, disposition) );

            CommandQueryClient client = RoleMap.current().get( CommandQueryClient.class );
            AttachmentResponseHandler responseHandler = module.objectBuilderFactory()
                  .newObjectBuilder( AttachmentResponseHandler.class )
                  .newInstance();
            client.getClient( "attachments/" ).postCommand( "createattachment", input, responseHandler );

            ValueBuilder<AttachmentFieldDTO> builder = responseHandler.getAttachmentValue();
            builder.prototype().field().set( EntityReference.parseEntityReference( fi.getFieldName() ) );
            builder.prototype().name().set( fi.getName() );

            client.postCommand( "updateattachmentfield", builder.newInstance() );
         } catch (Exception e)
         {
            throw new ResourceException( Status.CLIENT_ERROR_BAD_REQUEST, "Could not upload file", e );
         }
      }
   }

   private void deleteOldAttachment()
   {
      CommandQueryClient client = RoleMap.current().get( CommandQueryClient.class ).getClient( "attachments/" );
      LinksValue attachments = client.query( "index", LinksValue.class );
      for (LinkValue value : attachments.links().get())
      {
         client.getClient( value ).delete();
      }
   }
}