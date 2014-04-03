/**
 *
 * Copyright 2009-2014 Jayway Products AB
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

import org.qi4j.api.common.Optional;
import org.qi4j.api.common.UseDefaults;
import org.qi4j.api.configuration.ConfigurationComposite;
import org.qi4j.api.configuration.Enabled;
import org.qi4j.api.property.Property;

/**
 * Configuration of a Apache HttpClient
 */
public interface ClientConfiguration
   extends ConfigurationComposite, Enabled
{
   Property<Integer> connectTimeout();
   Property<Integer> idleCheckInterval();
   Property<Integer> idleTimeout();
   Property<Integer> maxConnectionsPerHost();
   Property<Integer> maxTotalConnections();
   Property<Integer> socketTimeout();
   Property<Integer> stopIdleTimeout();

   @UseDefaults
   Property<Boolean> tcpNoDelay();

   @UseDefaults
   Property<Boolean> followRedirects();

   @Optional
   Property<String> proxyHost();

   @Optional
   Property<Integer> proxyPort();

}
