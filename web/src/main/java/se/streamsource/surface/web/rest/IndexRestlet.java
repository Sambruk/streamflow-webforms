package se.streamsource.surface.web.rest;

import org.restlet.Request;
import org.restlet.Response;
import org.restlet.Restlet;
import org.restlet.data.MediaType;
import org.restlet.representation.StringRepresentation;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

/**
 */
public class IndexRestlet
      extends Restlet

{
   @Override
   public void handle( Request request, Response response )
   {
      super.handle( request, response );

      try
      {
         String template = getTemplate( "index.html", getClass() );

         template = template.replace( "$accesspoint", request.getResourceRef().getQueryAsForm().getFirstValue( "ap" ) );
         template = template.replace( "$hostname", request.getResourceRef().getHostIdentifier() );

         response.setEntity( template, MediaType.TEXT_HTML );
      } catch (IOException e)
      {
         e.printStackTrace();
      }

   }

   public static String getTemplate( String resourceName, Class resourceClass ) throws IOException
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
