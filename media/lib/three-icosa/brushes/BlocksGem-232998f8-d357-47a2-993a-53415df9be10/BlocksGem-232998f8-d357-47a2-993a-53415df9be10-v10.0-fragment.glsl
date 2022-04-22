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

uniform vec4 u_ambient_light_color;
uniform vec4 u_SceneLight_0_color;
uniform vec4 u_SceneLight_1_color;
uniform float u_Shininess;
uniform float u_RimIntensity;
uniform float u_RimPower;
uniform vec4 u_Color;
uniform float u_Frequency;
uniform float u_Jitter;

in vec4 v_color;
in vec3 v_normal;
in vec3 v_position;
in vec3 v_local_position;
in vec3 v_light_dir_0;
in vec3 v_light_dir_1;
in vec2 v_texcoord0;

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

//
// Standard BRDF Lighting
//

const float PI = 3.141592654;
const float INV_PI = 0.318309886;
const vec3 GAMMA_DIELECTRIC_SPEC = vec3(0.220916301, 0.220916301, 0.220916301);
const float GAMMA_ONE_MINUS_DIELECTRIC = (1.0 - 0.220916301);

// The following functions are based on similar ones in the Unity Standard BRDF
// with minor changes for GLSL and unused #ifdef pruning.

float Pow5(float x) {
  return x * x * x * x * x;
}

// https://disney-animation.s3.amazonaws.com/library/s2012_pbs_disney_brdf_notes_v2.pdf
float DisneyDiffuseTerm(float NdotV, float NdotL, float LdotH,
                        float perceptualRoughness) {
  float fd90 = 0.5 + 2.0 * LdotH * LdotH * perceptualRoughness;
  float lightScatter = 1.0 + (fd90 - 1.0) * Pow5(1.0 - NdotL);
  float viewScatter  = 1.0 + (fd90 - 1.0) * Pow5(1.0 - NdotV);
  return lightScatter * viewScatter;
}

float SmithJointVisibilityTerm(float NdotL, float NdotV, float roughness) {
  float lambdaV = NdotL * mix(NdotV, 1.0, roughness);
  float lambdaL = NdotV * mix(NdotL, 1.0, roughness);
  return 0.5 / (lambdaV + lambdaL + 1e-5);
}

float GgxDistributionTerm(float NdotH, float roughness) {
  float a2 = roughness * roughness;
  float d = (NdotH * a2 - NdotH) * NdotH + 1.0;
  return INV_PI * a2 / (d * d + 1e-7);
}

// Implements Schlick's approximation to Fresnel. IoR is implied by
// F0, which contains minimum reflectance values (per RGB color).
vec3 FresnelTerm (vec3 F0, float cosA) {
  float t = Pow5(1.0 - cosA);
  return F0 + (vec3(1.0) - F0) * t;
}

vec3 SurfaceShaderInternal(
    vec3 normal,  // Unit surface normal.
    vec3 lightDir,  // Unit vector from shading point to light.
    vec3 eyeDir,  // Unit vector from shading point to camera.
    vec3 lightColor,  // RGB color of the light.
    vec3 diffuseColor,  // Surface diffuse color.
    vec3 specularColor,  // Surface specular color, also drives Fresnel.
    float perceptualRoughness) {  // Unity's perceptual Roughness, in [0.0, 1.0].
  float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
  float NdotV = abs(dot(normal, eyeDir));

  vec3 halfVector = normalize(lightDir + eyeDir);
  float NdotH = clamp(dot(normal, halfVector), 0.0, 1.0);
  float LdotH = clamp(dot(lightDir, halfVector), 0.0, 1.0);

  float diffuseTerm = NdotL *
    DisneyDiffuseTerm(NdotV, NdotL, LdotH, perceptualRoughness);

  if (length(specularColor) < 1e-5) {
    return diffuseColor * (lightColor * diffuseTerm);
  }

  float roughness = perceptualRoughness * perceptualRoughness;

  // The V term includes both the traditional G term and the BRDF divisors.
  float V = GgxDistributionTerm(NdotH, roughness);
  float D = SmithJointVisibilityTerm(NdotL, NdotV, roughness);
  float specularTerm = V * D * PI;  // RGB-based Fresnel terms applied below.

  specularTerm = sqrt(max(1e-4, specularTerm));  // For Gamma-space rendering.
  specularTerm *= NdotL;

  // Treats specularColor as spectral F0 components of Schlick's formula.
  vec3 fresnelColor = FresnelTerm(specularColor, LdotH);

  return lightColor *
      (diffuseTerm * diffuseColor + specularTerm * fresnelColor);
}

// An emulation of Unity 5.5's Surface shader, minus the global
// illumination part. Returns a per-light color contribution to the
// shaded surface. Ambient illumination needs to be added separately.
vec3 SurfaceShaderSpecularGloss(
    vec3 normal,  // Unit surface normal.
    vec3 lightDir,  // Unit vector from shading point to light.
    vec3 eyeDir,  // Unit vector from shading point to camera.
    vec3 lightColor,  // RGB color of the light.
    vec3 albedoColor,  // Surface albedo color.
    vec3 specularColor,  // Surface specular color, also drives Fresnel.
    float gloss) {  // Unity's perceptual smoothness, in [0.0, 1.0].
  float oneMinusSpecularIntensity =
      1.0 - clamp(max(max(specularColor.r, specularColor.g), specularColor.b), 0., 1.);
  vec3 diffuseColor = albedoColor * oneMinusSpecularIntensity;
  float perceptualRoughness = 1.0 - gloss;

  return SurfaceShaderInternal(
      normal, lightDir, eyeDir, lightColor, diffuseColor, specularColor, perceptualRoughness);
}

// An emulation of Unity 5.5's Surface shader using MetallicSetup(), minus the global
// illumination part. Returns a per-light color contribution to the
// shaded surface. Ambient illumination needs to be added separately.
vec3 SurfaceShaderMetallicRoughness(
    vec3 normal,  // Unit surface normal.
    vec3 lightDir,  // Unit vector from shading point to light.
    vec3 eyeDir,  // Unit vector from shading point to camera.
    vec3 lightColor,  // RGB color of the light.
    vec3 albedoColor,  // Surface albedo color.
    float metallic,  // Surface metallic value, drives specular color and reflectivity.
    float perceptualRoughness) {  // Unity's perceptual Roughness, in [0.0, 1.0], sqrt of roughness.
  vec3 specularColor = mix(GAMMA_DIELECTRIC_SPEC, albedoColor, metallic);
  float oneMinusReflectivity = GAMMA_ONE_MINUS_DIELECTRIC - metallic * GAMMA_ONE_MINUS_DIELECTRIC;
  vec3 diffuseColor = albedoColor * oneMinusReflectivity;

  return SurfaceShaderInternal(
      normal, lightDir, eyeDir, lightColor, diffuseColor, specularColor, perceptualRoughness);
}

//
// An Approximation of Unity SH Lighting
//

// SH lighting needs to emulate Unity's SH light behavior.
// -Diffuse contribution should be roughly 1/2
// -Specularity should "subtract" from the diffuse contribution becuase
//  the SH Lights in unity are not energy preserving.

vec3 ShShaderWithSpec(
    vec3 normal,  // Unit surface normal.
    vec3 lightDir,  // Unit vector from shading point to light.
    vec3 lightColor,  // RGB color of the light.
    vec3 diffuseColor, // Surface diffuse color, i.e. albedo.
    vec3 specularColor) {  // Specular color.  Used to replicate broken SH lighting
                           // in unity which is not energy preserving
  float specularGrayscale = dot(specularColor, vec3(0.3, 0.59, 0.11));
  float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
  // Compensate for missing specular contribution
  float shIntensityMultiplier = 1. - specularGrayscale;
  shIntensityMultiplier *= shIntensityMultiplier;
  return diffuseColor * lightColor * NdotL * shIntensityMultiplier;
}

vec3 ShShader(
    vec3 normal,  // Unit surface normal.
    vec3 lightDir,  // Unit vector from shading point to light.
    vec3 lightColor,  // RGB color of the light.
    vec3 diffuseColor) {  // Surface diffuse color, i.e. albedo
  return ShShaderWithSpec(normal, lightDir, lightColor, diffuseColor, vec3(0.,0.,0.));
}

//
// Lambert Lighting
//
vec3 LambertShader(
    vec3 normal,  // Unit surface normal.
    vec3 lightDir,  // Unit vector from shading point to light.
    vec3 lightColor,  // RGB color of the light.
    vec3 diffuseColor) {  // Surface diffuse color, i.e. albedo.
  float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
  return diffuseColor * lightColor * NdotL;
}
//
// Voronoi implementation taken from
// https://github.com/Scrawk/GPU-Voronoi-Noise
// (MIT License)
//

//1/7
#define K 0.142857142857
//3/7
#define Ko 0.428571428571

#define OCTAVES 1

vec3 fmod(vec3 x, float y) { return x - y * floor(x/y); }
vec2 fmod(vec2 x, float y) { return x - y * floor(x/y); }

// Permutation polynomial: (34x^2 + x) mod 289
vec3 Permutation(vec3 x)
{
    return mod((34.0 * x + 1.0) * x, 289.0);
}

vec2 inoise(vec3 P, float jitter)
{
    vec3 Pi = mod(floor(P), 289.0);
    vec3 Pf = fract(P);
    vec3 oi = vec3(-1.0, 0.0, 1.0);
    vec3 of = vec3(-0.5, 0.5, 1.5);
    vec3 px = Permutation(Pi.x + oi);
    vec3 py = Permutation(Pi.y + oi);
    
    vec3 p, ox, oy, oz, dx, dy, dz;
    vec2 F = vec2(1e6,1e6);
    
    for(int i = 0; i < 3; i++) {
        for(int j = 0; j < 3; j++) {
            p = Permutation(px[i] + py[j] + Pi.z + oi); // pij1, pij2, pij3
            
            ox = fract(p*K) - Ko;
            oy = mod(floor(p*K),7.0)*K - Ko;
            p = Permutation(p);
            
            oz = fract(p*K) - Ko;
            
            dx = Pf.x - of[i] + jitter*ox;
            dy = Pf.y - of[j] + jitter*oy;
            dz = Pf.z - of + jitter*oz;
            
            vec3 d = dx * dx + dy * dy + dz * dz; // dij1, dij2 and dij3, squared
            
            //Find lowest and second lowest distances
            for(int n = 0; n < 3; n++) {
                if(d[n] < F[0]) {
                    F[1] = F[0];
                    F[0] = d[n];
                } else if(d[n] < F[1]) {
                    F[1] = d[n];
                }
            }
        }
    }
    return F;
}

// fractal sum, range -1.0 - 1.0
vec2 fBm_F0(vec3 p, int octaves)
{
    //u_Frequency needs a bit of a boost for the gltf to look right
    float freq = u_Frequency * 4.;
    float amp = 0.5;
    vec2 F = inoise(p * freq, u_Jitter) * amp;
    return F;
}


// Specular only lighting
vec3 computeGemReflection() {
  vec3 normal = normalize(v_normal);
  
  // Get Voronoi
  vec2 F = fBm_F0(v_local_position, OCTAVES);
  float gem = (F.y - F.x);

  // Perturb normal with voronoi cells
  float perturbIntensity = 50.; //was 10. in unity.  Presumably glsl vs. hlsl is the source of the discrepancy.
  normal.y += dFdy(gem) * perturbIntensity;
  normal.x += dFdx(gem) * perturbIntensity;
  normal = normalize(normal);

  vec3 lightDir0 = normalize(v_light_dir_0);
  vec3 lightDir1 = normalize(v_light_dir_1);
  vec3 eyeDir = -normalize(v_position);
  vec3 diffuseColor = vec3(0.,0.,0.);

  // Artifical diffraction highlights to simulate what I see in blocks. Tuned to taste.
  vec3 refl = eyeDir - 2. * dot(eyeDir, normal) * normal + gem;
  vec3 colorRamp = vec3(1.,.3,0)*sin(refl.x * 30.) + vec3(0.,1.,.5)*cos(refl.y * 37.77) + vec3(0.,0.,1.)*sin(refl.z*43.33);

  // was colorRamp * .1 in unity, but boosting since
  // we don't have an environment map on Poly
  vec3 specularColor = u_Color.rgb + colorRamp * .5;
  float smoothness =  u_Shininess;

  vec3 lightOut0 = SurfaceShaderSpecularGloss(normal, lightDir0, eyeDir, u_SceneLight_0_color.rgb,
      diffuseColor, specularColor, smoothness);

  // Calculate rim lighting
  float viewAngle = clamp(dot(eyeDir, normal),0.,1.);
  float rim =  pow(1. - viewAngle, u_RimPower);
  vec3 rimColor = vec3(rim,rim,rim) * u_RimIntensity;

  return (lightOut0 + rimColor);
}

void main() {
    fragColor.rgb = computeGemReflection();
    fragColor.a = 1.0;
}
