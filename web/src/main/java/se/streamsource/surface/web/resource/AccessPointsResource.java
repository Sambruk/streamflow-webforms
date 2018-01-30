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
package se.streamsource.surface.web.resource;

import org.restlet.resource.ResourceException;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.dci.restlet.server.CommandQueryResource;
import se.streamsource.dci.restlet.server.api.SubResources;
import se.streamsource.surface.web.context.AccessPointsContext;

import static se.streamsource.dci.api.RoleMap.current;

/**
 * JAVADOC
 */
public class AccessPointsResource
    extends CommandQueryResource
    implements SubResources
{
   public AccessPointsResource( )
   {
      super( AccessPointsContext.class );
   }

   public void resource( String segment )
        throws ResourceException
    {
        current().set( current().get( CommandQueryClient.class ).getSubClient( segment ));

        subResource( AccessPointResource.class );
    }
}
