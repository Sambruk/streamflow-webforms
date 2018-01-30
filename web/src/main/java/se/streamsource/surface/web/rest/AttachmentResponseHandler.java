/**
 *
 * Copyright
 * 2009-2015 Jayway Products AB
 * 2016-2018 Föreningen Sambruk
 *
 * Licensed under AGPL, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.gnu.org/licenses/agpl.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package se.streamsource.surface.web.rest;

import org.qi4j.api.entity.EntityReference;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.value.ValueBuilder;
import org.qi4j.api.value.ValueBuilderFactory;
import org.restlet.Response;
import org.restlet.data.Method;
import org.restlet.representation.EmptyRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.ResourceException;
import org.slf4j.LoggerFactory;
import se.streamsource.dci.restlet.client.ResponseHandler;
import se.streamsource.streamflow.infrastructure.event.domain.DomainEvent;
import se.streamsource.streamflow.infrastructure.event.domain.TransactionDomainEvents;
import se.streamsource.streamflow.infrastructure.event.domain.source.helper.EventParameters;
import se.streamsource.streamflow.surface.api.AttachmentFieldDTO;

import java.io.IOException;

import static org.qi4j.api.util.Iterables.first;
import static se.streamsource.streamflow.infrastructure.event.domain.source.helper.Events.events;

/**
 */
public class AttachmentResponseHandler
      implements ResponseHandler
{
   @Structure
   ValueBuilderFactory vbf;

   private ValueBuilder<AttachmentFieldDTO> attachmentFieldDTO;

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

               DomainEvent domainEvent = first( events(transactionEvents));
               if ( domainEvent != null)
               {
                  String attachmentId = EventParameters.getParameter(domainEvent, "param1");
                  attachmentFieldDTO = vbf.newValueBuilder( AttachmentFieldDTO.class );
                  attachmentFieldDTO.prototype().attachment().set( EntityReference.parseEntityReference( attachmentId ) );
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

   public ValueBuilder<AttachmentFieldDTO> getAttachmentValue()
   {
      return attachmentFieldDTO;
   }

}


