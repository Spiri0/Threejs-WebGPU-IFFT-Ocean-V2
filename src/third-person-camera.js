import * as THREE from "three";
import {entity} from './entity.js';



class ThirdPersonCamera extends entity.Component {

	constructor( params ) {

		super();

		this.params = params;

		this.currentPosition = new THREE.Vector3();

		this.matrix = new THREE.Matrix4();
		this.x = new THREE.Vector3();
		this.y = new THREE.Vector3();
		this.z = new THREE.Vector3();

		this.fracx = 0;
		this.fracy = 0;
		this.fracz = 0;

	}

	CalculateIdealOffset() {

		const offsetY = 0;
		const offsetZ = 0;
		const idealOffset = new THREE.Vector3( 0, offsetY, offsetZ );

		const input = this.Parent.Attributes.InputCurrent;


		this.fracx = this.Lerp( this.fracx, 6 * input.axis1Side, 0.06 );
		this.fracy = this.Lerp( this.fracy, - 6 * input.axis1Up, 0.06 );
		this.fracz = this.Lerp( this.fracz, - 3 * input.axis1Forward, 0.06 );
		this.fracz = this.Lerp( this.fracz, - 6 * input.space, 0.06 );


		idealOffset.applyQuaternion( this.params.target.Quaternion );
		idealOffset.add( this.params.target.Position );

		return idealOffset;

	}

	Lerp( start, end, amt ) {

		return ( 1 - amt ) * start + amt * end;

	}


	Update( timeElapsed ) {

		//if(timeElapsed > 0.02) console.log(timeElapsed)

		const idealOffset = this.CalculateIdealOffset();

		const t1 = 1.0 - Math.pow( 0.01, timeElapsed );
		const t2 = 1.0 - Math.pow( 0.05, timeElapsed );

		this.currentPosition.lerp( idealOffset, t1 );

		this.currentPosition = idealOffset;

		this.currentPosition.add( this.x.multiplyScalar( this.fracx ) );
		this.currentPosition.add( this.y.multiplyScalar( this.fracy ) );
		this.currentPosition.add( this.z.multiplyScalar( this.fracz ) );


		this.params.camera.position.copy( this.currentPosition );
		this.params.camera.quaternion.slerp( this.params.target.Quaternion, t2 );

	}

}


/*
class ThirdPersonCamera extends entity.Component {

	constructor( params ) {

		super();

		this.params_ = params;
		this.camera_ = params.camera;
	//	this.depthCamera_ = params.depthCamera;

		this.currentPosition_ = new THREE.Vector3();
		this.targetPosition_ = new THREE.Vector3();
		this.predPosition_ = new THREE.Vector3();
		this.lastPlayerPosition_ = new THREE.Vector3();

		this.matrix = new THREE.Matrix4();
		this.x = new THREE.Vector3();
		this.y = new THREE.Vector3();
		this.z = new THREE.Vector3();

		this.fracx = 0;
		this.fracy = 0;
		this.fracz = 0;

		this.minDistance = 3;
		this.maxDistance = 30;

	}

	CalculateIdealOffset() {

		const offsetY = 0;
		const offsetZ = 0;
		const idealOffset = new THREE.Vector3( 0, offsetY, offsetZ );

		const input = this.Parent.Attributes.InputCurrent;


		this.fracx = this._lerp( this.fracx, 0.5 * input.axis1Side, 0.06 );
		this.fracy = this._lerp( this.fracy, - 0.5 * input.axis1Up, 0.06 );
		this.fracz = this._lerp( this.fracz, - 0.5 * input.axis1Forward, 0.06 );
		this.fracz = this._lerp( this.fracz, - 1.0 * input.space, 0.06 );

		idealOffset.applyQuaternion( this.params_.target.Quaternion );
		idealOffset.add( this.params_.target.Position );


		return idealOffset;

	}


	_lerp( start, end, amt ) {

		return ( 1 - amt ) * start + amt * end;

	}


	calculateSpeed() {

		const velocity = new THREE.Vector3();
		velocity.subVectors( this.params_.target.Position, this.prevPosition_ );
		this.prevPosition_.copy( this.params_.target.Position );
		return velocity.length();

	}


	Update( timeElapsed ) {

		if ( ! this.prevPosition_ ) {

		  		this.prevPosition_ = new THREE.Vector3().copy( this.params_.target.Position );

		  		const initialOffset = this.CalculateIdealOffset();
		  		this.camera_.position.copy( initialOffset );
		  		this.camera_.quaternion.copy( this.params_.target.Quaternion );

		  		this.currentPosition_.copy( initialOffset );
		  		return;

		}

		const idealOffset = this.CalculateIdealOffset();
		const speed = this.calculateSpeed();

		const t1 = 1.0 - Math.pow( 0.01, timeElapsed );
		const t2 = 1.0 - Math.pow( 0.05, timeElapsed );

		const predictionOffset = idealOffset.clone();
		this.predPosition_.copy( predictionOffset );

		const dynamicLerpFactor = t1 * speed * 0.905;
		this.currentPosition_.lerp( this.predPosition_, Math.min( dynamicLerpFactor, 1 ) );

		this.currentPosition_ = idealOffset;

		this.currentPosition_.add( this.x.multiplyScalar( this.fracx ) );
		this.currentPosition_.add( this.y.multiplyScalar( this.fracy ) );
		this.currentPosition_.add( this.z.multiplyScalar( this.fracz ) );

		this.camera_.position.copy( this.currentPosition_ );
		this.camera_.quaternion.slerp( this.params_.target.Quaternion, t2 );

	}


}//end class
*/


export default ThirdPersonCamera;



