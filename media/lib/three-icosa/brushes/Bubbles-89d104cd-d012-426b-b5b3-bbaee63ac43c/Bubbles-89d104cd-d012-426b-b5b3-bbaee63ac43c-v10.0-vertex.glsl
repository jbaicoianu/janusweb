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

in vec4 a_position;
in vec3 a_normal;
in vec4 a_color;
in vec4 a_texcoord0;
in vec4 a_texcoord1;

out vec4 v_color;
out vec3 v_normal;  // Camera-space normal.
out vec3 v_position;  // Camera-space position.
out vec2 v_texcoord0;
out vec3 v_light_dir_0;  // Camera-space light direction, main light.
out vec3 v_light_dir_1;  // Camera-space light direction, other light.

uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform mat4 u_SceneLight_0_matrix;
uniform mat4 u_SceneLight_1_matrix;

// Copyright 2020 The Tilt Brush Authors
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

const float kRecipSquareRootOfTwo = 0.70710678;

// Given a centerpoint, up and right vectors, the particle rotation and vertex index,
// This will create the appropriate position of a quad that faces the camera.
vec3 recreateCorner(vec3 center, float corner, float rotation, float size) {
  float c = cos(rotation);
  float s = sin(rotation);

  // Basis in camera space, which is well known.
  vec3 up = vec3(s, c, 0);
  vec3 right = vec3(c, -s, 0);

  // Corner diagram:
  //
  //   2 . . . 3
  //   .   |   .
  //   . - c - < --- center
  //   .   |   .
  //   0 . . . 1
  //
  // The top corners are corners 2 & 3
  float fUp = float(corner == 0. || corner == 1.) * 2.0 - 1.0;

  // The corners to the right are corners 1 & 3
  float fRight = float(corner == 0. || corner == 2.) * 2.0 - 1.0;

  center = (modelViewMatrix * vec4(center, 1.0)).xyz;
  center += fRight * right * size;
  center += fUp * up * size;
  return (inverse(modelViewMatrix) * vec4(center, 1.0)).xyz;
}

// Adjusts the vertex of a quad to make a camera-facing quad. Also optionally scales the particle if
// the particle is in the preview brush.
vec4 PositionParticle(
	float vertexId,
	vec4 vertexPos,
	vec3 center,
	float rotation) {

	float corner = mod(vertexId, 4.0);
	float size = length(vertexPos.xyz - center) * kRecipSquareRootOfTwo;

	// Gets the scale from the model matrix
	float scale = modelMatrix[1][1];
	vec3 newCorner = recreateCorner(center, corner, rotation, size * scale);

	return vec4(newCorner.x, newCorner.y, newCorner.z, 1);
}

// Returns the particle position for this vertex, untransformed, in local/object space.
vec4 GetParticlePositionLS() {
	return PositionParticle(float(gl_VertexID), a_position, a_normal, a_texcoord0.z);
}
// ---------------------------------------------------------------------------------------------- //
// ---------------------------------------------------------------------------------------------- //

void main() {
  vec4 pos = GetParticlePositionLS();

  gl_Position = projectionMatrix * modelViewMatrix * pos;
  v_normal = normalMatrix * a_normal;
  v_position = (modelViewMatrix * pos).xyz;
  v_light_dir_0 = mat3(u_SceneLight_0_matrix) * vec3(0, 0, 1);
  v_light_dir_1 = mat3(u_SceneLight_1_matrix) * vec3(0, 0, 1);
  v_color = a_color;
  v_texcoord0 = a_texcoord0.xy;
}
