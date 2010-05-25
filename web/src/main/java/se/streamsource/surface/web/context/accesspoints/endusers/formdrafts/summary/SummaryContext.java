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

package se.streamsource.surface.web.context.accesspoints.endusers.formdrafts.summary;

import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.value.ValueBuilder;
import org.restlet.data.Form;
import org.restlet.representation.Representation;
import org.restlet.resource.ResourceException;
import se.streamsource.dci.api.IndexInteraction;
import se.streamsource.dci.api.Interactions;
import se.streamsource.dci.api.InteractionsMixin;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.streamflow.domain.form.FormSubmissionValue;
import se.streamsource.streamflow.resource.roles.IntegerDTO;

/**
 */
@Mixins(SummaryContext.Mixin.class)
public interface SummaryContext
   extends Interactions, IndexInteraction<FormSubmissionValue>
{
   void submit();

   void gotopage( Representation rep );

   abstract class Mixin
      extends InteractionsMixin
      implements SummaryContext
   {
      public FormSubmissionValue index()
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            return client.query( "index", FormSubmissionValue.class );
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
         return null;
      }

      public void submit()
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "submit" );
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
      }

      public void gotopage( Representation rep )
      {
         Form form = new Form( rep );

         CommandQueryClient client = context.get( CommandQueryClient.class );

         ValueBuilder<IntegerDTO> builder = module.valueBuilderFactory().newValueBuilder( IntegerDTO.class );
         for (String key : form.getValuesMap().keySet())
         {
            builder.prototype().integer().set( Integer.parseInt( form.getValues( key ) ) );
         }

         try
         {
            client.postCommand( "gotopage", builder.newInstance() );
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }
   }

}