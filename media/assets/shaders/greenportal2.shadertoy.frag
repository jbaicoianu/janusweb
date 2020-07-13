// Source: https://www.shadertoy.com/view/XtlczH

const float speed = 1.0;
const float twistFrequency = 1.8;
const float pi = 3.14;
const float tau = pi * 2.0;
const vec4 bg = vec4(0);
const float edgeWidth = 1.5;
const float portalRadius = 6.0;
const float twistEdgeMag = 0.6;

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = fragCoord / iResolution.xy;
  vec2 space = 2.0*vec2(fragCoord.xy - 0.5*iResolution.xy)/iResolution.y;
  vec2 unitVector = normalize(space);
    space *= 8.0;
    float magnitude = length(space);
  
    float v1 = sin(space.x + iTime);
    float v2 = sin(space.y + iTime);
    float v3 = sin(space.x + space.y + iTime);
    float v4 = sin(magnitude + 1.7 * iTime);
  float v = v1 + v2 + v3 + v4;
    
    float theta = acos(unitVector.x);
    if (space.y < 0.0)
        theta = tau - theta;
    
    float twist = theta + magnitude * twistFrequency + -iTime * speed;
    twist = mod(twist, tau);
    twist *= smoothstep(tau, pi, twist);
    twist *= smoothstep(0.0, 4.0, magnitude);
    twist = sin(twist);
    twist *= 8.0;
    v += twist;
    
    vec4 portal = vec4((sin(v * 2.0) + 1.0) * 0.2, (sin(v * 0.3 + 0.2 * pi) + 1.0) * 0.25 + 0.5, (sin(v * 0.4 + 0.3 * pi) + 1.0) * 0.2 + 0.1, 1);
    portal.w = .9;
    fragColor = mix(bg, portal, smoothstep(portalRadius + edgeWidth + (sin(twist * twistEdgeMag) * 0.5 + 0.5), portalRadius, magnitude));
}
