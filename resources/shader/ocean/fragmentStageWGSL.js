import {wgslFn} from "three/tsl";


export const fragmentStageWGSL = wgslFn(`

    fn WGSLColor(
        cameraPosition: vec3<f32>,
        position: vec3<f32>,
        oceanSize: f32,
        minLodRadius: f32,
        numLayers: f32,
        gridResolution: f32,
        vindex: i32,
        width: f32,
        lod: f32,
        time: f32,
        derivatives0: texture_2d<f32>,
        derivatives1: texture_2d<f32>,
        derivatives2: texture_2d<f32>,
        jacobian0: texture_2d<f32>, 
        jacobian1: texture_2d<f32>,
        jacobian2: texture_2d<f32>,
        ifft_sampler0: sampler,
        ifft_sampler1: sampler,
        ifft_sampler2: sampler,
        waveLengths: vec4<f32>,
        ifftResolution: f32,
        foamStrength: f32,
        foamThreshold: f32,
        vMorphedPosition: vec3<f32>,
        vDisplacedPosition: vec3<f32>,
        vCascadeScales: vec4<f32>,
        vTexelCoord0: vec2<f32>,
        vTexelCoord1: vec2<f32>,
        vTexelCoord2: vec2<f32>,
        envTexture: texture_cube<f32>,
        envTexture_sampler: sampler,
        sunPosition: vec3<f32>,
    ) -> vec4<f32> {

        var vViewVector = vDisplacedPosition - cameraPosition;
        var vViewDist = length(vViewVector);
        var viewDir = normalize(vViewVector);

        var Normal_0: vec4<f32> = textureSample(derivatives0, ifft_sampler0, (vMorphedPosition.xz/waveLengths.x)) * vCascadeScales.x;
        var Normal_1: vec4<f32> = textureSample(derivatives1, ifft_sampler1, (vMorphedPosition.xz/waveLengths.y)) * vCascadeScales.y;
        var Normal_2: vec4<f32> = textureSample(derivatives2, ifft_sampler2, (vMorphedPosition.xz/waveLengths.z)) * vCascadeScales.z;

        var jacobi0: f32 = textureSample(jacobian0, ifft_sampler0, (vMorphedPosition.xz/waveLengths.x)).x;
        var jacobi1: f32 = textureSample(jacobian1, ifft_sampler1, (vMorphedPosition.xz/waveLengths.y)).x;
        var jacobi2: f32 = textureSample(jacobian2, ifft_sampler2, (vMorphedPosition.xz/waveLengths.z)).x;
        
        var derivatives: vec4<f32> = normalize(Normal_0 + Normal_1 + Normal_2 );
        var slope: vec2<f32> = vec2<f32>(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
        var normalOcean: vec3<f32> = normalize(vec3(-slope.x, 1.0, -slope.y));

        var jakobian: f32 = jacobi0 + jacobi1 + jacobi2;
        var foam_mix_factor: f32 = min(1, max(0, (-jakobian + foamThreshold) * foamStrength));

        if(dot(normalOcean, -viewDir) < 0.0){
            normalOcean *= -1.0;
        }

        //----------------------------------------------------------------------------------------------------------------



        //var sunDir: vec3<f32> = normalize(vec3<f32>(-0.4, 0.03, -1));
        var sunDir: vec3<f32> = normalize(sunPosition);

        //var diffuse = diffuseLight(normalOcean, sunDir, 1, 1);
        var fresnel = fresnelSchlick(0.02, normalOcean, -viewDir, 5);
        var specular = specularLight2(normalOcean, sunDir, viewDir, 8) * 1.3;

        //var skyColor = getSkyColor(reflect(normalOcean, viewDir)) * SKYCOLOR * 1.25;

        var R = reflect(-viewDir, normalOcean);

        var halfVec = (normalize(-viewDir + normalOcean));

        R = halfVec;
        R = vec3<f32>(R.y, R.x, R.z);
        R.z *= -1;


        var texcoord = vec3<f32>(R.x, R.y, R.z);

        var reflectionColorEnv = textureSample(envTexture, envTexture_sampler, texcoord).rgb;// * vec3<f32>(0.2, 0.5, 1)*1.4;


        var reflectionColor = reflectionColorEnv;
        //var reflectionColor = skyColor;
        //var reflectionColor = normalize(vec3<f32>(10.4, 0.8, 1));
        var refractionColor = SEACOLOR;
        var waterColor = mix(refractionColor, reflectionColor, fresnel);

        var atten: f32 = max(1.0 - vViewDist * vViewDist * 0.001, 0.0);
        waterColor += WAVECOLOR * saturate(vDisplacedPosition.y - 0.0) * 0.05 * atten;

        var oceanColor = waterColor;


        oceanColor += normalize(vec3<f32>(5, 4.5, 4)) * specular;
        //oceanColor += normalize(vec3<f32>(5, 4, 3)) * specular;
        
        oceanColor = mix(oceanColor, vec3<f32>(1), foam_mix_factor);

        oceanColor = mix(SEACOLOR, oceanColor, vCascadeScales.x);


        // Since the mipmaps quickly deplete over distance, a fog at that distance is necessary to avoid unsightly jitter. 
        // This could, of course, be avoided by using longer wavelengths, which would, however, make the ocean very coarse at close range. 
        // A sliding wavelength array for the three cascades would be a good solution. I'll test that out.

        let fade = smoothstep( 500.0, 4000.0, vViewDist );
        let finalColor = mix( oceanColor, vec3<f32>( 0.0, 0.1, 0.2 ), fade );
        return vec4<f32>( finalColor, 1 );

    }


 
    const SKYCOLOR: vec3<f32> = vec3<f32>(0.196, 0.588, 0.785);
    const SEACOLOR: vec3<f32> = vec3<f32>(0.004, 0.016, 0.047);
    const WAVECOLOR: vec3<f32> = vec3<f32>(0.14, 0.25, 0.18);

    //var shallowColor = vec3<f32>(0.0, 0.729, 0.988);
    //var deepColor = vec3<f32>(0.004, 0.016, 0.047);
    //var diffuseColor = vec3<f32>(0.014, 0.026, 0.047);



    fn customTextureSample(texture: texture_2d<f32>, sampler: sampler, uv: vec2<f32>) -> vec4<f32> {

        var textureSize: f32 = 512;
        var mip_bias: f32 = 0;
        var maxAnisotropy: f32 = 16;
        var maxMipLevel = log2(textureSize);

        var dx = dpdx(uv * textureSize);
        var dy = dpdy(uv * textureSize);

        
        var Pmax = max(dot(dx, dx), dot(dy, dy));
        var Pmin = min(dot(dx, dx), dot(dy, dy));

        var anisotropicTerm = maxAnisotropy * maxAnisotropy;
        //var Pmin = min(dot(dx, dx) + anisotropicTerm * dot(dy, dy), dot(dy, dy) + anisotropicTerm * dot(dx, dx));

        var roundedRatio = ceil(Pmax/Pmin);
        var clampedRatio = min(roundedRatio, pow(maxAnisotropy, 2));

        var mipmapLevel = min(0.5 * log2(Pmax/clampedRatio) + mip_bias, 7);


        var Normal: vec4<f32> = textureSampleLevel(texture, sampler, uv, mipmapLevel);


        return Normal;
        //return vec4<f32>(1-mipmapLevel, 0, mipmapLevel, 1);
    }


    
    fn getSkyColor(rayDir: vec3<f32>) -> vec3<f32> {
        return mix(vec3(1), mix(SKYCOLOR, 0.2 * SKYCOLOR, rayDir.y), smoothstep(-0.5, 0.25, rayDir.y));
    }


    fn saturate(value: f32) -> f32 {
       return max(0, min(value, 1)); 
    }


    fn diffuseLight(N: vec3<f32>, L: vec3<f32>, strength: f32, e: f32) -> f32 {
        return pow(dot(N, L) * strength + (1 - strength), e);
    }


    fn specularLight(N: vec3<f32>, L: vec3<f32>, V: vec3<f32>, e: f32) -> f32 {
        var specularTerm: f32 = 0;

        //+ vec3<f32>(0,10,0)

        var R = reflect(N , L);
        var nrm: f32 = (e + 8.0) / (3.1415 * 8.0);
        specularTerm = pow(max(dot(R, V), 0), e) * nrm;

        return specularTerm;
    }


    fn specularLight2(N: vec3<f32>, L: vec3<f32>, V: vec3<f32>, e: f32) -> f32 {

        var half_vector = normalize(V - L);
        var specular = pow(max(dot(N, half_vector), 0), e);

        return specular;
    }



    
    fn fresnelSchlick(F: f32, N: vec3<f32>, V: vec3<f32>, exp: f32) -> f32 {
        return F + (1 - F) * pow(saturate(1 - dot(N, V)), exp);
    }


    fn HDR(color: vec3<f32>, e: f32) -> vec3<f32> {
        return (vec3<f32>(1) - exp(-color * e));
    }


    fn findNearestTexelsAndInterpolate(texture: texture_2d<f32>, position: vec2<f32>, size: f32) -> vec4<f32> {

        var weights: vec2<f32> = abs(fract(position));

        var texCoord0 = floor(position) % size;
        var texCoord1 = vec2<f32>(ceil(position.x), floor(position.y)) % size;
        var texCoord2 = vec2<f32>(floor(position.x), ceil(position.y)) % size;
        var texCoord3 = ceil(position) % size;

        var offset = size - 1;

        if(texCoord0.x < 0){texCoord0.x = offset + texCoord0.x;}
        if(texCoord0.y < 0){texCoord0.y = offset + texCoord0.y;}
        if(texCoord1.x < 0){texCoord1.x = offset + texCoord1.x;}
        if(texCoord1.y < 0){texCoord1.y = offset + texCoord1.y;}
        if(texCoord2.x < 0){texCoord2.x = offset + texCoord2.x;}
        if(texCoord2.y < 0){texCoord2.y = offset + texCoord2.y;}
        if(texCoord3.x < 0){texCoord3.x = offset + texCoord3.x;}
        if(texCoord3.y < 0){texCoord3.y = offset + texCoord3.y;}


        var lodlevel = 0;

        var texel0 = textureLoad(texture, vec2<i32>(texCoord0), lodlevel);
        var texel1 = textureLoad(texture, vec2<i32>(texCoord1), lodlevel);
        var texel2 = textureLoad(texture, vec2<i32>(texCoord2), lodlevel);
        var texel3 = textureLoad(texture, vec2<i32>(texCoord3), lodlevel);


        var interp1 = mix(texel0, texel1, weights.x);
        var interp2 = mix(texel2, texel3, weights.x);
        var interpolatedValue = mix(interp1, interp2, weights.y);

        return interpolatedValue;
    }   




    fn sumV(v: vec3<f32>) -> f32 {
        return v.x + v.y + v.z;
    }


    fn random(par: vec2<f32>) -> f32 {
        return fract(sin(dot(par, vec2<f32>(12.9898, 78.233))) * 43758.5453);
    }

`);
