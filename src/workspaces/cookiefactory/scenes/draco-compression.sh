# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

mv CookieFactoryEnvironment.glb CookieFactoryEnvironmentOriginal.glb
mv CookieFactoryLine.glb CookieFactoryLineOriginal.glb
mv CookieFactoryMixer.glb CookieFactoryMixerOriginal.glb

gltf-pipeline -i CookieFactoryEnvironmentOriginal.glb -o CookieFactoryEnvironment.glb -d
gltf-pipeline -i CookieFactoryLineOriginal.glb -o CookieFactoryLine.glb -d
gltf-pipeline -i CookieFactoryMixerOriginal.glb -o CookieFactoryMixer.glb -d
