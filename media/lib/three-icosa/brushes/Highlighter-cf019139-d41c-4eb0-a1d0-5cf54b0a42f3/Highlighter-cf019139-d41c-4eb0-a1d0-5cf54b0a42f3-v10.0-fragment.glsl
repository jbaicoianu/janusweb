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

// Brush-specific shader for GlTF web preview, based on General generator
// with parameters lit=0, a=0.01.

precision mediump float;

out vec4 fragColor;

in vec4 v_color;
in vec3 v_position;
in vec2 v_texcoord0;

uniform sampler2D u_MainTex;
uniform float u_Cutoff;

void main() {
  float brush_mask = texture(u_MainTex, v_texcoord0).w;
  brush_mask *= v_color.a;
  if (brush_mask > u_Cutoff) {
    fragColor.rgb = v_color.rgb;
    fragColor.a = 1.0;
  } else {
    discard;
  }
}
