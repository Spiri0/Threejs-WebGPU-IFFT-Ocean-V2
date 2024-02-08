import {THREE} from '../three-defs.js';


export const ocean_chunk = (() => {

	class OceanChunk {
		constructor(params) {
			this.params_ = params;
			this.Init(params);
		}
    
		Destroy() {
    		this.params_.group.remove(this.mesh_);
    	}

    	Hide() {
    		this.mesh_.visible = false;
    	}

    	Show() {
    		this.mesh_.visible = true;
    	}

    	Init(params) {
    		this.geometry_ = new THREE.BufferGeometry();
			this.mesh_ = new THREE.Mesh(this.geometry_, params.material);

			//bigger boundingSphere for frustum because waves can move the mesh out of the frustum
			const localToWorld = params.transform;
			const boundingSphereCenter = new THREE.Vector3(params.offset.x, params.offset.y);
			boundingSphereCenter.applyMatrix4(localToWorld);
			let boundingSphere = null;
			if(params.lod > 3){
				boundingSphere = new THREE.Sphere(boundingSphereCenter, params.width * 1.75);
			}
			else{
				boundingSphere = new THREE.Sphere(boundingSphereCenter, params.width * 3);
			}
			
			this.mesh_.geometry.boundingSphere = boundingSphere;
			this.mesh_.geometry.computeBoundingSphere();

    		this.mesh_.castShadow = false;
			this.mesh_.layers.set(params.layer);
    		this.mesh_.receiveShadow = true;
    		this.params_.group.add(this.mesh_);
    		this.Reinit(params);     
    	}

    	Update() {

    	}

    	Reinit(params) {
    		this.params_ = params;
    		this.mesh_.position.set(0, 0, 0);
    	}

		SetWireframe(b) {
			this.mesh_.material.wireframe = b;
		}


		RebuildMeshFromData(data) {
			this.geometry_.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
			this.geometry_.setAttribute('vindex', new THREE.Int32BufferAttribute(data.vindices, 1));
			this.geometry_.setAttribute('width', new THREE.Float32BufferAttribute(data.width, 1));
			this.geometry_.setAttribute('lod', new THREE.Int32BufferAttribute(data.lod, 1));
			this.geometry_.setIndex(new THREE.BufferAttribute(data.indices, 1));
      
			this.geometry_.attributes.position.needsUpdate = true;
			this.geometry_.attributes.vindex.needsUpdate = true;
			this.geometry_.attributes.width.needsUpdate = true;
			this.geometry_.attributes.lod.needsUpdate = true;

		}
	}

	return {
    	OceanChunk: OceanChunk
	}
})();

