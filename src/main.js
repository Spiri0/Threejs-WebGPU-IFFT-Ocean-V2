import {THREE, GUI} from './three-defs.js';
import {entity} from './entity.js';
import {entity_manager} from './entity-manager.js';
import ThreeJSController from './threejs-component.js';
import OceanChunkManager from './ocean/ocean.js';
import {wave_generator} from './waves/wave-generator.js';
import {spawners} from './spawners.js';


class Main extends entity.Entity{

	static isInitialized = false;

	constructor(){
		super();
	}

	async Initialize() {

		if ( Main.isInitialized ) {
			console.log("App is already initialized");
			return;
		}

		this.entityManager = new entity_manager.EntityManager();
		this.entityManager.Add(this, 'main');
		this.OnGameStarted();

		Main.isInitialized = true;

	}

	async OnGameStarted() {

		this.CreateGUI();
		await this.LoadControllers();

		if ( !this.running ) {

			this.running = true;
			this.previousTime = 0;

			this.renderer.setAnimationLoop( this.Animate.bind( this ) );
		}
	}

	CreateGUI() {
		this.guiParams = {};
		this.gui = new GUI();
		this.gui.close();
	}

	async LoadControllers() {
		
		const threejs = new entity.Entity();
		threejs.AddComponent(new ThreeJSController());
		this.entityManager.Add(threejs, 'threejs');
		
		this.scene = threejs.GetComponent('ThreeJSController').scene;
		this.camera = threejs.GetComponent('ThreeJSController').camera;
		this.renderer = threejs.GetComponent('ThreeJSController').renderer;
		this.threejs = threejs.GetComponent('ThreeJSController');
		
		await this.renderer.init();
		

		const basicParams = {
			scene: this.scene,
			camera: this.camera,
			threejs: this.threejs,
			renderer: this.renderer
		};
		

		const spawner = new entity.Entity();

		//Player
		spawner.AddComponent( new spawners.PlayerSpawner( {
			...basicParams,
			layer: 0,
		} ) );

		this.entityManager.Add( spawner, 'spawners' );
		spawner.GetComponent( 'PlayerSpawner' ).Spawn();


		
		//------------------------------IFFT-Wave-Generator---------------------------------

		const waves = new entity.Entity();
		this.waveGenerator = new wave_generator.WaveGenerator();
		await this.waveGenerator.Init( {
			...basicParams,
			gui: this.gui,
	 	} );
		waves.AddComponent( this.waveGenerator );
		this.entityManager.Add(waves, 'waveGenerator');

		//----------------------------Multithreading-CDLOD-Ocean----------------------------

		const ocean = new entity.Entity();
		this.oceanGeometry = new OceanChunkManager();
		await this.oceanGeometry.Init( {
			...basicParams,
			sunpos: new THREE.Vector3(100000, 0, 100000), // not in use at moment, hardcoded in the shader
			waveGenerator: waves.components_.WaveGenerator,
			layer: 0,
			gui: this.gui,
			guiParams: this.guiParams,
			mySampler: this.mySampler,
		} );
		ocean.AddComponent( this.oceanGeometry );
		this.entityManager.Add( ocean, 'ocean' );
		
		//----------------------------------------------------------------------------------
	}

	async Animate() {

		this.camera.layers.enableAll();

		const now = performance.now();
		const deltaTime = ( now - this.previousTime );
		this.previousTime = now;
	
		await this.waveGenerator.Update_( deltaTime );
		this.oceanGeometry.Update_( deltaTime );

		this.Step( deltaTime );
		this.renderer.render( this.scene, this.camera );
		
	//	console.log(deltaTime)

	}


	Step(timeElapsed) { 
		const timeElapsedS = timeElapsed / 1000;
		this.entityManager.Update( timeElapsedS, 0 );
	}

}


export {Main};


