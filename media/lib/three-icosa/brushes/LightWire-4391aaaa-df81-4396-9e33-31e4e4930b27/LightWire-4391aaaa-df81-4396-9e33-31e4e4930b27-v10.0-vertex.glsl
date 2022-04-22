#version 300 es
// Copyright 2020 The Tilt Brush Authors
// Updated to OpenGL ES 3.0 by the Icosa Gallery Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

precision mediump float;

out vec4 fragColor;
// Default shader for GlTF web preview.
//
// This shader is used as a fall-back when a brush-specific shader is
// unavailable.

in vec4 a_position;
in vec3 a_normal;
in vec4 a_color;
in vec3 a_texcoord0;

out vec4 v_color;
out vec3 v_normal;  // Camera-space normal.
out vec3 v_position;
out vec2 v_texcoord0;
out vec3 v_light_dir_0;  // Camera-space light direction, main light.
out vec3 v_light_dir_1;  // Camera-space light direction, other light.
out float f_fog_coord;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform mat4 u_SceneLight_0_matrix;
uniform mat4 u_SceneLight_1_matrix;

void main() {

  float t;
  float envelope = sin ( mod ( a_texcoord0.x * 2., 1.) * 3.14159); 
  float lights = envelope < .15 ? 1. : 0.;
  float radius = a_texcoord0.z * 0.9;
  vec4 newPosition = a_position;
  newPosition.xyz += a_normal * lights * radius;

  gl_Position = projectionMatrix * modelViewMatrix * newPosition;
  f_fog_coord = gl_Position.z;
  v_position = a_position.xyz;
  v_normal = normalMatrix * a_normal;
  v_light_dir_0 = mat3(u_SceneLight_0_matrix) * vec3(0, 0, 1);
  v_light_dir_1 = mat3(u_SceneLight_1_matrix) * vec3(0, 0, 1);
  v_color = a_color;
  v_texcoord0 = a_texcoord0.xy;
}

