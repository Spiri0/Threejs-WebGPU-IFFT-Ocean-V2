import {THREE, WebGPURenderer, WebGPU, RenderPass, ShaderPass, EffectComposer, CopyShader} from './three-defs.js';
import {MeshBasicNodeMaterial, texture} from "three/nodes";
import {entity} from "./entity.js";


export const threejs_component = (() => {

	class ThreeJSController extends entity.Component {
		constructor() {
			super();
		}

		InitEntity() {
    	
    		if (WebGPU.isAvailable() === false) {
    			document.body.appendChild(WebGPU.getErrorMessage());
                throw new Error('Your Browser does not support WebGPU yet');
			}

			this.threejs_ = new WebGPURenderer({ 
				canvas: document.createElement('canvas'),
				antialias: true,
			});
    	
			this.threejs_.outputColorSpace = THREE.SRGBColorSpace;
			this.threejs_.setPixelRatio(window.devicePixelRatio);
			this.threejs_.shadowMap.enabled = true;
			this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
			this.threejs_.physicallyCorrectLights = true;
			this.threejs_.domElement.id = 'threejs';
			//this.maxAnisotropy = this.threejs_.getMaxAnisotropy();

			this.container = document.getElementById('container');
			this.threejs_.setSize(this.container.clientWidth, this.container.clientHeight);
			this.container.appendChild( this.threejs_.domElement );
		

			const aspect = this.container.clientWidth / this.container.clientHeight; 
			const fov = 50;
			const near = 0.1;
			const far = 1E6;
			this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
			this.scene_ = new THREE.Scene();
			this.threejs_.setClearColor( 0x87CEEB );


			//this.composer_ = new EffectComposer(this.threejs_);
			//const renderPass = new RenderPass(this.scene_, this.camera_);
			//this.composer_.addPass(renderPass);


			window.addEventListener('resize', () => {
				this.OnResize_();
			}, false);



			//this.depthTexture = new THREE.Texture(); //for test, normally DepthTexture and in the shader also
			//this.depthTexture.type = THREE.FloatType;
			
			this.depthTexture = new THREE.DepthTexture();
			this.depthTexture.type = THREE.FloatType;

			//new THREE.DepthTexture();
			/*
			this.depthcamera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
			this.renderTarget = new THREE.RenderTarget(this.container.clientWidth, this.container.clientHeight);
			this.renderTarget.depthTexture = this.depthTexture;

			this.cameraFX = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
			this.sceneFX = new THREE.Scene();

			const materialFX = new MeshBasicNodeMaterial();
			materialFX.colorNode = texture( this.depthTexture );

			this.geometryFX = new THREE.PlaneGeometry( 2, 2 );
			const quad = new THREE.Mesh( this.geometryFX, this.materialFX );
			this.sceneFX.add( quad );
			//
			*/

		}


		Render() {
			/*
			this.threejs_.setRenderTarget(this.renderTarget);
			this.threejs_.render(this.scene_, this.depthcamera_); 
			this.threejs_.setRenderTarget(null);
			*/
			//document.getElementById("testfield6").value = Object.keys(this.threejs_);

			this.camera_.layers.enableAll();
			this.threejs_.render(this.scene_, this.camera_); 
			//this.threejs_.render( this.sceneFX, this.cameraFX );

			//this.composer_.render();	
		}


		Update(timeElapsed) {

		}
    
    
		OnResize_() {
		
			let width, height;
		
			if(window.innerWidth > window.innerHeight){	
				width = 1.0 * window.innerWidth;
				height = 1.0 * window.innerHeight;				
			}		
			if(window.innerHeight > window.innerWidth){	
				width = 1.0 * window.innerWidth;
				height = 1.0 * window.innerHeight;				
			}		
			this.camera_.aspect = width / height;
			this.camera_.updateProjectionMatrix();
			this.threejs_.setSize(width, height);	
		}
  
  	}//end class


  	return {
      	ThreeJSController: ThreeJSController,
  	};

})();