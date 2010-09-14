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

package se.streamsource.surface.web.rest;

import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.data.CharacterSet;
import org.restlet.data.Language;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.representation.StringRepresentation;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;

/**
 * Returns translated keys for a given language. Language is taken from client or "locale" parameter
 */
public class TextsRestlet
   extends Restlet
{
   List<Language> possibleLanguages = Arrays.asList( Language.ENGLISH, Language.valueOf("sv" ));

   @Override
   public void handle( Request request, Response response )
   {
      super.handle( request, response );

      Language preferredLanguage = request.getClientInfo().getPreferredLanguage(possibleLanguages);
      Locale locale = Locale.ENGLISH;
      if (preferredLanguage != null)
         locale = new Locale(preferredLanguage.getPrimaryTag() );

      ResourceBundle bundle = ResourceBundle.getBundle( "surface", locale);

      StringBuilder jsonBuilder = new StringBuilder();
      jsonBuilder.append( "var texts={" );
      String comma = "";
      for (String key : bundle.keySet())
      {
         jsonBuilder.append(comma).append("\"").append( key ).append( "\":\"" ).append( bundle.getString(key )).append("\"");
         comma=",";
      }
      jsonBuilder.append( "}" );

//      response.setEntity( new StringRepresentation(jsonBuilder, MediaType.APPLICATION_JSON, preferredLanguage, CharacterSet.UTF_8));
        response.setEntity( new StringRepresentation(jsonBuilder, MediaType.APPLICATION_JSON, preferredLanguage, CharacterSet.ISO_8859_1));

      response.setStatus( Status.SUCCESS_OK );
      request.release();
   }
}
