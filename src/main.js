import {THREE, GUI, ShaderPass, FXAAShader, GLTFLoader} from './three-defs.js';
import {ShaderNode, MeshBasicNodeMaterial, MeshStandardNodeMaterial, SpriteNodeMaterial, texture, cubeTexture, attribute, wgslFn} from "three/nodes";
import {entity} from './entity.js';
import {entity_manager} from './entity-manager.js';
import {threejs_component} from './threejs-component.js';
import { BasicController } from './basic-controller.js';
import {ocean} from './ocean/ocean.js';
import {wave_generator} from './waves/wave-generator.js';

import { testFS } from "../resources/shader/boxMaterial.js";
import {RGBMLoader} from './three-defs.js';

import {skybox} from './ocean/sky.js';



class Main extends entity.Entity{
    constructor(){
        super();
    }

	async Initialize() {  
		this.entityManager_ = new entity_manager.EntityManager();
        this.entityManager_.Add(this, 'main');
		this.OnGameStarted();
	}

	OnGameStarted() {
        this.CreateGUI();
		this.clock_ = new THREE.Clock();
		this.LoadControllers();
		this.previousRAF = null;
		this.RAF();
	}

    CreateGUI() {
        this.guiParams = {
        };
        this.gui_ = new GUI();
        this.gui_.close();
    }

    LoadControllers() {
  
		const threejs = new entity.Entity();
    	threejs.AddComponent(new threejs_component.ThreeJSController());
    	this.entityManager_.Add(threejs, 'threejs');

        
    	this.scene_ = threejs.GetComponent('ThreeJSController').scene_;
    	this.camera_ = threejs.GetComponent('ThreeJSController').camera_;
        this.renderer_ = threejs.GetComponent('ThreeJSController').threejs_;
		//this.composer_ = threejs.GetComponent('ThreeJSController').composer_;  //depracted (webgl)
        this.threejs_ = threejs.GetComponent('ThreeJSController');

		const basicParams = {
			scene: this.scene_,
			camera: this.camera_,
            threejs: this.threejs_,
            renderer: this.renderer_
		};

        this.camera_.position.set(0, 10, 0);
        this.camera_.rotation.x = -0.12 * Math.PI;
        this.scene_.position.set(0, 0, 0);
        this.player = new BasicController(basicParams);


        //------------------------------------------------------------------------------------


		//------------------------------IFFT-Wave-Generator----------------------------------
		const WaveGenerator_ = new entity.Entity();
		WaveGenerator_.AddComponent(
			new wave_generator.WaveGenerator({
                ...basicParams,
				clock: this.clock_,
                gui: this.gui_,
     	    })
        );
		this.entityManager_.Add(WaveGenerator_, 'waveGenerator');

		//----------------------------Multithreading-CDLOD-Ocean----------------------------
        
		this.ocean_ = new entity.Entity();
		this.ocean_.AddComponent(
			new ocean.OceanChunkManager({
                ...basicParams,
				sunpos: new THREE.Vector3(100000, 0, 100000), // not in use at moment, hardcoded in the shader
				clock: this.clock_,
                waveGenerator: WaveGenerator_.components_.WaveGenerator, 
                layer: 0,
                depthTexture: this.threejs_.depthTexture,
                gui: this.gui_,
                guiParams: this.guiParams,
                mySampler: this.mySampler
     	    })
        );
		this.entityManager_.Add(this.ocean_, 'ocean');




        const cubeTextureLoader = new THREE.CubeTextureLoader();
        cubeTextureLoader.setPath('resources/textures/cube/sky/');
        const cubeTex = cubeTextureLoader.load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);
        cubeTex.minFilter = THREE.LinearFilter;
        cubeTex.magFilter = THREE.LinearFilter;


        const fragmentStage = wgslFn(`
        fn fragmentStage2(
            position: vec3<f32>,
            texture1: texture_cube<f32>,
            sampler: sampler,
        ) -> vec4<f32> {

            var texcoord = vec3<f32>(position.x, position.y, position.z);

            var color = textureSample(texture1, sampler, normalize(texcoord));
          
            return color;
        }
        `);

        const materialParams = {
            position: attribute("position"),
            texture1: cubeTexture(this.ocean_.components_.OceanChunkManager.cubeRenderTarget.texture),
            sampler: cubeTexture(this.ocean_.components_.OceanChunkManager.cubeRenderTarget.texture),
            //texture1: cubeTexture(this.cubeRenderTarget.texture),
            //sampler: cubeTexture(this.cubeRenderTarget.texture),           
            //texture1: cubeTexture(cubeTex),
            //sampler: cubeTexture(cubeTex),
        }

        const geometry = new THREE.BoxGeometry( 10, 10, 10 );
        const material2 = new MeshBasicNodeMaterial();
        material2.colorNode = fragmentStage(materialParams);
        material2.side = THREE.DoubleSide;

        const cube2 = new THREE.Mesh(geometry, material2);
        cube2.position.set(0, 15, -50);
        cube2.rotation.z = -Math.PI/2;
        //this.scene_.add(cube2);
        //this.scene_.background = cubeTexture;






	    //----------------------------------------------------------------------------------
        //--------------------------------------------------------------------------------------
    }



    MoveCameraToOrigin(){
        const currentCameraPosition = this.camera_.position.clone();
        this.scene_.position.sub(currentCameraPosition);
        this.camera_.position.set(0, 0, 0);
        
    }



	RAF() {
	
        requestAnimationFrame((t) => {
            if (this.previousRAF === null) {
                this.previousRAF = t;
            } 
            else {
                this.Step(t - this.previousRAF);

                
                const cameraDistance = this.camera_.position.length();
                if(cameraDistance >= 50){
                    this.MoveCameraToOrigin();
                }
                

                this.threejs_.Render();
                this.previousRAF = t;
            }
    
            setTimeout(() => {
                this.RAF();
            }, 1);
        });
    }
      
      
    Step(timeElapsed) { 
        const timeElapsedS = Math.min(1.0 / 60.0, timeElapsed * 0.001);
        this.player.Update(timeElapsedS);//hack, just a fast implementation
        this.entityManager_.Update(timeElapsedS, 0);
    }


}


export {Main};


