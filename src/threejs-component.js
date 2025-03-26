import {THREE, WebGPU} from './three-defs.js';
import {entity} from "./entity.js";
import {pass, depthPass} from "three/tsl";



class ThreeJSController extends entity.Component {
	constructor() {
		super();
	}
		
	InitEntity() {
			
		if (WebGPU.isAvailable() === false) {
			document.body.appendChild(WebGPU.getErrorMessage());
			throw new Error('Your Browser does not support WebGPU yet');
		}

		this.renderer = new THREE.WebGPURenderer({ 
			canvas: document.createElement('canvas'),
			antialias: true,
			forceWebGL: false
		});
    	
		this.renderer.outputColorSpace = THREE.SRGBColorSpace;
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.physicallyCorrectLights = true;
		this.renderer.domElement.id = 'threejs';


		this.container = document.getElementById('container');
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
		this.container.appendChild( this.renderer.domElement );
		

		const aspect = this.container.clientWidth / this.container.clientHeight; 
		const fov = 50;
		const near = 0.1;
		const far = 1E6;
		this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		this.scene = new THREE.Scene();
		this.renderer.setClearColor( 0x87CEEB );


		this.postProcessing = new THREE.PostProcessing( this.renderer );

		this.scenePass = pass( this.scene, this.camera );
		this.sceneDepthPass = depthPass( this.scene, this.camera );

		this.scenePassTexture = this.scenePass.getTextureNode();
        this.sceneDepthPassTexture = this.sceneDepthPass.getTextureNode( 'depth' );


		window.addEventListener('resize', () => {
			this.OnResize_();	
		}, false );
	}
    
    
	OnResize_() {
		
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;
		
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);	
	}
  
}//end class


export default ThreeJSController;
