import * as THREE from "three";
import {entity} from './entity.js';
import ThirdPersonCamera from './third-person-camera.js';
import PlayerController from './player-controller.js';
import PlayerInput from './player-input.js';


export const spawners = (() => {

	class PlayerSpawner extends entity.Component {
		constructor(params) {
			super();
			this.params = params;    
		}

		Spawn() {
			
			const params = {
				camera: this.params.camera,
				scene: this.params.scene,
				offset: new THREE.Vector3(0, 0, 0),
				layer: this.params.layer
			};

			const player = new entity.Entity();

			player.SetPosition(new THREE.Vector3(0, 5, 0));
      		player.AddComponent(new PlayerInput());
			player.AddComponent(new PlayerController());
      		player.AddComponent(new ThirdPersonCamera({
	      		camera: this.params.camera,
      			target: player
			}));
     
			this.Manager.Add(player, 'player');
			
			return player;
		}
	}



	return {
		PlayerSpawner: PlayerSpawner,
	};

})();



