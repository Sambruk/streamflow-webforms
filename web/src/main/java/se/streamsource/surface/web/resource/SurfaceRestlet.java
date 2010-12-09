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
import org.qi4j.api.object.ObjectBuilderFactory;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Uniform;
import org.restlet.data.Language;
import org.restlet.data.Preference;
import org.restlet.data.Reference;
import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.restlet.client.CommandQueryClientFactory;
import se.streamsource.dci.restlet.client.NullResponseHandler;
import se.streamsource.dci.restlet.server.CommandQueryRestlet2;
import se.streamsource.surface.web.proxy.ProxyService;

import java.util.List;
import java.util.Locale;

/**
 * JAVADOC
 */
public class SurfaceRestlet
      extends CommandQueryRestlet2
{
   @Structure
   ObjectBuilderFactory obf;

   @Service ProxyService proxyService;

   @Override
   protected Uniform createRoot( Request request, Response response )
   {
      CommandQueryClient cqc = obf.newObjectBuilder( CommandQueryClientFactory.class )
            .use( proxyService, new NullResponseHandler()).newInstance().newClient( new Reference(new Reference(proxyService.configuration().url().get()), new Reference("")) );

      // Go to the main entrypoint for Surface
      cqc = cqc.getClient( "accesspoints/" );

      RoleMap.current().set( cqc );
      initRoleMap( request, RoleMap.current() );

      return module.objectBuilderFactory().newObjectBuilder( RootResource.class ).newInstance();
   }

   private void initRoleMap( Request request, RoleMap roleMap )
   {
      roleMap.set( resolveRequestLocale( request ), Locale.class );

   }

   protected Locale resolveRequestLocale( Request request )
   {
      List<Preference<Language>> preferenceList = request.getClientInfo().getAcceptedLanguages();

      if (preferenceList.isEmpty())
         return Locale.getDefault();

      Language language = preferenceList
            .get( 0 ).getMetadata();
      String[] localeStr = language.getName().split( "_" );

      Locale locale;
      switch (localeStr.length)
      {
         case 1:
            locale = new Locale( localeStr[0] );
            break;
         case 2:
            locale = new Locale( localeStr[0], localeStr[1] );
            break;
         case 3:
            locale = new Locale( localeStr[0], localeStr[1], localeStr[2] );
            break;
         default:
            locale = Locale.getDefault();
      }
      return locale;
   }
}
