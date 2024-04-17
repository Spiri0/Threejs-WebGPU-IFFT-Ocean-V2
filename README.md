This Threejs WebGPU Ocean contains new features that were added with threejs r160.
With r160 mipmaps and anisotropy now work for storage textures. I also added reflections and simple specular lighting as well as an adaptation of the threejs WebGL sky.
Since the mipmaps are exhausted after approx. 20km, the IFFT Ocean currently transitions into a monotonous blue area. For this purpose there will be a distance ocean so that a seamless transition from the limited IFFT area into a shader ocean will take place. There are also missing depth textures that are not yet implemented for wgslFn in threejs.

Important: I have integrated threejs in the index.html and in the worker so that the repository can easily be executed directly with visual studio code and the live server plugin. For a server application, the paths in the index.html and in the worker must be adjusted.
