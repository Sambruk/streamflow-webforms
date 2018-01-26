Build
=====

Maven deployment settings
-------------------------
    In order to be able to deploy to Cloudbees Repo you need a **settings.xml** in your .m2 folder need to look like this:

    .. code-block:: xml

        <?xml version="1.0" encoding="UTF-8"?>

        <!--
        Licensed to the Apache Software Foundation (ASF) under one
        or more contributor license agreements.  See the NOTICE file
        distributed with this work for additional information
        regarding copyright ownership.  The ASF licenses this file
        to you under the Apache License, Version 2.0 (the
        "License"); you may not use this file except in compliance
        with the License.  You may obtain a copy of the License at

            http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing,
        software distributed under the License is distributed on an
        "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
        KIND, either express or implied.  See the License for the
        specific language governing permissions and limitations
        under the License.
        -->

        <settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 http://maven.apache.org/xsd/settings-1.0.0.xsd">
          <servers>
            <!-- <server>
              <id>cloudbees-private-snapshot-repository</id>
              <username>#your cloudbeesuser name#</username>
              <password>#your encrypted password#</password>
              <filePermissions>664</filePermissions>
              <directoryPermissions>775</directoryPermissions>
            </server>
            <server>
              <id>snapshots</id>
              <username>#your cloudbeesuser name#</username>
              <password>#your encrypted password#</password>
              <filePermissions>664</filePermissions>
              <directoryPermissions>775</directoryPermissions>
            </server> -->
            <server>
              <id>cloudbees-private-release-repository</id>
              <username>#your cloudbeesuser name#</username>
              <password>#your encrypted password#</password>
              <filePermissions>664</filePermissions>
              <directoryPermissions>775</directoryPermissions>
            </server>
            <server>
              <id>releases</id>
              <username>#your cloudbeesuser name#</username>
              <password>#your encrypted password#</password>
              <filePermissions>664</filePermissions>
              <directoryPermissions>775</directoryPermissions>
            </server>
            <!-- <server>
              <id>cloudbees-private-snapshot-plugin-repository</id>
              <username>#your cloudbeesuser name#</username>
              <password>#your encrypted password#</password>
              <filePermissions>664</filePermissions>
              <directoryPermissions>775</directoryPermissions>
            </server> -->
            <server>
              <id>cloudbees-private-release-plugin-repository</id>
              <username>#your cloudbeesuser name#</username>
              <password>#your encrypted password#</password>
              <filePermissions>664</filePermissions>
              <directoryPermissions>775</directoryPermissions>
            </server>
          </servers>
          <profiles>
            <profile>
              <id>cloudbees.private.release.repository</id>
              <activation>
                <property>
                  <name>!cloudbees.private.release.repository.off</name>
                </property>
              </activation>
              <repositories>
                <repository>
                  <id>cloudbees-private-release-repository</id>
                  <url>dav:https://repository-streamflow.forge.cloudbees.com/release</url>
                  <releases>
                    <enabled>true</enabled>
                  </releases>
                  <snapshots>
                    <enabled>false</enabled>
                  </snapshots>
                </repository>
              </repositories>
            </profile>
           <!-- <profile>
              <id>cloudbees.private.snapshot.repository</id>
              <activation>
                <property>
                  <name>!cloudbees.private.snapshot.repository.off</name>
                </property>
              </activation>
              <repositories>
                <repository>
                  <id>cloudbees-private-snapshot-repository</id>
                  <url>dav:https://repository-streamflow.forge.cloudbees.com/snapshot</url>
                  <releases>
                    <enabled>false</enabled>
                  </releases>
                  <snapshots>
                    <enabled>true</enabled>
                  </snapshots>
                </repository>
              </repositories>
            </profile> -->
            <profile>
              <id>cloudbees.private.release.plugin.repository</id>
              <activation>
                <property>
                  <name>!cloudbees.private.release.plugin.repository.off</name>
                </property>
              </activation>
              <pluginRepositories>
                <pluginRepository>
                  <id>cloudbees-private-release-plugin-repository</id>
                  <url>dav:https://repository-streamflow.forge.cloudbees.com/release</url>
                  <releases>
                    <enabled>true</enabled>
                  </releases>
                  <snapshots>
                    <enabled>false</enabled>
                  </snapshots>
                </pluginRepository>
              </pluginRepositories>
            </profile>
            <!-- <profile>
              <id>cloudbees.private.snapshot.plugin.repository</id>
              <activation>
                <property>
                  <name>!cloudbees.private.snapshot.plugin.repository.off</name>
                </property>
              </activation>
              <pluginRepositories>
                <pluginRepository>
                  <id>cloudbees-private-snapshot-plugin-repository</id>
                  <url>dav:https://repository-streamflow.forge.cloudbees.com/snapshot</url>
                  <releases>
                    <enabled>false</enabled>
                  </releases>
                  <snapshots>
                    <enabled>true</enabled>
                  </snapshots>
                </pluginRepository>
              </pluginRepositories>
            </profile> -->
            <profile>
                <id>externrepos</id>
                <repositories>
                    <repository>
                        <id>localrelease</id>
                        <name>Local Release</name>
                        <url>http://repository-streamflow.forge.cloudbees.com/release/</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                    </repository>
                    <!--  <repository>
                        <id>localsnapshot</id>
                        <name>Local Snapshot</name>
                        <url>http://repository-streamflow.forge.cloudbees.com/snapshot/</url>
                    </repository> -->
                  <repository>
                      <id>waybuild</id>
                      <name>Old Waybuild</name>
                      <url>http://79.125.6.136/nexus</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                  </repository>
                    <repository>
                        <id>Aduna</id>
                        <name>Aduna Release</name>
                        <!-- <url>http://repo.aduna-software.org/maven2/releases</url> -->
                        <url>http://maven.ontotext.com/content/repositories/aduna</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                    </repository>
                    <repository>
                        <id>restlet</id>
                        <name>Restlet Release</name>
                        <url>http://maven.restlet.org</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                    </repository>
                    <repository>
                        <id>javadev</id>
                        <name>Javadev Release</name>
                        <url>http://download.java.net/maven/2</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                    </repository>
                    <repository>
                        <id>shibboleth</id>
                        <name>Shibboleth Release</name>
                        <url>https://build.shibboleth.net/nexus/content/repositories/releases/</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                    </repository>
                    <repository>
                        <id>cuke</id>
                        <name>Cuke Release</name>
                        <url>http://cukes.info/maven</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                    </repository>
                    <repository>
                            <id>qi4j-releases</id>
                            <url>https://repository-qi4j.forge.cloudbees.com/release/</url>
                            <releases>
                              <enabled>true</enabled>
                            </releases>
                            <snapshots>
                              <enabled>false</enabled>
                            </snapshots>
                        </repository>
                        <repository>
                            <id>qi4j-snapshots</id>
                            <url>https://repository-qi4j.forge.cloudbees.com/snapshot/</url>
                            <releases><enabled>false</enabled></releases>
                            <snapshots><enabled>true</enabled></snapshots>
                        </repository>
                    <repository>
                        <id>ops4j</id>
                        <name>Ops4j Release</name>
                        <url>http://repository.ops4j.org/maven2</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                    </repository>
                    <repository>
                        <id>jenkins-releases</id>
                        <url>http://repo.jenkins-ci.org/releases/</url>
                        <releases>
                          <enabled>true</enabled>
                        </releases>
                        <snapshots>
                          <enabled>false</enabled>
                        </snapshots>
                      </repository>
                </repositories>
            </profile>
            <profile>
                <id>sign</id>
                <activation>
                    <property>
                        <name>sign</name>
                    </property>
                </activation>
                <properties>
                    <keystore.path>#path to jayway product ab keystore (not needed for webforms release#)</keystore.path>
                    <keystore.keypass>#pass phrase for keystore (not needed for webforms release#)</keystore.keypass>
                </properties>
              </profile>
          </profiles>
          <activeProfiles>
              <activeProfile>externrepos</activeProfile>
          </activeProfiles>
        </settings>


    See http://maven.apache.org/guides/mini/guide-encryption.html for password encryption.

Repo preparations
-----------------

    .. note::
        This is how you release from the develop branch. In case you are making a patch release, you will be using the master instead.

    #. First make sure you are in the **develop** branch.
    #. Make sure that there are no SNAPSHOT dependencies anywhere. Maven will not allow a release to be made if there are any dependencies with no fixed version.
    #. Make sure you have the latest version of the branch:
        .. code-block:: terminal
            git pull origin develop

    #. Check that there are no pending changes in your develop branch:
        .. code-block:: terminal

            git status

Release
-------
    #. Create a new git branch for the release preparations:
        .. code-block:: terminal

            git checkout -b release-<version> develop

    #. If we have reached a new year since the last release, make sure to update the **inceptionYear** in the root pom and then generate new license headers:
        .. code-block:: terminal

            mvn clean install

    #. If we have reached a new year since the last release, update year in license headers in html files manually
    #. Commit changed files (if any)
    #. In order to check that everything is OK for a release, a dry run should be performed:
        .. code-block:: terminal

            mvn -DautoVersionSubmodules=true -DdryRun=true release:prepare

    #. Clean up any artifacts from the dry run:
        .. code-block:: terminal

            mvn release:clean

    #. Prepare the release:
        .. code-block:: terminal

            mvn -DautoVersionSubmodules=true release:prepare

    #. Perform the release (also deploys artifacts to Cloudbees Repo)
        .. code-block:: terminal

            mvn release:perform


Build and upload release zip to Cloudbees Repo
----------------------------------------------
    #. Build zip:
        .. code-block:: terminal

            cd target/checkout
            mvn assembly:assembly

    #. Upload zip file (**target/checkout/target/surface-<version>-bin.zip**) to Cloudbees Repo (https://repository-streamflow.forge.cloudbees.com/release/releases/surface/), e.g. by connecting to server in Finder if on Mac.


Update branches
---------------

    After the successful release build we have to push the last changes to the release branch and merge the results into both **master** and **develop** branch.

    .. code-block:: terminal

        git push origin release-<version>

        git checkout master

        git pull origin master

        git merge --no-ff release-<version>

        git push origin master

        git checkout develop

        git pull origin develop

        git merge --no-ff release-<version>

        git push origin develop
