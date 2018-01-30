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
package se.streamsource.surface.web.context;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.FileUploadException;
import org.json.JSONArray;
import org.qi4j.api.entity.EntityReference;
import org.qi4j.api.injection.scope.Service;
import org.qi4j.api.injection.scope.Structure;
import org.qi4j.api.service.qualifier.Tagged;
import org.qi4j.api.structure.Module;
import org.qi4j.api.value.ValueBuilder;
import org.restlet.Request;
import org.restlet.Response;
import org.restlet.data.Disposition;
import org.restlet.data.Form;
import org.restlet.data.MediaType;
import org.restlet.data.Status;
import org.restlet.ext.fileupload.RestletFileUpload;
import org.restlet.representation.InputRepresentation;
import org.restlet.representation.Representation;
import org.restlet.resource.ResourceException;
import se.streamsource.dci.api.RoleMap;
import se.streamsource.dci.restlet.client.CommandQueryClient;
import se.streamsource.streamflow.api.workspace.cases.attachment.UpdateAttachmentDTO;
import se.streamsource.streamflow.surface.api.AttachmentFieldDTO;
import se.streamsource.streamflow.surface.api.FormSignatureDTO;
import se.streamsource.surface.web.dto.SaveSignatureDTO;
import se.streamsource.surface.web.proxy.ProxyService;
import se.streamsource.surface.web.rest.AttachmentResponseHandler;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 */
public class FormDraftContext {
    /*@Service
       @IdentifiedBy("client")
       ServiceReference<Uniform> proxyService;
    */

    @Service
    @Tagged("eid")
    ProxyService proxyService;


    @Structure
    Module module;

    @Service
    FileItemFactory factory;

    private static final Set<MediaType> acceptedTypes = new HashSet<MediaType>();

    static {
        acceptedTypes.add(MediaType.APPLICATION_PDF);
        acceptedTypes.add(MediaType.IMAGE_PNG);
        acceptedTypes.add(MediaType.IMAGE_JPEG);
    }

    public JSONArray createattachment(Response response) throws Exception {
        Request request = response.getRequest();
        Representation representation = request.getEntity();

        if (MediaType.MULTIPART_FORM_DATA.equals(representation.getMediaType(), true)) {
            RestletFileUpload upload = new RestletFileUpload(factory);
            upload.setHeaderEncoding("UTF-8");
            try {
                List<FileItem> items = upload.parseRequest(request);
                int numberOfFiles = 0;
                FileItem fi = null;
                for (FileItem fileItem : items) {
                    if (!fileItem.isFormField()) {
                        numberOfFiles++;
                        fi = fileItem;
                    }
                }
                if (numberOfFiles != 1) {
                    throw new ResourceException(Status.CLIENT_ERROR_METHOD_NOT_ALLOWED, "Could not handle multiple files");
                }

                if (!acceptedTypes.contains(MediaType.valueOf(fi.getContentType()))) {
                    throw new ResourceException(Status.CLIENT_ERROR_UNSUPPORTED_MEDIA_TYPE, "Could not upload file");
                }

                Representation input = new InputRepresentation(new BufferedInputStream(fi.getInputStream()));
                Form disposition = new Form();
                disposition.set(Disposition.NAME_FILENAME, fi.getName());
                disposition.set(Disposition.NAME_SIZE, Long.toString(fi.getSize()));

                input.setDisposition(new Disposition(Disposition.TYPE_NONE, disposition));


                CommandQueryClient client = RoleMap.current().get(CommandQueryClient.class);
                AttachmentResponseHandler responseHandler = module.objectBuilderFactory()
                        .newObjectBuilder(AttachmentResponseHandler.class)
                        .newInstance();
                client.getClient("attachments/").postCommand("createformattachment", input, responseHandler);

                ValueBuilder<UpdateAttachmentDTO> attachmentUpdateBuilder = module.valueBuilderFactory().newValueBuilder(UpdateAttachmentDTO.class);
                attachmentUpdateBuilder.prototype().name().set(fi.getName());
                attachmentUpdateBuilder.prototype().size().set(fi.getSize());
                attachmentUpdateBuilder.prototype().mimeType().set(fi.getContentType());

                ValueBuilder<AttachmentFieldDTO> attachmentFieldUpdateBuilder = responseHandler.getAttachmentValue();

                // update attachment entity first with filename, size and mime type
                client.getClient("attachments/" + attachmentFieldUpdateBuilder.prototype().attachment().get().identity() + "/").postCommand("update", attachmentUpdateBuilder.newInstance());

                attachmentFieldUpdateBuilder.prototype().field().set(EntityReference.parseEntityReference(fi.getFieldName()));
                attachmentFieldUpdateBuilder.prototype().name().set(fi.getName());

                // update form submission attachment field with name and attachment field entity reference.
                client.postCommand("updateattachmentfield", attachmentFieldUpdateBuilder.newInstance());

                StringBuffer result = new StringBuffer("[").append(attachmentUpdateBuilder.newInstance().toJSON()).append("]");
                return new JSONArray(result.toString());

            } catch (FileUploadException e) {
                throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, "Could not upload file", e);
            } catch (IOException e) {
                throw new ResourceException(Status.CLIENT_ERROR_BAD_REQUEST, "Could not upload file", e);
            }
        }
        return null;
    }

    public void savesignature(SaveSignatureDTO saveSignature) {

        CommandQueryClient client = RoleMap.current().get(CommandQueryClient.class);

        ValueBuilder<FormSignatureDTO> valueBuilder = module.valueBuilderFactory().newValueBuilder(FormSignatureDTO.class);

        valueBuilder.prototype().encodedForm().set(saveSignature.encodedTbs().get());
        valueBuilder.prototype().form().set(saveSignature.form().get());
        valueBuilder.prototype().name().set(saveSignature.name().get());
        valueBuilder.prototype().provider().set(saveSignature.provider().get());

        valueBuilder.prototype().signature().set(saveSignature.signature().get());
        valueBuilder.prototype().signerId().set(saveSignature.signerId().get());
        valueBuilder.prototype().signerName().set(saveSignature.signerName().get());

        client.postCommand("addsignature", valueBuilder.newInstance());
    }
}