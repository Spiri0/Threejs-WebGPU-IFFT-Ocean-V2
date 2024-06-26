See it running live [here](https://spiri0.github.io/Threejs-WebGPU-IFFT-Ocean-V2/index.html)

![image](https://github.com/Spiri0/Threejs-WebGPU-IFFT-Ocean-V2/assets/350247/abf0fedf-1a72-4891-b84b-47b0d0b58c0b)

Threejs-WebGPU-IFFT-Ocean-V2 r164
This is a physically real ocean simulation using the jonswap ocean model and inverse fast fourier transformation. The resolution seen here in the live server is quite low with an ifft texture resolution of 128 in favor of the computing power.

If you have a powerful graphics card you can set the TEXTURE_SIZE in src/waves/wave_constants.js from 128 to 256 or 512. This makes a very big difference in the details.
In src/ocean/ocean_constants.js you can use QT_OCEAN_MIN_CELL_RESOLUTION to have a higher resolution of the wireframe (even numbers only!).

Since the mipmaps are exhausted very quickly depending on the viewing angle, the ocean currently turns into a monotone blue over the distance. Here I imagine an FBM Ocean for the distance.

Depth textures cannot currently be used in wgslFn in conjunction with renderTargets. But it's only a matter of time. These are important for a real impression of transparency in order to be able to see objects or the ground beneath the surface with authentic light scattering.

Important: In order for the live server to work here on github, I had to deactivate the SharedArrayBuffers in the ocean worker and use ArrayBuffers for it. I also had to deactivate the coi-serviceworker in the index.html. The coi-serviceworker is important for the SharedArrayBuffers. So if you download the repo I recommend using the SharedArrayBuffers and the coi-serviceworker. This is significantly more efficient.







