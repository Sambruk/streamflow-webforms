/**
 *
 * Copyright 2009-2012 Jayway Products AB
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

import java.io.BufferedInputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.FileUploadException;
import org.json.JSONArray;
import org.qi4j.api.entity.EntityReference;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.service.qualifier.Tagged;
import org.qi4j.api.structure.Module;
import org.qi4j.api.value.ValueBuilder;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.data.ClientInfo;
import org.restlet.data.Disposition;
import org.restlet.data.Form;
import org.restlet.data.Language;
import org.restlet.data.MediaType;
import org.restlet.data.Method;
import org.restlet.data.Preference;
import org.restlet.data.Reference;
import org.restlet.data.Status;
import org.restlet.ext.fileupload.RestletFileUpload;
import org.restlet.representation.InputRepresentation;
import org.restlet.representation.Representation;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.ResourceException;

import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.streamflow.api.workspace.cases.attachment.UpdateAttachmentDTO;
import se.streamsource.streamflow.plugin.eid.api.VerifySignatureResponseValue;
import se.streamsource.streamflow.surface.api.AttachmentFieldDTO;
import se.streamsource.streamflow.surface.api.FormSignatureDTO;
import se.streamsource.surface.web.dto.VerifyDTO;
import se.streamsource.surface.web.proxy.ProxyService;
import se.streamsource.surface.web.rest.AttachmentResponseHandler;

/**
 */
public class FormDraftContext
{
   /*@Service
   @IdentifiedBy("client")
   ServiceReference<Uniform> proxyService;
*/

   @Service
   @Tagged("eid")
   ProxyService proxyService;


   @Structure
   Module module;

   @Service
   FileItemFactory factory;

   private static final Set<MediaType> acceptedTypes = new HashSet<MediaType>();

   static
   {
      acceptedTypes.add( MediaType.APPLICATION_PDF );
      acceptedTypes.add( MediaType.IMAGE_PNG);
      acceptedTypes.add( MediaType.IMAGE_JPEG );
   }

   public JSONArray createattachment( Response response ) throws Exception
   {
      Request request = response.getRequest();
      Representation representation = request.getEntity();

      if (MediaType.MULTIPART_FORM_DATA.equals( representation.getMediaType(), true ))
      {
         RestletFileUpload upload = new RestletFileUpload( factory );
         upload.setHeaderEncoding( "UTF-8" );
         try
         {
            List<FileItem> items = upload.parseRequest( request );
            int numberOfFiles = 0;
            FileItem fi = null;
            for (FileItem fileItem : items)
            {
               if (!fileItem.isFormField()) {
                  numberOfFiles++;
                  fi = fileItem;
               }
            }
            if ( numberOfFiles != 1 ) 
            {
               throw new ResourceException( Status.CLIENT_ERROR_METHOD_NOT_ALLOWED, "Could not handle multiple files" );
            }
            
            if ( !acceptedTypes.contains( MediaType.valueOf( fi.getContentType() ) ) )
            {
               throw new ResourceException( Status.CLIENT_ERROR_UNSUPPORTED_MEDIA_TYPE, "Could not upload file" );
            }

            Representation input = new InputRepresentation(new BufferedInputStream(fi.getInputStream()));
            Form disposition = new Form();
            disposition.set( Disposition.NAME_FILENAME, fi.getName() );
            disposition.set( Disposition.NAME_SIZE, Long.toString(fi.getSize()) );

            input.setDisposition( new Disposition(Disposition.TYPE_NONE, disposition) );


            CommandQueryClient client = RoleMap.current().get( CommandQueryClient.class );
            AttachmentResponseHandler responseHandler = module.objectBuilderFactory()
                  .newObjectBuilder( AttachmentResponseHandler.class )
                  .newInstance();
            client.getClient( "attachments/" ).postCommand( "createformattachment", input, responseHandler );

            ValueBuilder<UpdateAttachmentDTO> attachmentUpdateBuilder = module.valueBuilderFactory().newValueBuilder(UpdateAttachmentDTO.class);
            attachmentUpdateBuilder.prototype().name().set( fi.getName() );
            attachmentUpdateBuilder.prototype().size().set( fi.getSize() );
            attachmentUpdateBuilder.prototype().mimeType().set( fi.getContentType() );

            ValueBuilder<AttachmentFieldDTO> attachmentFieldUpdateBuilder = responseHandler.getAttachmentValue();

            // update attachment entity first with filename, size and mime type
            client.getClient( "attachments/" + attachmentFieldUpdateBuilder.prototype().attachment().get().identity() + "/" ).postCommand( "update", attachmentUpdateBuilder.newInstance() );

            attachmentFieldUpdateBuilder.prototype().field().set( EntityReference.parseEntityReference( fi.getFieldName() ) );
            attachmentFieldUpdateBuilder.prototype().name().set( fi.getName() );

            // update form submission attachment field with name and attachment field entity reference.
            client.postCommand( "updateattachmentfield", attachmentFieldUpdateBuilder.newInstance() );

            StringBuffer result = new StringBuffer( "[" ).append(attachmentUpdateBuilder.newInstance().toJSON() ).append( "]");
            return new JSONArray(result.toString());
            
         } catch (FileUploadException e)
         {
            throw new ResourceException( Status.CLIENT_ERROR_BAD_REQUEST, "Could not upload file", e );
         } catch ( IOException e)
         {
            throw new ResourceException( Status.CLIENT_ERROR_BAD_REQUEST, "Could not upload file", e );
         }
      }
      return null;
   }

   public void verify( VerifyDTO verify)
   {
      if (proxyService.isAvailable())
      {
         VerifySignatureResponseValue value = null;

         try {
            StringBuilder param = new StringBuilder();
            param.append( "encodedTbs=").append( URLEncoder.encode( verify.encodedTbs().get(), "UTF-8" ) ).append("&");
            param.append( "provider=").append( URLEncoder.encode( verify.provider().get(), "UTF-8") ).append( "&" );
            param.append( "signature=").append( URLEncoder.encode( verify.signature().get(), "UTF-8") ).append( "&" );
            param.append( "nonce=").append( URLEncoder.encode( verify.nonce().get(), "UTF-8"));

            Reference ref = new Reference( "/sign/verify.json" );
            Request request = new Request( Method.POST, ref, new StringRepresentation( param, MediaType.APPLICATION_WWW_FORM ) );
            ClientInfo info = new ClientInfo();
            info.setAcceptedMediaTypes( Collections.singletonList( new Preference<MediaType>( MediaType.APPLICATION_JSON ) ) );
            info.setAcceptedLanguages( Collections.singletonList( new Preference<Language>(new Language( Locale.getDefault().toString()) )));
            request.setClientInfo( info );

            Response response = new Response( request );
            //proxyService.get().handle( request, response );
            proxyService.handle( request, response );
            // TODO handle error!!!
            if ( response.getStatus().equals( Status.SERVER_ERROR_INTERNAL ))
            {
               throw new ResourceException( Status.SERVER_ERROR_INTERNAL );
            }

            value = module.valueBuilderFactory().newValueFromJSON( VerifySignatureResponseValue.class, response.getEntity().getText() );
         } catch (IOException e)
         {
            throw new ResourceException( Status.SERVER_ERROR_INTERNAL );
         }

         CommandQueryClient client = RoleMap.current().get( CommandQueryClient.class );

         ValueBuilder<FormSignatureDTO> valueBuilder = module.valueBuilderFactory().newValueBuilder( FormSignatureDTO.class );

         valueBuilder.prototype().encodedForm().set( verify.encodedTbs().get() );
         valueBuilder.prototype().form().set( verify.form().get() );
         valueBuilder.prototype().name().set( verify.name().get() );
         valueBuilder.prototype().provider().set( verify.provider().get() );

         valueBuilder.prototype().signature().set( value.signature().get() );
         valueBuilder.prototype().signerId().set( value.signerId().get() );
         valueBuilder.prototype().signerName().set( value.signerName().get() );

         client.postCommand( "addsignature", valueBuilder.newInstance() );
      }
   }

}