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

import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.value.ValueBuilderFactory;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Method;
import org.restlet.data.Status;

import se.streamsource.surface.web.application.security.HashService;
import se.streamsource.surface.web.dto.UserInfoDTO;

public class LoginRestlet extends Restlet
{

   @Structure
   ValueBuilderFactory vbf;
   
   @Service
   HashService hashService;
   
   @Override
   public void handle(Request request, Response response)
   {
      super.handle( request, response );

      if (request.getMethod().equals( Method.GET ))
      {
         Form form = request.getResourceRef().getQueryAsForm();
         String username = form.getFirstValue( "username" );
         String password = form.getFirstValue( "password" );
         if (username.equals( password ))
         {
            UserInfoDTO prototype = vbf.newValueBuilder( UserInfoDTO.class ).prototype();
            prototype.contactId().set( "197606030001" );
            prototype.name().set( "Henrik Reinhold");
            prototype.createdOn().set( new Date());
            prototype.hash().set(hashService.hash(prototype));
            response.setEntity( prototype.toJSON(), MediaType.APPLICATION_JSON );
            response.setStatus( Status.SUCCESS_OK );
         } else
         {
            response.setStatus( Status.CLIENT_ERROR_UNAUTHORIZED );
         }
      } else 
      {
         response.setStatus( Status.CLIENT_ERROR_METHOD_NOT_ALLOWED );
      }
   }
}
