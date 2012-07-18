/**
 *
 * Copyright 2009-2012 Jayway Products AB
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
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

import org.qi4j.api.mixin.Mixins;
import org.qi4j.api.service.Activatable;
import org.qi4j.api.service.ServiceComposite;

import se.streamsource.surface.web.dto.UserInfoDTO;
import sun.misc.BASE64Encoder;

@Mixins(HashService.Mixin.class)
public interface HashService extends ServiceComposite, Activatable
{

   public String hash(UserInfoDTO userInfo);

   abstract class Mixin implements HashService
   {
      private String salt;

      public void activate() throws Exception
      {
         salt = UUID.randomUUID().toString();
         
      }
      
      public void passivate() throws Exception
      {
      }
      
      public String hash(UserInfoDTO userInfo)
      {

         try
         {
            MessageDigest md = MessageDigest.getInstance( "SHA" );
            String value = salt + userInfo.name().get() + userInfo.contactId().get() + userInfo.createdOn().get();
            md.update( value.getBytes( "UTF-8" ) );
            byte raw[] = md.digest();
            String hash = (new BASE64Encoder()).encode( raw );
            return hash;
         } catch (NoSuchAlgorithmException e)
         {
            throw new IllegalStateException( "No SHA algorithm found", e );
         } catch (UnsupportedEncodingException e)
         {
            throw new IllegalStateException( e.getMessage(), e );
         }
      }
   }
}
