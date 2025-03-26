import {wgslFn} from "three/tsl";


export const InitialSpectrumWGSL = wgslFn(`

    fn computeWGSL( 
        spectrumBuffer: ptr<storage, array<vec4<f32>>, read_write>,
		waveDataBuffer: ptr<storage, array<vec4<f32>>, read_write>,
        index: u32,
        size: u32,
        waveLength: f32,
        boundaryLow: f32,
        boundaryHigh: f32,
        depth: f32,
        scaleHeight: f32,
        windSpeed: f32,
        windDirection: f32,
        fetch: f32,
        spreadBlend: f32,
        swell: f32,
        peakEnhancement: f32,
        shortWaveFade: f32,
        fadeLimit: f32,
        d_depth: f32,
        d_scaleHeight: f32,
        d_windSpeed: f32,
        d_windDirection: f32,
        d_fetch: f32,
        d_spreadBlend: f32,
        d_swell: f32,
        d_peakEnhancement: f32,
        d_shortWaveFade: f32,
        d_fadeLimit: f32,
    ) -> void {

        var posX = index % size;
        var posY = index / size;
        var idx = vec2u(posX, posY);
	

        var xy = vec2<f32>(f32(posX), f32(posY));
        let deltaK = 2.0 * PI / waveLength;
        let nx = f32(posX) - f32(size) / 2.0;
        let nz = f32(posY) - f32(size) / 2.0;
        let k = vec2<f32>(nx, nz) * deltaK;
        let kLength = length(k);


        if(kLength >= boundaryLow && kLength <= boundaryHigh) {

            var kAngle: f32 = atan2(k.y, k.x);

            var alpha = JonswapAlpha(G, fetch, windSpeed);
            var w = frequency(kLength, G, depth);
            var wp = JonswapPeakFrequency(G, fetch, windSpeed);
            var dOmegadk = frequencyDerivative(kLength, G, depth);

            var spectrum: f32 = JONSWAP(w, G, depth, wp, scaleHeight, alpha, peakEnhancement) * directionSpectrum(kAngle, w, wp, swell, windDirection, spreadBlend) * shortWavesFade(kLength, shortWaveFade, fadeLimit);

		    if(d_scaleHeight > 0) {
       
                var d_alpha = JonswapAlpha(G, d_fetch, d_windSpeed);
                var d_wp = JonswapPeakFrequency(G, d_fetch, d_windSpeed);

			    spectrum = spectrum + JONSWAP(w, G, depth, d_wp, d_scaleHeight, d_alpha, d_peakEnhancement) * directionSpectrum(kAngle, w, d_wp, d_swell, d_windDirection, d_spreadBlend) * shortWavesFade(kLength, d_shortWaveFade, d_fadeLimit);
            }

            var er: f32 = gaussianRandom1(xy);
            var ei: f32 = gaussianRandom2(xy);

            spectrumBuffer[ index ] = vec4<f32>( vec2<f32>( er, ei ) * sqrt(2 * spectrum * abs(dOmegadk)/kLength*deltaK*deltaK ), 0, 0 );
		    waveDataBuffer[ index ] = vec4<f32>( k.x, 1.0 / kLength, k.y, w );
	    } else {
            spectrumBuffer[ index ] = vec4<f32>(0.0);
		    waveDataBuffer[ index ] = vec4<f32>( k.x, 1.0, k.y, 0.0 );
	    }

    }

    const PI: f32 = 3.141592653589793;
    const G: f32 = 9.81;


    fn JonswapAlpha(g: f32, fetch: f32, windSpeed: f32) -> f32 {
        return 0.076 * pow(g * fetch / pow(windSpeed, 2), -0.22);
    }

    fn JonswapPeakFrequency(g: f32, fetch: f32, windSpeed: f32) -> f32 {
        return 22 * pow(windSpeed * fetch / pow(g, 2), -0.33);
    }

    fn gaussianRandom1(seed: vec2<f32>) -> f32 {
        var nrnd0: f32 = random(seed);
        var nrnd1: f32 = random(seed + 0.1);
        return sqrt(-2 * log(max(0.001, nrnd0))) * cos(2 * PI * nrnd1);
    }

    fn gaussianRandom2(seed: vec2<f32>) -> f32 {
        var nrnd0: f32 = random(seed);
        var nrnd1: f32 = random(seed + 0.1);
        return sqrt(-2 * log(max(0.001, nrnd0))) * sin(2 * PI * nrnd1);
    }

    fn random(par: vec2<f32>) -> f32 {
        return fract(sin(dot(par, vec2<f32>(12.9898, 78.233))) * 43758.5453);
    }

    //-----------------------------------------------------------------------

    fn frequency(k: f32, g: f32, depth: f32) -> f32 {
	    return sqrt(g * k * tanh(min(k * depth, 20.0)));
    }

    fn frequencyDerivative(k: f32, g: f32, depth: f32) -> f32 {
	    let th = tanh(min(k * depth, 20.0));
	    let ch = cosh(k * depth);
	    return g * (depth * k / ch / ch + th) / frequency(k, g, depth) / 2.0;
    }

    fn normalisationFactor(s: f32) -> f32 {
	    let s2 = s * s;
	    let s3 = s2 * s;
	    let s4 = s3 * s;
	    if (s < 5.0) {
		    return -0.000564 * s4 + 0.00776 * s3 - 0.044 * s2 + 0.192 * s + 0.163;
        }
	    return -4.80e-08 * s4 + 1.07e-05 * s3 - 9.53e-04 * s2 + 5.90e-02 * s + 3.93e-01;
    }

    fn cosine2s(theta: f32, s: f32) -> f32 {
	    return normalisationFactor(s) * pow(abs(cos(0.5 * theta)), 2.0 * s);
    }

    fn spreadPower(omega: f32, peakOmega: f32) -> f32 {
	    if (omega > peakOmega) {
		    return 9.77 * pow(abs(omega / peakOmega), -2.5);
	    }
	    return 6.97 * pow(abs(omega / peakOmega), 5.0);
    }

    fn TMACorrection(omega: f32, g: f32, depth: f32) -> f32 {
        let omegaH = omega * sqrt(depth / g);
        if (omegaH <= 1.0) {
            return 0.5 * omegaH * omegaH;
        }
        if (omegaH < 2.0) {
            return 1.0 - 0.5 * (2.0 - omegaH) * (2.0 - omegaH);
        }
        return 1.0;
    }

    fn directionSpectrum(theta: f32, w: f32, wp: f32, swell: f32, angle: f32, spreadBlend: f32) -> f32 {
        let s = spreadPower(w, wp) + 16.0 * tanh(min(w / wp, 20.0)) * swell * swell;
        return mix(2.0 / PI * cos(theta) * cos(theta), cosine2s(theta - angle, s), spreadBlend);
    }

    fn JONSWAP(w: f32, g: f32, depth: f32, wp: f32, scale: f32, alpha: f32, gamma: f32) -> f32 {
        var sigma: f32 = select(0.07, 0.09, w <= wp);
        var a = exp(-pow(w - wp, 2) / (2 * pow(sigma * wp, 2)));

        return scale * TMACorrection(w, g, depth) * alpha * pow(g, 2) 
            * pow(1/w, 5)
            * exp(-1.25 * pow(wp / w, 4)) 
            * pow(abs(gamma), a);
    }



    //----------------------------






    //----------------------------



    fn shortWavesFade(kLength: f32, shortWavesFade: f32, fadeLimit: f32) -> f32
    {
        return (1 - fadeLimit) * exp(-pow(shortWavesFade * kLength, 2)) + fadeLimit;
    }

`);
