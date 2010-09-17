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

package se.streamsource.surface.web.resource;

import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.value.ValueBuilder;
import org.qi4j.api.value.ValueBuilderFactory;
import se.streamsource.dci.restlet.server.CommandResult;
import se.streamsource.streamflow.infrastructure.event.TransactionEvents;
import se.streamsource.streamflow.infrastructure.event.source.EventSource;
import se.streamsource.streamflow.infrastructure.event.source.TransactionVisitor;

/**
 */
public class EventsCommandResult
      implements CommandResult, TransactionVisitor
{
   @Structure
   protected ValueBuilderFactory vbf;

   public ThreadLocal<TransactionEvents> transactions = new ThreadLocal<TransactionEvents>();

   public EventsCommandResult( @Service EventSource source) throws Exception
   {
      source.registerListener( this );
   }

   public Object getResult()
   {
      TransactionEvents tx = transactions.get();
      transactions.set(null);
      if (tx == null)
      {
         ValueBuilder<TransactionEvents> builder = vbf.newValueBuilder( TransactionEvents.class );
         builder.prototype().timestamp().set( System.currentTimeMillis() );
         tx = builder.newInstance();
      }

      return tx;
   }


   public boolean visit( TransactionEvents transaction )
   {
      transactions.set(transaction );

      return true;
   }
}
