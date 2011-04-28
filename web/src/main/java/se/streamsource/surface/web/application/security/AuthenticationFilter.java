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

package se.streamsource.surface.web.application.security;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.injection.scope.Uses;
import org.qi4j.api.value.ValueBuilderFactory;
import org.restlet.Context;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.data.Cookie;
import org.restlet.data.Status;
import org.restlet.routing.Filter;
import org.restlet.util.Series;

import se.streamsource.streamflow.util.Strings;
import se.streamsource.surface.web.dto.UserInfoDTO;

public class AuthenticationFilter extends Filter
{

   @Service
   HashService hashService;
   
   @Structure
   ValueBuilderFactory vbf;
   
   public AuthenticationFilter(@Uses Context context, @Uses Restlet next)
   {
      super(context, next);
   }
   
   @Override
   protected int beforeHandle(Request request, Response response)
   {
      Series<Cookie> cookies = request.getCookies();
      String cookieValue = null;
      if ( cookies != null && cookies.size() > 0)
         cookieValue = cookies.get( 0 ).getValue();

      if (Strings.empty( cookieValue ))
      {
         try
         {
            String decodedString = URLDecoder.decode( cookieValue, "UTF-8" );
            UserInfoDTO userInfo = vbf.newValueFromJSON( UserInfoDTO.class, decodedString );
            String newHash = hashService.hash( userInfo );
            // Verify the hashvalue and that the session isn't older than one hour (eId...)
            if (newHash.equals( userInfo.hash().get() ) &&
                  (System.currentTimeMillis() - userInfo.createdOn().get().getTime()) < (60 * 60 * 1000) )
            {
               return Filter.CONTINUE;
            }
         } catch (UnsupportedEncodingException e)
         {
            e.printStackTrace();
         }
         
      }

      response.setStatus(Status.CLIENT_ERROR_UNAUTHORIZED);
      return Filter.STOP;
   }
}
