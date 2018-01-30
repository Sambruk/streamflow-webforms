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
package se.streamsource.surface.web.assembler;

import org.qi4j.bootstrap.Assembler;
import org.qi4j.bootstrap.AssemblyException;
import org.qi4j.bootstrap.ModuleAssembly;

import se.streamsource.dci.restlet.server.ResourceFinder;
import se.streamsource.streamflow.api.workspace.cases.attachment.UpdateAttachmentDTO;
import se.streamsource.surface.web.application.security.AuthenticationFilter;
import se.streamsource.surface.web.application.security.HashService;
import se.streamsource.surface.web.dto.UserInfoDTO;
import se.streamsource.surface.web.rest.SurfaceRestApplication;

/**
 */
public class SurfaceRestAssembler
      implements Assembler
{
   public void assemble(ModuleAssembly module) throws AssemblyException
   {
      module.services(HashService.class);
      module.objects(SurfaceRestApplication.class,
            ResourceFinder.class, AuthenticationFilter.class);

      module.values(UserInfoDTO.class, UpdateAttachmentDTO.class);
   }
}