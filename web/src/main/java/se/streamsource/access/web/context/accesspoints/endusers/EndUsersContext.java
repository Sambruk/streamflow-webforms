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

package se.streamsource.access.web.context.accesspoints.endusers;

import org.qi4j.api.entity.EntityReference;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.unitofwork.NoSuchEntityException;
import org.qi4j.api.value.ValueBuilder;
import org.restlet.Response;
import org.restlet.data.Cookie;
import org.restlet.data.Status;
import org.restlet.representation.EmptyRepresentation;
import org.restlet.resource.ResourceException;
import org.restlet.util.Series;
import se.streamsource.access.web.rest.CookieResponseHandler;
import se.streamsource.dci.api.ContextNotFoundException;
import se.streamsource.dci.api.Interactions;
import se.streamsource.dci.api.InteractionsMixin;
import se.streamsource.dci.api.SubContexts;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.LinkValue;

/**
 */
@Mixins(EndUsersContext.Mixin.class)
public interface EndUsersContext
      extends SubContexts<EndUserContext>, Interactions
{
   public static final String COOKIE_NAME = "ANONYMOUS_USER";


   void selectenduser( Response response ) throws ResourceException;

   LinkValue viewenduser( Response response ) throws ResourceException;

   abstract class Mixin
         extends InteractionsMixin
         implements EndUsersContext
   {
      public EndUserContext context( String id ) throws ContextNotFoundException
      {
         context.set( context.get( CommandQueryClient.class ).getSubClient( id ));
         return subContext( EndUserContext.class );
      }

      public void selectenduser( Response response ) throws ResourceException
      {
         // for now only user the anonymous end users
         Series<Cookie> cookies = response.getRequest().getCookies();

         EntityReference user = null;
         Cookie cookie = findCookie( cookies );
         if ( cookie == null )
         {
            try
            {
               CommandQueryClient client = context.get( CommandQueryClient.class );
               CookieResponseHandler responseHandler = module.objectBuilderFactory().newObjectBuilder( CookieResponseHandler.class ).use( response ).newInstance();
               client.postCommand( "createenduser", new EmptyRepresentation(), responseHandler );
            } catch (Throwable e)
            {
               e.printStackTrace();
            }
         }
      }

      private Cookie findCookie( Series<Cookie> cookies )
      {
         for (Cookie cookie : cookies)
         {
            if (cookie.getName().equals( COOKIE_NAME ) )
            {
               return cookie;
            }
         }
         return null;
      }


      public LinkValue viewenduser( Response response ) throws ResourceException
      {
         Series<Cookie> cookies = response.getRequest().getCookies();

         Cookie cookie = findCookie( cookies );

         if ( cookie == null )
         {
            throw new ResourceException( Status.CLIENT_ERROR_UNAUTHORIZED );
         }

         ValueBuilder<LinkValue> builder = module.valueBuilderFactory().newValueBuilder( LinkValue.class );
         EntityReference entityReference = EntityReference.parseEntityReference( cookie.getValue() );
         builder.prototype().id().set( entityReference.identity() );
         builder.prototype().href().set( entityReference.identity()+"/" );
         builder.prototype().text().set( "ANONYMOUS" );
         return builder.newInstance();
      }
   }

}