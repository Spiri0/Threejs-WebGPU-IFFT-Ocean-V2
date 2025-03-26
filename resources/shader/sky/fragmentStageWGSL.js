import {wgslFn} from "three/tsl";

export const fragmentStageWGSL = wgslFn(`

    fn fragmentShader(
        normal: vec3<f32>,
        position: vec3<f32>,
        cameraPosition: vec3<f32>,
        sunPosition: vec3<f32>,
        mieDirectionalG: f32,
        rayleigh: f32,
        turbidity: f32,
        mieCoefficient: f32,
        elevation: f32,
        up: vec3<f32>,        
    ) -> vec4<f32> {

        //var pos = vec3<f32>(-position.y, position.x, position.z);
        //var sunPos = vec3<f32>(-sunPosition.y, sunPosition.x, sunPosition.y);

        var sunDirection: vec3<f32> = normalize(sunPosition);
        var cameraOffset = vec3<f32>(0, 0, 0);
        const lambda = vec3<f32>(680E-9, 550E-9, 450E-9);
    
        const K = vec3<f32>(0.686, 0.678, 0.666);
    
        var sunfade = 1.0 - min(max(1.0 - exp((sunPosition.y / 500000.0)), 0.0), 1.0);
        var rayleighCoefficient = rayleigh - (1.0 * (1.0 - sunfade));
        
        var sunE = sunIntensity(dot(sunDirection, up));		
        var betaR = simplifiedRayleigh() * rayleighCoefficient;
        var betaM = totalMie(lambda, K, turbidity) * mieCoefficient;
        
        var zenithAngle = acos(max(0.0, dot( up, normalize(position - cameraPosition + cameraOffset))));
        var sR = rayleighZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
        var sM = mieZenithLength / (cos(zenithAngle) + 0.15 * pow(93.885 - ((zenithAngle * 180.0) / pi), -1.253));
        var Fex = exp(-(betaR * sR + betaM * sM));
        var cosTheta = dot(normalize(position - cameraPosition), sunDirection);
        var rPhase = rayleighPhase(cosTheta*0.5+0.5);
        var betaRTheta = betaR * rPhase;
        var mPhase = hgPhase(cosTheta, mieDirectionalG);
        var betaMTheta = betaM * mPhase;

        var Lin = pow( sunE * ((betaRTheta + betaMTheta) / (betaR + betaM) ) * (1.0 - Fex), vec3<f32>(1.5));
        Lin *= mix( vec3( 1.0 ), pow( sunE * ( ( betaRTheta + betaMTheta ) / ( betaR + betaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, sunDirection ), 5.0 ), 0.0, 1.0 ) );
    
        
        var direction = normalize(position - cameraPosition);
    
        // nightsky
        //var theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
        //var phi = atan( direction.z/ direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
        var theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
        var phi = atan( direction.z/ direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
        var uv = vec2<f32>( phi, theta ) / vec2<f32>( 2.0 * pi, pi ) + vec2<f32>( 0.5, 0.0 );
        var L0 = vec3<f32>( 0.1 ) * Fex;

        // composition + solar disc
        var sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
        L0 += ( sunE * 19000.0 * Fex ) * sundisk;
    
    

        var texColor = (Lin+L0);
        texColor *= 0.04 ;
        texColor += vec3(0.0,0.001,0.0025)*0.3;
    
        var exposure: f32 = 0.025;
        var gamma: f32 = 2 - elevation/90;
    
        var color: vec3<f32> = vec3<f32>(1.0) - exp(-texColor * exposure);
        var retColor = pow(color, vec3<f32>( 1.0/ gamma));

/*
        if(-normal.x > 0){
            retColor = vec3<f32>(1-position.y/1, position.y/1, 0);
        }
        else{
            retColor = vec3<f32>(0, 0, 0);
        }
*/



        return vec4<f32>(retColor * 1.3, 1);

     //   return vec4<f32>(0, 0.5, 0, 1);
    }

    const pi: f32 = 3.141592653589793238462643383279502884197169;
    const e: f32 = 2.71828182845904523536028747135266249775724709369995957;
    const n: f32 = 1.0003; // refractive index of air
    const N: f32 = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)
    const pn: f32 = 0.035;
    const lambda = vec3<f32>(680E-9, 550E-9, 450E-9);
    const K = vec3<f32>(0.686, 0.678, 0.666);
    const v: f32 = 4.0;
    const rayleighZenithLength: f32 = 8.4E3;
    const mieZenithLength: f32 = 1.25E3;
    const EE: f32 = 1000.0;
    // 66 arc seconds -> degrees, and the cosine of that
    const sunAngularDiameterCos: f32 = 0.999956676946448443553574619906976478926848692873900859324;
    const cutoffAngle: f32 = pi/1.95;
    const steepness: f32 = 1.5;


    fn totalRayleigh(lambda: vec3<f32>) -> vec3<f32> {
        return (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn));
    }
    
    fn simplifiedRayleigh() -> vec3<f32> {
        return 0.0005 / vec3(94, 40, 18);
    }
    
    fn rayleighPhase(cosTheta: f32) -> f32 {	 
        return (3.0 / (16.0*pi)) * (1.0 + pow(cosTheta, 2.0));
    }
    
    fn totalMie(lambda: vec3<f32>, K: vec3<f32>, T: f32) -> vec3<f32> {
        var c = (0.2 * T ) * 10E-18;
        return 0.434 * c * pi * pow((2.0 * pi) / lambda, vec3(v - 2.0)) * K;
    }
    
    fn hgPhase(cosTheta: f32, g: f32) -> f32 {
        return (1.0 / (4.0*pi)) * ((1.0 - pow(g, 2.0)) / pow(1.0 - 2.0*g*cosTheta + pow(g, 2.0), 1.5));
    }
    
    fn sunIntensity(zenithAngleCos: f32) -> f32 {
        return EE * max(0.0, 1.0 - exp((-(cutoffAngle - acos(zenithAngleCos))/steepness)));
    }

`);
