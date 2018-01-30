/**
 *
 * Copyright
 * 2009-2015 Jayway Products AB
 * 2016-2018 Föreningen Sambruk
 *
 * Licensed under AGPL, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.gnu.org/licenses/agpl.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package se.streamsource.surface.web.rest;

import org.qi4j.api.configuration.Configuration;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.This;
import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.service.ServiceComposite;
import org.qi4j.api.service.qualifier.Tagged;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Uniform;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Reference;
import org.restlet.data.Status;
import se.streamsource.streamflow.util.Strings;
import se.streamsource.surface.web.config.ExternalCssConfiguration;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

/**
 */
@Mixins(IndexRestletService.Mixin.class)
public interface IndexRestletService extends ServiceComposite, Configuration<ExternalCssConfiguration>
{
   public void handle(Request request, Response response) throws Exception;

   abstract class Mixin implements IndexRestletService
   {

      @Service
      @Tagged("eid")
      Uniform proxyService;

      @Service
      @Tagged("streamflow")
      Uniform streamflowService;

      @This
      Configuration<ExternalCssConfiguration> cssConfig;

      public void handle(Request request, Response response) throws Exception
      {

         String accessPointId = request.getResourceRef().getQueryAsForm().getFirstValue( "ap" );
         String taskId = request.getResourceRef().getQueryAsForm().getFirstValue( "tid" );
         String authifyCallback = request.getResourceRef().getQueryAsForm().getFirstValue( "authify_callback" );

         if (accessPointId != null)
         {
               String template = getTemplate( "webforms.html", getClass() );

               template = template.replace( "$context-root", "/"
                     + request.getResourceRef().getBaseRef().getSegments().get( 0 ) );
               template = template.replace( "$accesspoint", accessPointId );
               template = template.replace( "$hostname", request.getResourceRef().getHostIdentifier() );
               String externalCssReplaceString = externalCssReplaceString( cssConfig.configuration().cssUrl().get() );
               template = template.replace( "$externalcss", externalCssReplaceString );

               String externalMapModuleString = externalMapModuleString( cssConfig.configuration().jsMapModuleUrl().get());
               template = template.replace( "$externalMapModule", externalMapModuleString );
               if (!Strings.empty( externalMapModuleString )) {
                  template = template.replace( "<script type=\"text/javascript\" src=\"/" + request.getResourceRef().getBaseRef().getSegments().get( 0 ) + "/static/js/webforms-map.js\"></script>", "" );
               }
               response.setEntity( template, MediaType.TEXT_HTML );
         } else if (taskId != null)
         {
            String template = getTemplate( "webforms-task.html", getClass() );

            template = template.replace( "$context-root", "/"
                  + request.getResourceRef().getBaseRef().getSegments().get( 0 ) );
            template = template.replace( "$task", taskId );
            template = template.replace( "$hostname", request.getResourceRef().getHostIdentifier() );
            String externalCssReplaceString = externalCssReplaceString( cssConfig.configuration().cssUrl().get() );
            template = template.replace( "$externalcss", externalCssReplaceString );
            
            response.setEntity( template, MediaType.TEXT_HTML );
         } else if (authifyCallback != null)
         {
             String template = getTemplate( "authify-callback.html", getClass() );
             Form form = new Form(request.getEntity());
             String provider = form.getFirstValue( "provider" );
             String encodedText = form.getFirstValue( "encodedText" );
             String signature = form.getFirstValue( "signature" );
             String signerId = form.getFirstValue( "signerId" );
             String signerName = form.getFirstValue( "signerName" );
             template = template.replace( "$hostname", request.getResourceRef().getHostIdentifier() );
             template = template.replace("$provider", provider);
             template = template.replace("$encodedText", encodedText);
             template = template.replace("$signature", signature);
             template = template.replace("$signerId", signerId);
             template = template.replace("$signerName", signerName);
             response.setEntity( template, MediaType.TEXT_HTML );
         } else
         {
            response.setLocationRef( new Reference( request.getResourceRef(), "/"
                  + request.getResourceRef().getBaseRef().getSegments().get( 0 ) + "/surface/accesspoints/index" ) );
            response.setStatus( Status.REDIRECTION_TEMPORARY );
         }
      }

      private String externalMapModuleString(String mapUrl)
      {
         String externalMapModuleString = "";
         if (!Strings.empty( mapUrl ))
         {
            externalMapModuleString = "<script type=\"text/javascript\" src=\""
                  + mapUrl + "\"></script>";
         }
         return externalMapModuleString;
      }

      private String externalCssReplaceString(String cssUrl)
      {
         String externalCssReplaceString = "";
         if (!Strings.empty( cssUrl ))
         {
            externalCssReplaceString = "<link rel=\"stylesheet\" type=\"text/css\" href=\""
                  + cssUrl + "\" />";
         }
         return externalCssReplaceString;
      }

      public static String getTemplate(String resourceName, Class resourceClass) throws IOException
      {
         StringBuilder template = new StringBuilder( "" );
         InputStream in = resourceClass.getResourceAsStream( resourceName );
         BufferedReader reader = new BufferedReader( new InputStreamReader( in ) );
         String line;
         while ((line = reader.readLine()) != null)
            template.append( line + "\n" );
         reader.close();

         return template.toString();
      }
   }
}
