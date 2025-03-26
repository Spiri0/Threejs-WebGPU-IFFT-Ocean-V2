import {wgslFn, varyingProperty} from "three/tsl";


export const vertexStageWGSL = (() => {

    //varyings
    const vDisplacedPosition = varyingProperty("vec3", "vDisplacedPosition");
    const vMorphedPosition = varyingProperty("vec3", "vMorphedPosition");
    const vCascadeScales = varyingProperty("vec3", "vCascadeScales");
    const vTexelCoord0 = varyingProperty("vec2", "vTexelCoord0");
    const vTexelCoord1 = varyingProperty("vec2", "vTexelCoord1");
    const vTexelCoord2 = varyingProperty("vec2", "vTexelCoord2");


    const vertexStageWGSL = wgslFn(`

    fn WGSLPosition(
        displacement0: texture_2d<f32>,
        displacement1: texture_2d<f32>,
        displacement2: texture_2d<f32>,
        noise: texture_2d<f32>,
        cameraPosition: vec3<f32>,
        time: f32,
        position: vec3<f32>,
        vindex: i32,
        minLodRadius: f32,
        gridResolution: f32,
        lod: f32,
        width: f32,
        waveLengths: vec3<f32>,
        ifftResolution: f32,
        lodScale: f32
    ) -> vec4<f32> {

        var morphValue: f32 = getMorphValue(cameraPosition, position, minLodRadius, lod);
        var morphedVertex: vec2<f32> = morphVertex(position, morphValue, f32(vindex), gridResolution, width);
        var morphedPosition: vec3<f32> = vec3<f32>(morphedVertex.x, 0, morphedVertex.y);

        
        var viewVector = cameraPosition - position;
        var viewDist = length(viewVector);
        

        var lod0 = min(lodScale * waveLengths.x / viewDist, 1.0);
        var lod1 = min(lodScale * waveLengths.y / viewDist, 1.0);
        var lod2 = min(lodScale * waveLengths.z / viewDist, 1.0);

        var vtexelCoord0: vec2<f32> = ifftResolution * morphedPosition.xz/waveLengths.x;
        var vtexelCoord1: vec2<f32> = ifftResolution * morphedPosition.xz/waveLengths.y;
        var vtexelCoord2: vec2<f32> = ifftResolution * morphedPosition.xz/waveLengths.z;

        var displacement_0: vec4<f32> = InterpolateBilinear(displacement0, vtexelCoord0, ifftResolution) * lod0;
        var displacement_1: vec4<f32> = InterpolateBilinear(displacement1, vtexelCoord1, ifftResolution) * lod1;
        var displacement_2: vec4<f32> = InterpolateBilinear(displacement2, vtexelCoord2, ifftResolution) * lod2;

        


        var displacedPosition: vec3<f32> = morphedPosition + ( displacement_0.rgb + displacement_1.rgb + displacement_2.rgb );

        
        varyings.vCascadeScales = vec3<f32>(lod0, lod1, lod2 );
        varyings.vDisplacedPosition = displacedPosition;
        varyings.vMorphedPosition = morphedPosition;
        varyings.vTexelCoord0 = vtexelCoord0;
        varyings.vTexelCoord1 = vtexelCoord1;
        varyings.vTexelCoord2 = vtexelCoord2;
        
        return vec4<f32>(displacedPosition, 1.0);
    }


    fn InterpolateBilinear(texture: texture_2d<f32>, position: vec2<f32>, size: f32) -> vec4<f32> {

        var texelSize = 1.0 / size;
        var wrapCoords = fract(position / size) * size;

        var texel00 = vec2<u32>(floor(wrapCoords));
        var texel11 = texel00 + vec2<u32>(1, 1);
        var texel01 = vec2<u32>(texel11.x, texel00.y);
        var texel10 = vec2<u32>(texel00.x, texel11.y);

        texel00 = texel00 % u32(size);
        texel01 = texel01 % u32(size);
        texel10 = texel10 % u32(size);
        texel11 = texel11 % u32(size);

        var fractCoords = wrapCoords - vec2<f32>(texel00);

        var value00 = textureLoad(texture, texel00, 0); // tl
        var value10 = textureLoad(texture, texel01, 0); // tr
        var value01 = textureLoad(texture, texel10, 0); // bl
        var value11 = textureLoad(texture, texel11, 0); // br

        var value0 = mix(value00, value10, fractCoords.x);
        var value1 = mix(value01, value11, fractCoords.x);

        return mix(value0, value1, fractCoords.y);
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


`, [ vDisplacedPosition, vMorphedPosition, vCascadeScales, vTexelCoord0, vTexelCoord1, vTexelCoord2 ]);




    return {
        vertexStageWGSL,
        vDisplacedPosition,
        vMorphedPosition,
        vCascadeScales,
        vTexelCoord0,
        vTexelCoord1,
        vTexelCoord2
    }


})();
