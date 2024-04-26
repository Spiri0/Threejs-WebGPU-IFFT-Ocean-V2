See it running live [here](https://spiri0.github.io/Threejs-WebGPU-IFFT-Ocean-V2/index.html)

![image](https://github.com/Spiri0/Threejs-WebGPU-IFFT-Ocean-V2/assets/350247/abf0fedf-1a72-4891-b84b-47b0d0b58c0b)

This Threejs WebGPU Ocean contains new features that were added with threejs r160.
With r160 mipmaps and anisotropy now work for storage textures. I also added reflections and simple specular lighting as well as an adaptation of the threejs WebGL sky.
Since the mipmaps are exhausted after approx. 20km, the IFFT Ocean currently transitions into a monotonous blue area. For this purpose there will be a distance ocean so that a seamless transition from the limited IFFT area into a shader ocean will take place. There are also missing depth textures that are not yet implemented for wgslFn in threejs.
I don't have all the parameters in the controls that could be adjusted. I only included the most important ones.

Important: In order for the live server to work here on github, I had to deactivate the SharedArrayBuffers in the ocean worker and use ArrayBuffers for it. I also had to deactivate the coi-serviceworker in the index.html. The coi-serviceworker is important for the SharedArrayBuffers. So if you download the repo I recommend using the SharedArrayBuffers and the coi-serviceworker. This is significantly more efficient.
