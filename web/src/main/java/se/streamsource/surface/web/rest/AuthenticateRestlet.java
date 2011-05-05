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

package se.streamsource.surface.web.rest;

import java.util.Date;

import org.json.JSONException;
import org.json.JSONObject;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.service.qualifier.Tagged;
import org.qi4j.api.value.ValueBuilder;
import org.qi4j.api.value.ValueBuilderFactory;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.Uniform;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Method;
import org.restlet.data.Reference;
import org.restlet.data.Status;
import org.restlet.resource.ResourceException;

import se.streamsource.surface.web.application.security.HashService;
import se.streamsource.surface.web.dto.UserInfoDTO;

/**
 * TODO
 */
public class AuthenticateRestlet extends Restlet
{
   @Service
   @Tagged("eid")
   Uniform proxyService;

   @Structure
   ValueBuilderFactory vbf;

   @Service
   HashService hashService;
   
   @Override
   public void handle(Request request, Response response)
   {
      super.handle( request, response );

      Form form = new Form(request.getEntity());
      String provider = form.getFirstValue( "provider" );

      if ("nexus-personal_4".equals( provider ) || "netmaker-netid_4".equals( provider ))
      {

         Form headers = (Form) request.getAttributes().get( "org.restlet.http.headers" );

         String cert = headers.getFirstValue( "ssl_client_cert" );

         cert = cert.substring( "-----BEGIN CERTIFICATE----- ".length(),
               cert.length() - " -----END CERTIFICATE-----".length() );

         Form verifycertForm = new Form();
         verifycertForm.set( "certificate", cert );
         verifycertForm.set( "provider", provider );
         Request certRequest = new Request( Method.POST, new Reference( "/authentication/verifycert" ),
               verifycertForm.getWebRepresentation() );
         proxyService.handle( certRequest, response );

         try
         {
            createResponse( response );
         } catch (Exception e)
         {
            throw new ResourceException( Status.CLIENT_ERROR_UNAUTHORIZED, "Could not authorize user" );
         }
         
      } else if ("nexus-personal_4X".equals( provider ))
      {
         Request certRequest = new Request( Method.POST, new Reference( "/authentication/verify.json" ),
               form.getWebRepresentation() );
         proxyService.handle( certRequest, response );
         
         try
         {
            createResponse( response );
         } catch (Exception e)
         {
            throw new ResourceException( Status.CLIENT_ERROR_UNAUTHORIZED, "Could not authorize user" );
         }
         
      } else
      {
         throw new ResourceException( Status.CLIENT_ERROR_BAD_REQUEST, "Missing provider query parameter" );
      }
   }
   
   private void createResponse( Response response ) throws Exception{
      if (Status.SUCCESS_OK.equals( response.getStatus()))
      {
         String entityAsText = response.getEntityAsText();

         JSONObject jsonObject = new JSONObject( entityAsText );
         ValueBuilder<UserInfoDTO> builder = vbf.newValueBuilder( UserInfoDTO.class );
         builder.prototype().name().set( jsonObject.getString( "name" ) );
         builder.prototype().contactId().set( jsonObject.getString( "contactId" ) );
         builder.prototype().createdOn().set( new Date());
         builder.prototype().hash().set(hashService.hash(builder.prototype()));
         response.setEntity( builder.newInstance().toJSON(), MediaType.APPLICATION_JSON );
         response.setStatus( Status.SUCCESS_OK );
      } 
   }
}
