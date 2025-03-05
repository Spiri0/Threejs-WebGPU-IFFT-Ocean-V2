See it running live [here](https://spiri0.github.io/Threejs-WebGPU-IFFT-Ocean-V2/index.html)

![ocean_social](https://github.com/user-attachments/assets/31a04239-c9e2-4e16-ac56-af78e51e4560)


Threejs-WebGPU-IFFT-Ocean-V2 r168
This is a physically real ocean simulation using the jonswap ocean model and inverse fast fourier transformation. The resolution seen here in the live server is quite low with an ifft texture resolution of 128 in favor of the computing power.

If you have a powerful graphics card you can set the TEXTURE_SIZE in src/waves/wave_constants.js from 128 to 256 or 512. This makes a very big difference in the details.
In src/ocean/ocean_constants.js you can use QT_OCEAN_MIN_CELL_RESOLUTION to have a higher resolution of the wireframe (even numbers only!).

Since the mipmaps are exhausted very quickly depending on the viewing angle, the ocean currently turns into a monotone blue over the distance. Here I imagine an FBM Ocean for the distance.
The wireframe button was defective. I fixed that so you can see the morphing wireframe again. 
Depth textures are now working, but I'm currently very busy with my other project and therefore I don't have the time to implement the scattering for transparent water at the moment.

Important: In order for the live server to work here on github, I had to deactivate the SharedArrayBuffers in the ocean worker and use ArrayBuffers for it. I also had to deactivate the coi-serviceworker in the index.html. The coi-serviceworker is important for the SharedArrayBuffers. So if you download the repo I recommend using the SharedArrayBuffers and the coi-serviceworker. This is significantly more efficient.



I use a much more efficient and advanced techniques to create limitless landscapes. But this repo is pretty good to get into the topic of procedural geometry

<img src="https://github.com/user-attachments/assets/795292f1-2da2-47dc-aa9e-0ca704c77f2d" width="400" />
<img src="https://github.com/user-attachments/assets/3b18ffde-3c6e-4e5a-ba33-de9989a46925" width="400" />
<img src="https://github.com/user-attachments/assets/32781cca-e688-4de1-ad2e-48a0f630b9ec" width="400" />
<img src="https://github.com/user-attachments/assets/6e9f6bfb-479b-40b2-8d51-29118167a93a" width="400" />



