import {THREE} from './three-defs.js';
import {entity} from './entity.js';


//Just a simple controller
class BasicControllerInput extends entity.Component {
	constructor() {
		super();
		this.Init();    
	}

	Init() {
		this.keys = {
			forward: false,
			side: false,
			up: false,
			roll: false,
			space: false,
			shift: false,
		};
		document.addEventListener('keydown', (e) => this.onKeyDown(e), false);
		document.addEventListener('keyup', (e) => this.onKeyUp(e), false);
	}

	onKeyDown(event) {
		switch (event.keyCode) {
			case 87: this.keys.forward = -1;
				break; //w
			case 65: this.keys.side = -1; 
				break; //a
			case 83: this.keys.forward = 1; 
				break; //s
			case 68: this.keys.side = 1; 
				break; //d   
			case 38: // Arrow_UP
				event.preventDefault();
				this.keys.up = 1.0; break;   
			case 40: // Arrow_Down
				event.preventDefault();
				this.keys.up = -1.0; break;  
			case 39: // Arrow_Right
				event.preventDefault();
				this.keys.roll = 1.0; break;                    
			case 37: // Arrow_Left
				event.preventDefault();
				this.keys.roll = -1.0; break;
			case 32: 
				event.preventDefault();
				this.keys.space = 1;
				break;
			case 16: 
				event.preventDefault();
				this.keys.shift = 1; 
				break;
		}
	}

	onKeyUp(event) {
		switch(event.keyCode) {
			case 87: this.keys.forward = false; 
			break;
			case 65: this.keys.side = false; 
			break;
			case 83: this.keys.forward = false; 
			break;
			case 68: this.keys.side = false; 
			break;
			case 32: this.keys.space = false; 
			break;
			case 16: this.keys.shift = false; 
			break;      
			case 38: this.keys.up = false; 
			break;   
			case 40: this.keys.up = false; 
			break;                     
			case 39: this.keys.roll = false; 
			break;                    
			case 37: this.keys.roll = false; 
			break;   
			case 32: this.keys.space = false;
			break;
			case 16: this.keys.shift = false; 
			break;		                         
		}
	}
};//end BasicControllerInput



class BasicController {
	constructor(params) {
		this.Init(params);
	}

	Init(params) {
		this.params = params;
		this.decceleration = new THREE.Vector3(-30.0, -30.0, -30.0);
		this.acceleration = new THREE.Vector3(1, 0.5, 2500.0);
		this.velocity = new THREE.Vector3(0, 0, 0);

		this.input = new BasicControllerInput();

		this.object = params.camera;
	}


  Update(timeInSeconds) {

		const velocity = this.velocity;
			const frameDecceleration = new THREE.Vector3(
			velocity.x * this.decceleration.x,
			velocity.y * this.decceleration.y,
			velocity.z * this.decceleration.z
		);
		frameDecceleration.multiplyScalar(timeInSeconds);
		velocity.add(frameDecceleration);


		const controlObject = this.object;
		const _Q = new THREE.Quaternion();
		const _A = new THREE.Vector3();
		const _R = controlObject.quaternion.clone();

		const acc = this.acceleration.clone();

		if (this.input.keys.forward) {
			velocity.z = acc.z * timeInSeconds * this.input.keys.forward;
		}
		/*
		if (this.input.keys.side) {	//strave
			velocity.x = 5 * acc.z * timeInSeconds * this.input.keys.side;   
		}
*/
      if (this.input.keys.side) {
        _A.set(0, 1, 0);
        _Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * acc.y * this.input.keys.side);
        _R.multiply(_Q);
      }

		if (this.input.keys.up) {
			_A.set(1, 0, 0);
			_Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * acc.y * this.input.keys.up);
			_R.multiply(_Q);
		}   
		if (this.input.keys.roll) {
			_A.set(0, 0, 1);
			_Q.setFromAxisAngle(_A, -Math.PI * timeInSeconds * acc.y * this.input.keys.roll);
			_R.multiply(_Q);
		}   

    
		controlObject.quaternion.copy(_R);


		const forward = new THREE.Vector3(0, 0, 1);
		forward.applyQuaternion(controlObject.quaternion);
		forward.normalize();

		const sideways = new THREE.Vector3(1, 0, 0);
		sideways.applyQuaternion(controlObject.quaternion);
		sideways.normalize();

		sideways.multiplyScalar(velocity.x * timeInSeconds);
		forward.multiplyScalar(velocity.z * timeInSeconds);

		controlObject.position.add(forward);
		controlObject.position.add(sideways);

		const updown = new THREE.Vector3(0, 1, 0);
		updown.applyQuaternion(controlObject.quaternion);
		updown.normalize();
      
		const roll = new THREE.Vector3(0, 0, 1);
		roll.applyQuaternion(controlObject.quaternion);
		roll.normalize();

	}
  
};//BasicController



export {BasicController};