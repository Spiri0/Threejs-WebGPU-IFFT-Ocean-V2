import {wgslFn, varyingProperty} from "three/tsl";


export const vertexStageWGSL = (() => {

    //varyings
    const vWorldPosition = varyingProperty("vec3", "vWorldPosition");
    const SunDirection = varyingProperty("vec3", "SunDirection");
    const vSunfade = varyingProperty("vec4", "vSunfade");
    const vBetaR = varyingProperty("vec2", "vBetaR");
    const vBetaM = varyingProperty("vec2", "vBetaM");
    const vSunE = varyingProperty("vec2", "vSunE");


    const vertexStageWGSL = wgslFn(`

    	fn vertexShader(
			position: vec3<f32>,
			sunPosition: vec3<f32>,
			rayleigh: f32,
			turbidity: f32,
			mieCoefficient: f32,
			up: vec3<f32>,
    	) -> vec4<f32> {

			var sunDirection: vec3<f32> = normalize( sunPosition );
			var sunfade: f32 = 1.0 - min(max( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0), 1.0 );
			varyings.vSunDirection = sunDirection;
			varyings.vSunE = sunIntensity( dot( sunDirection, up ) );
			varyings.vSunfade = sunfade;

			var rayleighCoefficient: f32 = rayleigh - ( 1.0 * ( 1.0 - sunfade ) );

			// extinction (absorbtion + out scattering)
			// rayleigh coefficients
			varyings.vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			varyings.vBetaM = totalMie( turbidity ) * mieCoefficient;

			varyings.vWorldPosition = position;

        	return vec4<f32>(position, 1);
    	}
		
		// constants for atmospheric scattering
		const e: f32 = 2.71828182845904523536028747135266249775724709369995957;
		const pi: f32 = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const lambda: vec3<f32> = vec3<f32>( 680E-9, 550E-9, 450E-9 );
		// this pre-calcuation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const totalRayleigh: vec3<f32> = vec3<f32>( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const v: f32 = 4.0;
		const K: vec3<f32> = vec3<f32>( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const MieConst: vec3<f32> = vec3<f32>( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const cutoffAngle: f32 = 1.6110731556870734;
		const steepness: f32 = 1.5;
		const EE: f32 = 1000.0;

		fn sunIntensity( zenithAngleCos: f32 ) -> f32 {
			var zAngleCos = min(max(zenithAngleCos, -1.0), 1.0);
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zAngleCos ) ) / steepness ) ) );
		}

		fn totalMie( T: f32 ) -> vec3<f32> {
			var c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}
		
	`,[
		varyingProperty("vec3", "vWorldPosition"),
		varyingProperty("vec3", "vSunDirection"),
		varyingProperty("float", "vSunfade"),
		varyingProperty("vec3", "vBetaR"),
		varyingProperty("vec3", "vBetaM"),
		varyingProperty("float", "vSunE")
	])


    return {
        vertexStageWGSL,
        vWorldPosition,
        SunDirection,
        vSunfade,
        vBetaR,
        vBetaM,
        vSunE
    }

})();

