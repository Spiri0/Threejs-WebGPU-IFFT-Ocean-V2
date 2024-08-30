import {THREE, GUI} from './three-defs.js';
import {entity} from './entity.js';
import {entity_manager} from './entity-manager.js';
import {threejs_component} from './threejs-component.js';
import { BasicController } from './basic-controller.js';
import {ocean} from './ocean/ocean.js';
import {wave_generator} from './waves/wave-generator.js';




class Main extends entity.Entity{
	constructor(){
		super();
	}

	async Initialize() {
		this.entityManager_ = new entity_manager.EntityManager();
		this.entityManager_.Add(this, 'main');
		this.OnGameStarted();
	}

	async OnGameStarted() {
		this.CreateGUI();
		this.clock_ = new THREE.Clock();
		this.then = performance.now();
		await this.LoadControllers();
		this.previousRAF = null;
		this.RAF();
	}

	CreateGUI() {
		this.guiParams = {};
		this.gui_ = new GUI();
		this.gui_.close();
	}

	async LoadControllers() {
		
		const threejs = new entity.Entity();
		threejs.AddComponent(new threejs_component.ThreeJSController());
		this.entityManager_.Add(threejs, 'threejs');
		
		
		this.scene_ = threejs.GetComponent('ThreeJSController').scene_;
		this.camera_ = threejs.GetComponent('ThreeJSController').camera_;
		this.renderer_ = threejs.GetComponent('ThreeJSController').renderer_;
		this.threejs_ = threejs.GetComponent('ThreeJSController');
		

		await this.renderer_.init();


		const basicParams = {
			scene: this.scene_,
			camera: this.camera_,
			threejs: this.threejs_,
			renderer: this.renderer_
		};
		
		this.camera_.position.set(0, 6, 0);
		this.camera_.rotation.x = -0.1 * Math.PI;
		this.scene_.position.set(0, 0, 0);
		this.player = new BasicController(basicParams);
		
		
		//------------------------------IFFT-Wave-Generator---------------------------------
		
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
		
		
		//----------------------------------------------------------------------------------
	}



	MoveCameraToOrigin(){
		const currentCameraPosition = this.camera_.position.clone();
		this.scene_.position.sub(currentCameraPosition);
		this.camera_.position.set(0, 0, 0);       
	}

	

	RAF() {

		const dstFPS = 30;
		const fpsInterval = 1000 / dstFPS;
		
		requestAnimationFrame(() => {
			const now = performance.now();
			const elapsed = now - this.then;
			
			if(elapsed > fpsInterval) {

				this.then = now - (elapsed % fpsInterval);
				
				const cameraDistance = this.camera_.position.length();
				if(cameraDistance >= 5000){
					this.MoveCameraToOrigin();
				}
                
				this.Step(elapsed);
				this.threejs_.Render();		
			}

			this.RAF();
		});
	}
      
      
	Step(timeElapsed) { 
		const timeElapsedS = timeElapsed / 1000;
		this.player.Update(1 / 50);//hack, just a fast implementation
		this.entityManager_.Update(timeElapsedS, 0);
	}

}


export {Main};


