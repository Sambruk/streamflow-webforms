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

package se.streamsource.surface.web.context;

import org.qi4j.api.entity.Identity;
import org.qi4j.api.entity.IdentityGenerator;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.service.ServiceReference;
import org.qi4j.api.specification.Specification;
import org.qi4j.api.structure.Module;
import org.qi4j.api.util.Iterables;
import org.qi4j.api.value.ValueBuilder;
import org.restlet.Response;
import org.restlet.data.Cookie;
import org.restlet.data.CookieSetting;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;
import org.restlet.resource.ResourceException;
import org.restlet.util.Series;
import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.value.EntityValue;
import se.streamsource.dci.value.link.LinkValue;
import se.streamsource.surface.web.proxy.ProxyService;

/**
 */
public class EndUsersContext
{
   public static final String COOKIE_NAME = "ANONYMOUS_USER";

   @Service
   IdentityGenerator idGen;
   
   @Structure
   Module module;

   public void selectenduser( Response response )
         throws ResourceException
   {
      // for now only user the anonymous end users
      Series<Cookie> cookies = response.getRequest().getCookies();

      Cookie cookie = findCookie( cookies );
      if (cookie == null)
      {
         try
         {
            CommandQueryClient client = RoleMap.current().get( CommandQueryClient.class );
            ValueBuilder<se.streamsource.dci.value.StringValue> builder = module.valueBuilderFactory().newValueBuilder( se.streamsource.dci.value.StringValue.class );
            builder.prototype().string().set( idGen.generate( Identity.class ) );
//            client.postCommand( "createenduser", new EmptyRepresentation(), responseHandler );
//            client.postCommand( "create", new StringRepresentation(builder.newInstance().toString(), MediaType.APPLICATION_JSON), responseHandler);
            se.streamsource.dci.value.StringValue userId = builder.newInstance();
            client.postCommand( "create", new StringRepresentation(userId.toString(), MediaType.APPLICATION_JSON));
            
            Iterable<ServiceReference<ProxyService>> services = module.serviceFinder().findServices( ProxyService.class );
            
            ServiceReference<ProxyService> proxy = Iterables.first( Iterables.filter( new Specification<ServiceReference>() {

               public boolean satisfiedBy( ServiceReference item )
               {
                  return "streamflowproxy".equals( item.identity() );
               }
            }, services) );

//            CookieSetting cookieSetting = new CookieSetting( EndUsersContext.COOKIE_NAME, proxy.get().configuration().username().get() + "/" + userId.string().get() );
            CookieSetting cookieSetting = new CookieSetting( EndUsersContext.COOKIE_NAME, userId.string().get() );
            // two weeks
            cookieSetting.setMaxAge( 60 * 60 * 24 * 14 );
            
            response.getCookieSettings().add( cookieSetting );
         }
         catch (Throwable e)
         {
            e.printStackTrace();
         }
      }
   }

   private Cookie findCookie( Series<Cookie> cookies )
   {
      for (Cookie cookie : cookies)
      {
         if (cookie.getName().equals( COOKIE_NAME ))
         {
            return cookie;
         }
      }
      return null;
   }

   //This one will re-direct

   public LinkValue viewenduser( Response response )
         throws ResourceException
   {
      EntityValue dto = userreference( response );

      ValueBuilder<LinkValue> builder = module.valueBuilderFactory().newValueBuilder( LinkValue.class );
      builder.prototype().id().set( dto.entity().get() );
      builder.prototype().href().set( dto.entity().get() + "/" );
      builder.prototype().text().set( "ANONYMOUS" );
      return builder.newInstance();
   }

   public EntityValue userreference( Response response )
         throws ResourceException
   {
      Series<Cookie> cookies = response.getRequest().getCookies();
      response.release();

      Cookie cookie = findCookie( cookies );

      if (cookie == null)
      {
         throw new ResourceException( Status.CLIENT_ERROR_UNAUTHORIZED );
      }

      ValueBuilder<EntityValue> builder = module.valueBuilderFactory()
            .newValueBuilder(EntityValue.class);
      builder.prototype().entity().set( cookie.getValue() );
      return builder.newInstance();
   }
}