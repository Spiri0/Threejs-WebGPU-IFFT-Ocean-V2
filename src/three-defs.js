import * as THREE from "three";

import {GUI} from 'three/addons/libs/lil-gui.module.min.js';
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBMLoader} from 'three/addons/loaders/RGBMLoader.js';

import WebGPU from "three/addons/capabilities/WebGPU.js";


export {
    THREE,
    GUI,
    OrbitControls,
    WebGPU,
    GLTFLoader,
    RGBMLoader
};
