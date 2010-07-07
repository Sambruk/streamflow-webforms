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

package se.streamsource.surface.web.context.accesspoints.endusers;

import org.qi4j.api.mixin.Mixins;
import org.restlet.resource.ResourceException;
import se.streamsource.surface.web.context.accesspoints.endusers.formdrafts.FormDraftsContext;
import se.streamsource.surface.web.context.accesspoints.endusers.requiredforms.RequiredFormsContext;
import se.streamsource.surface.web.context.accesspoints.endusers.submittedforms.SubmittedFormsContext;
import se.streamsource.dci.api.IndexInteraction;
import se.streamsource.dci.api.Interactions;
import se.streamsource.dci.api.InteractionsMixin;
import se.streamsource.dci.api.SubContext;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.StringValue;
import se.streamsource.streamflow.resource.caze.EndUserCaseDTO;

/**
 */
@Mixins(CaseContext.Mixin.class)
public interface CaseContext
      extends Interactions, IndexInteraction<EndUserCaseDTO>
{
   // commands
   void sendtofunction( StringValue dummy );

   @SubContext
   SubmittedFormsContext submittedforms();

   @SubContext
   RequiredFormsContext requiredforms();

   @SubContext
   FormDraftsContext formdrafts();

   abstract class Mixin
         extends InteractionsMixin
         implements CaseContext
   {
      public EndUserCaseDTO index()
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            return client.query( "index", EndUserCaseDTO.class);
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
         return null;
      }

      public void changedescription( StringValue newDescription )
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "changedescription", newDescription );
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }

      public void sendtofunction( StringValue dummy )
      {
         CommandQueryClient client = context.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "sendtofunction" );
         } catch (ResourceException e)
         {
            e.printStackTrace();
         }
      }


      public SubmittedFormsContext submittedforms()
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( "submittedforms" ));
         return subContext( SubmittedFormsContext.class );
      }

      public RequiredFormsContext requiredforms()
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( "requiredforms" ));
         return subContext( RequiredFormsContext.class );
      }

      public FormDraftsContext formdrafts()
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( "formdrafts" ));
         return subContext( FormDraftsContext.class );
      }

   }

}