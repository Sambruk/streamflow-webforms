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

   void next( Representation rep);

   void previous( Representation rep );

   void updatefield( FieldDTO field );

   abstract class Mixin
      extends InteractionsMixin
      implements FormDraftContext
   {
      public PageSubmissionValue index()
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            PageSubmissionValue value = client.query( "index", PageSubmissionValue.class );
            context.set( value );
            return value;
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

      public void next( Representation rep)
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "next", rep );
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }

      public void previous( Representation rep)
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "previous", rep );
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }

      public void updatefield( FieldDTO field )
      {
         PageSubmissionValue value = context.get( PageSubmissionValue.class );
         ValueBuilder<FieldSubmissionValue> builder = null;

         for (FieldSubmissionValue fieldSubmissionValue : value.fields().get())
         {
            if ( fieldSubmissionValue.field().get().field().get().identity().equals( field.field().get() ) )
            {
               builder = module.valueBuilderFactory().newValueBuilder( FieldSubmissionValue.class ).withPrototype( fieldSubmissionValue );
               builder.prototype().value().set( field.value().get() );

               CommandQueryClient client = context.get( CommandQueryClient.class );

               try
               {
                  client.postCommand( "updatefield", builder.newInstance() );
               } catch (ResourceException e)
               {
                  e.printStackTrace();
               }

            }
         }
      }

      public void gotopage( Representation rep )
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "gotopage", rep );
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }
   }

}