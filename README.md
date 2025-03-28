See it running live [here](https://spiri0.github.io/Threejs-WebGPU-IFFT-Ocean/index.html)

![ocean_social](https://github.com/user-attachments/assets/31a04239-c9e2-4e16-ac56-af78e51e4560)


March 26, 2025: I've switched the IFFT system from storage textures to storage buffers. This saves a lot of compute steps and allows for the use of larger cascade textures. Now 3x512 instead of the previous 4x256. The performance has improved significantly.

Threejs-WebGPU-IFFT-Ocean r174
This is a physically real ocean simulation using the jonswap ocean model and inverse fast fourier transformation.
In src/ocean/ocean_constants.js you can use QT_OCEAN_MIN_CELL_RESOLUTION to have a higher resolution of the wireframe (even numbers only!).

Important: In order for the live server to work here on github, I had to deactivate the SharedArrayBuffers in the ocean worker and use ArrayBuffers for it. So if you download the repo I recommend using the SharedArrayBuffers. This is significantly more efficient.



I use a much more efficient and advanced techniques to create limitless landscapes. But this repo is pretty good to get into the topic of procedural geometry

<img src="https://github.com/user-attachments/assets/795292f1-2da2-47dc-aa9e-0ca704c77f2d" width="400" />
<img src="https://github.com/user-attachments/assets/3b18ffde-3c6e-4e5a-ba33-de9989a46925" width="400" />
<img src="https://github.com/user-attachments/assets/32781cca-e688-4de1-ad2e-48a0f630b9ec" width="400" />
<img src="https://github.com/user-attachments/assets/6e9f6bfb-479b-40b2-8d51-29118167a93a" width="400" />



