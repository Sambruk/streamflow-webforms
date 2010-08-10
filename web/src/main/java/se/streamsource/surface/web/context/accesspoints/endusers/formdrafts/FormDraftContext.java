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

package se.streamsource.surface.web.context.accesspoints.endusers.formdrafts;

import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.value.ValueBuilder;
import org.restlet.representation.Representation;
import org.restlet.resource.ResourceException;
import se.streamsource.streamflow.resource.roles.IntegerDTO;
import se.streamsource.surface.web.context.accesspoints.endusers.formdrafts.summary.SummaryContext;
import se.streamsource.dci.api.IndexInteraction;
import se.streamsource.dci.api.Interactions;
import se.streamsource.dci.api.InteractionsMixin;
import se.streamsource.dci.api.SubContext;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.streamflow.domain.form.FieldSubmissionValue;
import se.streamsource.streamflow.domain.form.PageSubmissionValue;
import se.streamsource.streamflow.resource.caze.FieldDTO;

/**
 */
@Mixins(FormDraftContext.Mixin.class)
public interface FormDraftContext
   extends IndexInteraction<PageSubmissionValue>, Interactions
{
   @SubContext
   SummaryContext summary();

   void nextpage( IntegerDTO page );

   void previouspage( IntegerDTO page );

   void updatefield( FieldDTO field );

   void discard( IntegerDTO dummy );

   abstract class Mixin
      extends InteractionsMixin
      implements FormDraftContext
   {
      public PageSubmissionValue index()
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            return client.query( "index", PageSubmissionValue.class );
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
         return null;
      }

      public SummaryContext summary( )
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( "summary" ));
         return subContext( SummaryContext.class );
      }

      public void nextpage(IntegerDTO page)
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "nextpage", page);
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }

      public void previouspage(IntegerDTO page)
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "previouspage", page);
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }

      public void updatefield( FieldDTO field )
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "updatefield", field );
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }

      public void discard( IntegerDTO dummy )
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "discard", dummy );
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }
   }

}