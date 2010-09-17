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

package se.streamsource.surface.web.context.projects;

import org.qi4j.api.mixin.Mixins;
import se.streamsource.dci.api.Context;
import se.streamsource.dci.api.ContextMixin;
import se.streamsource.dci.api.IndexContext;
import se.streamsource.dci.api.SubContexts;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.StringValue;
import se.streamsource.dci.value.TitledLinksValue;

/**
 */
@Mixins(LabelsContext.Mixin.class)
public interface LabelsContext
      extends SubContexts<LabelsContext>, IndexContext<TitledLinksValue>, Context
{
   void createaccesspoint( StringValue name );

   abstract class Mixin
         extends ContextMixin
         implements LabelsContext
   {
      public LabelsContext context( String id )
      {
         roleMap.set( roleMap.get( CommandQueryClient.class ).getSubClient( id ));
         return subContext( LabelsContext.class );
      }


      public void createaccesspoint( StringValue name )
      {
         CommandQueryClient client = roleMap.get( CommandQueryClient.class );

         try
         {
            client.postCommand( "createaccesspoint", name );
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
      }

      public TitledLinksValue index()
      {
         CommandQueryClient client = roleMap.get( CommandQueryClient.class );

         try
         {
            return client.query( "index", TitledLinksValue.class );
         } catch (Throwable e)
         {
            e.printStackTrace();
         }
         return null;
      }

   }

}