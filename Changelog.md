# Changelog


### Fixed
- I've implemented the workgroup size and dispatch size introduced with threejs r179. The previous implementation wasn't yet active on the threejs side.


### Bug
I still have to fix the bug in threejs with the storage textures, because you can't currently update mipmaps for them, which is necessary if you go higher with the camera. This becomes noticeable in ripples when you move the camera when looking from a greater height, because the missing mipmaps cause race issues in the GPU.