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
import org.qi4j.api.common.QualifiedName;
import org.qi4j.api.entity.EntityReference;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.property.StateHolder;
import org.qi4j.api.service.qualifier.Tagged;
import org.qi4j.api.structure.Module;
import org.qi4j.api.value.ValueBuilder;
import org.qi4j.spi.property.PropertyTypeDescriptor;
import org.qi4j.spi.value.ValueDescriptor;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.data.ChallengeScheme;
import org.restlet.data.CharacterSet;
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
import org.restlet.resource.ClientResource;
import org.restlet.resource.ResourceException;
import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.restlet.client.CommandQueryClientFactory;
import se.streamsource.dci.restlet.client.NullResponseHandler;
import se.streamsource.streamflow.domain.form.AttachmentFieldDTO;
import se.streamsource.streamflow.domain.form.FormSignatureValue;
import se.streamsource.streamflow.resource.caze.VerifySignatureRequestValue;
import se.streamsource.streamflow.resource.caze.VerifySignatureResponseValue;
import se.streamsource.surface.web.dto.VerifyDTO;
import se.streamsource.surface.web.proxy.ProxyService;
import se.streamsource.surface.web.rest.AttachmentResponseHandler;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 */
public class FormDraftContext
{
   @Service
   @Tagged("eid")
   ProxyService proxyService;


   @Structure
   Module module;

   @Service
   FileItemFactory factory;

   public void createattachment( Response response )
   {
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

   public void verify( VerifyDTO verify)
   {
      if (proxyService.configuration().enabled().get())
      {
         VerifySignatureResponseValue value = null;

         try {
            StringBuilder param = new StringBuilder();
            param.append( "encodedTbs=").append( URLEncoder.encode( verify.encodedTbs().get(), "UTF-8" ) ).append("&");
            param.append( "provider=").append( URLEncoder.encode( verify.provider().get(), "UTF-8") ).append( "&" );
            param.append( "signature=").append( URLEncoder.encode( verify.signature().get(), "UTF-8") ).append( "&" );
            param.append( "nonce=").append( URLEncoder.encode( verify.nonce().get(), "UTF-8"));

            Reference ref = new Reference( proxyService.configuration().url().get() +"sign/verify.json" );
            Request request = new Request( Method.POST, ref, new StringRepresentation( param, MediaType.APPLICATION_WWW_FORM ) );
            ClientInfo info = new ClientInfo();
            info.setAcceptedMediaTypes( Collections.singletonList( new Preference<MediaType>( MediaType.APPLICATION_JSON ) ) );
            info.setAcceptedLanguages( Collections.singletonList( new Preference<Language>(new Language( Locale.getDefault().toString()) )));
            request.setClientInfo( info );

            Response response = new Response( request );
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

         ValueBuilder<FormSignatureValue> valueBuilder = module.valueBuilderFactory().newValueBuilder( FormSignatureValue.class );

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