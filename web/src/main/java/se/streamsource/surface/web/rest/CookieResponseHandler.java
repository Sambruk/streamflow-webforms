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

package se.streamsource.surface.web.rest;

import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.injection.scope.Uses;
import org.qi4j.api.value.ValueBuilderFactory;
import org.restlet.Response;
import org.restlet.data.CookieSetting;
import org.restlet.data.Method;
import org.restlet.representation.EmptyRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.ResourceException;
import se.streamsource.surface.web.context.accesspoints.endusers.EndUsersContext;
import se.streamsource.dci.restlet.client.ResponseHandler;
import se.streamsource.streamflow.infrastructure.event.DomainEvent;
import se.streamsource.streamflow.infrastructure.event.TransactionEvents;
import se.streamsource.streamflow.infrastructure.json.JSONObject;
import se.streamsource.streamflow.infrastructure.json.JSONTokener;

import java.util.List;

/**
 */
public class CookieResponseHandler
      implements ResponseHandler
{
   @Structure
   ValueBuilderFactory vbf;

   @Uses
   Response response;

   public void handleResponse( Response response ) throws ResourceException
   {
      if (response.getStatus().isSuccess() &&
            (response.getRequest().getMethod().equals( Method.POST ) ||
                  response.getRequest().getMethod().equals( Method.DELETE ) ||
                  response.getRequest().getMethod().equals( Method.PUT )))
      {
         try
         {
            Representation entity = response.getEntity();
            if (entity != null && !(entity instanceof EmptyRepresentation))
            {
               String source = entity.getText();

               final TransactionEvents transactionEvents = vbf.newValueFromJSON( TransactionEvents.class, source );

               List<DomainEvent> domainEvents = transactionEvents.events().get();
               if ( domainEvents.size()>0 )
               {
                  DomainEvent domainEvent = domainEvents.get( 0 );
                  String params = domainEvent.parameters().get();
                  JSONTokener jsonTokener = new JSONTokener( params );
                  JSONObject jsonObject = new JSONObject( jsonTokener );
                  String userId = jsonObject.getString( "param1" );


                  CookieSetting cookieSetting = new CookieSetting( EndUsersContext.COOKIE_NAME, userId );
                  // one day
                  //cookieSetting.setMaxAge( 60 * 60 * 24 );
                  cookieSetting.setMaxAge( 60 );
                  this.response.getCookieSettings().add( cookieSetting );
               }

            }
         } catch (Exception e)
         {
            throw new RuntimeException( "Could not process events", e );
         }
      }
   }
}
