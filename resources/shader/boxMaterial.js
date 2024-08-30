import {wgslFn} from "three/tsl";


export const testFS = wgslFn(`
    fn WGSLColor(
        position: vec3<f32>,
        normal: vec3<f32>,
    ) -> vec4<f32> {

        var color: vec3<f32> = vec3<f32>(0, 0.5, 0.1) * dot(normal, vec3<f32>(-0.4, 0.5, 1));

        return vec4<f32>(color, 1) + vec4<f32>(0, 0.5, 0.1, 1) * 0.25;
    }
`);
