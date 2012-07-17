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
package se.streamsource.surface.web.rest;

import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.value.ValueBuilderFactory;
import org.restlet.Response;
import org.restlet.data.CookieSetting;
import org.restlet.data.Method;
import org.restlet.representation.EmptyRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.ResourceException;
import org.slf4j.LoggerFactory;
import se.streamsource.dci.restlet.client.ResponseHandler;
import se.streamsource.streamflow.infrastructure.event.domain.DomainEvent;
import se.streamsource.streamflow.infrastructure.event.domain.TransactionDomainEvents;
import se.streamsource.streamflow.infrastructure.event.domain.source.helper.EventParameters;
import se.streamsource.surface.web.context.EndUsersContext;

import java.io.IOException;

import static org.qi4j.api.util.Iterables.first;
import static se.streamsource.streamflow.infrastructure.event.domain.source.helper.Events.events;

/**
 */
public class CookieResponseHandler
      implements ResponseHandler
{
   @Structure
   ValueBuilderFactory vbf;

   private CookieSetting cookieSetting;

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

               final TransactionDomainEvents transactionEvents = vbf.newValueFromJSON( TransactionDomainEvents.class, source );

               DomainEvent domainEvent = first( events( transactionEvents ));
               if ( domainEvent != null)
               {
                  String userId = EventParameters.getParameter( domainEvent, "param1" );

                  cookieSetting = new CookieSetting( EndUsersContext.COOKIE_NAME, userId );
                  // two weeks
                  cookieSetting.setMaxAge( 60 * 60 * 24 * 14 );
               }

            }
         } catch (Exception e)
         {
            throw new RuntimeException( "Could not process events", e );
         }
         try
         {
            response.getEntity().exhaust();
         } catch (IOException e)
         {
            LoggerFactory.getLogger( getClass() ).error( "Could not parse cookies", e );
         }
         response.release();
      }
   }

   public CookieSetting getCookieSetting()
   {
      return cookieSetting;
   }
}
