import {wgslFn} from "three/nodes";


export const TexturesMergerWGSL = wgslFn(`

    fn computeWGSL( 
        writeDisplacement: texture_storage_2d<rgba16float, write>,
        writeDerivative: texture_storage_2d<rgba16float, write>,
        writeJacobian: texture_storage_2d<rgba32float, write>,
        readDxDz: texture_2d<f32>,
        readDyDxz: texture_2d<f32>,
        readDyxDyz: texture_2d<f32>,
        readDxxDzz: texture_2d<f32>,
        readTurbulence: texture_2d<f32>,
        index: u32,
        size: f32,
        lambda: f32,
        deltaTime: f32
    ) -> void {

        var posX = index % u32(size);
        var posY = index / u32(size);
        var idx = vec2u(posX, posY);
 
        var x = textureLoad(readDxDz, idx, 0);
        var y = textureLoad(readDyDxz, idx, 0);
        var z = textureLoad(readDyxDyz, idx, 0);
        var w = textureLoad(readDxxDzz, idx, 0);

        //The determinant of the Jacobi matrix is a measure of the curvature of the differential surface. 
        //The curvature is particularly high at the crests of the waves. At these points, 
        //the higher energy density leads to foam formation.
        
        var jacobian = (1 + lambda * w.x) * (1 + lambda * w.y) - y.y * y.y * lambda * lambda;

        var turbulence = textureLoad(readTurbulence, idx, 0).r + deltaTime * 0.5 / max(jacobian, 0.5);
        turbulence = min(jacobian, turbulence);

        textureStore(writeDisplacement, idx, vec4f(lambda * x.x, y.x, lambda * x.y, 0));
        textureStore(writeDerivative, idx, vec4f(z.x, z.y, w.x * lambda, w.y * lambda));
        textureStore(writeJacobian, idx, vec4f(turbulence, 0, 0, 0));
    }
`);
