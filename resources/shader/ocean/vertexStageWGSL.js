import {wgslFn, varyingProperty} from "three/tsl";


export const vertexStageWGSL = (() => {

    //varyings
    const vDisplacedPosition = varyingProperty("vec3", "vDisplacedPosition");
    const vMorphedPosition = varyingProperty("vec3", "vMorphedPosition");
    const vCascadeScales = varyingProperty("vec4", "vCascadeScales");
    const vTexelCoord0 = varyingProperty("vec2", "vTexelCoord0");
    const vTexelCoord1 = varyingProperty("vec2", "vTexelCoord1");
    const vTexelCoord2 = varyingProperty("vec2", "vTexelCoord2");
    const vTexelCoord3 = varyingProperty("vec2", "vTexelCoord3");


    const vertexStageWGSL = wgslFn(`

    fn WGSLPosition(
        displacement0: texture_2d<f32>,
        displacement1: texture_2d<f32>,
        displacement2: texture_2d<f32>,
        displacement3: texture_2d<f32>,
        noise: texture_2d<f32>,
        cameraPosition: vec3<f32>,
        time: f32,
        position: vec3<f32>,
        vindex: i32,
        minLodRadius: f32,
        gridResolution: f32,
        lod: f32,
        width: f32,
        waveLengths: vec4<f32>,
        ifftResolution: f32,
    ) -> vec4<f32> {

        var morphValue: f32 = getMorphValue(cameraPosition, position, minLodRadius, lod);
        var morphedVertex: vec2<f32> = morphVertex(position, morphValue, f32(vindex), gridResolution, width);
        var morphedPosition: vec3<f32> = vec3<f32>(morphedVertex.x, 0, morphedVertex.y);

        
        var lodHeightThreshold: f32 = 250;
        var lod1DetailThreshold: f32 = 0.25;
        var lod2DetailThreshold: f32 = 0.15;
        var lod3DetailThreshold: f32 = 0.15;

        var lod0: f32 = select(1.0, cameraPosition.y/lodHeightThreshold, cameraPosition.y > lodHeightThreshold);
        var lod1: f32 = select(lod2DetailThreshold, lod2DetailThreshold + (1 - lod1DetailThreshold) * (lodHeightThreshold - cameraPosition.y)/lodHeightThreshold, cameraPosition.y < lodHeightThreshold);
        var lod2: f32 = select(lod2DetailThreshold, lod2DetailThreshold + (1 - lod2DetailThreshold) * (lodHeightThreshold - cameraPosition.y)/lodHeightThreshold, cameraPosition.y < lodHeightThreshold);
        var lod3: f32 = select(lod3DetailThreshold, lod3DetailThreshold + (1 - lod3DetailThreshold) * (lodHeightThreshold - cameraPosition.y)/lodHeightThreshold, cameraPosition.y < lodHeightThreshold);

        var vtexelCoord0: vec2<f32> = ifftResolution * morphedPosition.xz/waveLengths.x;
        var vtexelCoord1: vec2<f32> = ifftResolution * morphedPosition.xz/waveLengths.y;
        var vtexelCoord2: vec2<f32> = ifftResolution * morphedPosition.xz/waveLengths.z;
        var vtexelCoord3: vec2<f32> = ifftResolution * morphedPosition.xz/waveLengths.w;

        var displacement_0: vec4<f32> = findNearestTexelsAndInterpolate(displacement0, vtexelCoord0, ifftResolution) * lod0;
        var displacement_1: vec4<f32> = findNearestTexelsAndInterpolate(displacement1, vtexelCoord1, ifftResolution) * lod1;
        var displacement_2: vec4<f32> = findNearestTexelsAndInterpolate(displacement2, vtexelCoord2, ifftResolution) * lod2;
        var displacement_3: vec4<f32> = findNearestTexelsAndInterpolate(displacement3, vtexelCoord3, ifftResolution) * lod3;


        var displacedPosition: vec3<f32> = morphedPosition + (displacement_0.rgb + displacement_1.rgb + displacement_2.rgb + displacement_3.rgb);

        
        varyings.vCascadeScales = vec4<f32>(lod0, lod1, lod2, lod3);
        varyings.vDisplacedPosition = displacedPosition;
        varyings.vMorphedPosition = morphedPosition;
        varyings.vTexelCoord0 = vtexelCoord0;
        varyings.vTexelCoord1 = vtexelCoord1;
        varyings.vTexelCoord2 = vtexelCoord2;
        varyings.vTexelCoord3 = vtexelCoord3;
        
        //return vec4<f32>(morphedPosition, 1.0);
        return vec4<f32>(displacedPosition, 1.0);
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


        var texel0 = textureLoad(texture, vec2<i32>(texCoord0), 0);
        var texel1 = textureLoad(texture, vec2<i32>(texCoord1), 0);
        var texel2 = textureLoad(texture, vec2<i32>(texCoord2), 0);
        var texel3 = textureLoad(texture, vec2<i32>(texCoord3), 0);


        var interp1 = mix(texel0, texel1, weights.x);
        var interp2 = mix(texel2, texel3, weights.x);
        var interpolatedValue = mix(interp1, interp2, weights.y);

        return interpolatedValue;
    }


    fn getMorphValue(cameraPosition: vec3<f32>, position: vec3<f32>, minLodRadius: f32, lod: f32) -> f32 {

        var height: f32 = cameraPosition.y -position.y;
        var eyeDist: f32 = distance(position, cameraPosition);
        var phi: f32 = acos(height/eyeDist);
        var dist: f32 = sin(phi) * eyeDist;

        var n: f32 = log2(eyeDist/minLodRadius);
        var min: f32 = 0;
        var max: f32 = 0;

        if(n <= 0){
            n = 0;

            min = 0;
            max = sin(acos(height/minLodRadius)) * minLodRadius;
        }
        else{
            n = floor(n);

            if(height <= minLodRadius * pow(2, n)){
                min = sin(acos(height/(minLodRadius * pow(2, n)) )) * minLodRadius * pow(2, n);
            }
            max = sin(acos(height/(minLodRadius * pow(2, n + 1)) )) * minLodRadius * pow(2, n + 1);

            n = n + 1;
        }

        var delta: f32 = max - min;
        var factor: f32 = (dist - min)/delta;

        var startpercent: f32 = 0.71;
        var endpercent: f32 = 0.95;

        if(lod == n){
            return clamp((dist - min - delta * startpercent)/((endpercent - startpercent) * delta) , 0, 1);
        }

        return 1;
    }

    fn morphVertex(vertex: vec3<f32>, morphValue: f32, idx: f32, grdRes: f32, width: f32) -> vec2<f32> {

        var rowIdx: f32 = floor(idx/(grdRes + 1));
        var colIdx: f32 = idx % (grdRes + 1);

        var fractPart = fract(vec2<f32>(rowIdx, colIdx) * 0.5) * 2/vec2<f32>(grdRes) * width;

    
        if(colIdx != 0){  
            return vertex.xz - fractPart * morphValue;
        }

        for(var i: u32 = 0u; f32(i) < grdRes/2; i = i + 1u){
            if(idx == grdRes + 1 + 2 * (grdRes + 1) * f32(i)){
                return vertex.xz - vec2<f32>(1, 0) * width/grdRes * morphValue;
            }
        }
        return vertex.xz;
    }


    fn sumV(v: vec3<f32>) -> f32 {
        return v.x + v.y + v.z;
    }


    fn tileBreaker(noise: texture_2d<f32>, texture: texture_2d<f32>, position: vec2<f32>, size:f32, scale: f32, waveLength: f32) -> vec4<f32> {
 
        var k: f32 = findNearestTexelsAndInterpolate(noise, 0.005 * position, size).x;

        var l: f32 = k * 8;
        var f: f32 = fract(l);

        var ia: f32 = floor(l + 0.5);
        var ib: f32 = floor(l);
        f = min(f, 1 - f) * 2;

        var offa: vec2<f32> = sin(vec2<f32>(3, 7) * ia);
        var offb: vec2<f32> = sin(vec2<f32>(3, 7) * ib);

        var texCoordA = (position + offa * size);
        var texCoordB = (position + offb * size);

        var cola = findNearestTexelsAndInterpolate(texture, scale/waveLength*texCoordA, size);
        var colb = findNearestTexelsAndInterpolate(texture, scale/waveLength*texCoordB, size);

        return mix(cola, colb, smoothstep(0.2, 0.8, f - 0.1 * sumV(cola.xyz - colb.xyz)));

        //return vec4<f32>(k, k, k, k);
    }


`, [vDisplacedPosition, vMorphedPosition, vCascadeScales, vTexelCoord0, vTexelCoord1, vTexelCoord2, vTexelCoord3]);




    return {
        vertexStageWGSL,
        vDisplacedPosition,
        vMorphedPosition,
        vCascadeScales,
        vTexelCoord0,
        vTexelCoord1,
        vTexelCoord2,
        vTexelCoord3
    }


})();
