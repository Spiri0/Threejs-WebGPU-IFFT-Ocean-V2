import * as THREE from "three";
import {entity} from './entity.js';


class PlayerController extends entity.Component {

	constructor( params ) {

		super();
		this.params_ = params;
		this.dead_ = false;

	}

	InitEntity() {

		this.decceleration_ = new THREE.Vector3( - 0.002, - 0.0001, - 1 );
		this.acceleration_ = new THREE.Vector3( 300, 0.2, 0.5 );
		this.velocity_ = new THREE.Vector3( 0, 0, 0 );

	}

	Update( timeInSeconds ) {

		if ( this.dead_ ) {

			return;

		}

		const input = this.Parent.Attributes.InputCurrent;
		if ( ! input ) {

			return;

		}

		const velocity = this.velocity_;
		const frameDecceleration = new THREE.Vector3(
			velocity.x * this.decceleration_.x,
			velocity.y * this.decceleration_.y,
			velocity.z * this.decceleration_.z
		);
		frameDecceleration.multiplyScalar( timeInSeconds );

		velocity.add( frameDecceleration );
		//velocity.z = -math.clamp(Math.abs(velocity.z), 50.0, 125.0);

		const _PARENT_Q = this.Parent.Quaternion.clone();
		const _PARENT_P = this.Parent.Position.clone();

		const _Q = new THREE.Quaternion();
		const _A = new THREE.Vector3();
		const _R = _PARENT_Q.clone();

		const acc = this.acceleration_.clone();

		if ( input.axis1Forward ) {

			velocity.z = acc.x * timeInSeconds * input.axis1Forward;

		}

		if ( input.space ) {

			velocity.z = 2 * acc.x * timeInSeconds * input.space;

		}

		if ( input.axis1Side ) {

			_A.set( 0, 1, 0 );
			_Q.setFromAxisAngle( _A, - Math.PI * timeInSeconds * acc.y * input.axis1Side );
			_R.multiply( _Q );

		}

		if ( input.axis1Up ) {

			_A.set( 1, 0, 0 );
			_Q.setFromAxisAngle( _A, - Math.PI * timeInSeconds * acc.y * input.axis1Up );
			_R.multiply( _Q );

		}

		if ( input.axis1Roll ) {

			_A.set( 0, 0, 1 );
			_Q.setFromAxisAngle( _A, - Math.PI * timeInSeconds * acc.y * input.axis1Roll );
			_R.multiply( _Q );

		}


		const forward = new THREE.Vector3( 0, 0, 1 );
		forward.applyQuaternion( _PARENT_Q );
		forward.normalize();

		const updown = new THREE.Vector3( 0, 1, 0 );
		updown.applyQuaternion( _PARENT_Q );
		updown.normalize();

		const sideway = new THREE.Vector3( 1, 0, 0 );
		sideway.applyQuaternion( _PARENT_Q );
		sideway.normalize();

		const roll = new THREE.Vector3( 0, 0, 1 );
		roll.applyQuaternion( _PARENT_Q );
		roll.normalize();

		sideway.multiplyScalar( velocity.x * timeInSeconds );
		forward.multiplyScalar( velocity.z * timeInSeconds );
		updown.multiplyScalar( velocity.y * timeInSeconds );
		roll.multiplyScalar( velocity.z * timeInSeconds );


		const pos = _PARENT_P;
		pos.add( forward );
		pos.add( sideway );
		pos.add( updown );
		pos.add( roll );

		this.Parent.SetPosition( pos );
		this.Parent.SetQuaternion( _R );

	}

}


export default PlayerController;
