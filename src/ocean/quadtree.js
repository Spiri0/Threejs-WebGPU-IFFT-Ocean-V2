import {THREE} from '../three-defs.js';


export const quadtree = (() => {

	class Root {
		constructor(params) {
			this._params = params;

			let m = new THREE.Matrix4();
			m.makeRotationX(-Math.PI/2);
			m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, 0));

			this.root = {
				transform: m.clone(),
				quadtree: new QuadTree({
					size: params.size,
					rootSize: params.size,
					min_lod_radius: params.min_lod_radius,
					lod_layers: params.lod_layers,
					min_node_size: params.min_node_size,
					localToWorld: m,
					worldToLocal: m.clone().invert()
				}),
			}
		
			const node = this.root.quadtree.root_;		
		}


		GetChildren() {  
			const children = {
				transform: this.root.transform,
				children: this.root.quadtree.GetChildren()
			}
			return children;
		}


		Insert(pos) {
			this.root.quadtree.Insert(pos);
		}
    
	}



	const LEFT = 0;
	const TOP = 1;
	const RIGHT = 2;
	const BOTTOM = 3;

	const TOP_LEFT = 2;
	const TOP_RIGHT = 3;
	const BOTTOM_LEFT = 0;
	const BOTTOM_RIGHT = 1;


	class Node {
		constructor(params) {
		}

		GetChild(pos) {
			return this.children[pos];
		}

		GetClosestChildrenSharingEdge(edgePoint) {
			if (this.children.length == 0) {
				const edgePointLocal = edgePoint.clone().applyMatrix4(this.tree.worldToLocal);
				if (edgePointLocal.x == this.bounds.min.x || edgePointLocal.x == this.bounds.max.x || edgePointLocal.y == this.bounds.min.y || edgePointLocal.y == this.bounds.max.y) {
					return [this];
				}
				return [];
			}

			const matches = [];
			for (let i = 0; i < this.children.length; ++i) {
				const child = this.children[i];
				matches.push(...child.GetClosestChildrenSharingEdge(edgePoint));
			}
			return matches;
		}


		GetLeftEdgeMidpoint() {
			const v = new THREE.Vector3(this.bounds.min.x, (this.bounds.max.y + this.bounds.min.y) * 0.5, 0);
			v.applyMatrix4(this.localToWorld);
			return v;
		}

		GetRightEdgeMidpoint() {
			const v = new THREE.Vector3(this.bounds.max.x, (this.bounds.max.y + this.bounds.min.y) * 0.5, 0);
			v.applyMatrix4(this.localToWorld);
			return v;
		}

		GetTopEdgeMidpoint() {
			const v = new THREE.Vector3((this.bounds.max.x + this.bounds.min.x) * 0.5, this.bounds.max.y, 0);
			v.applyMatrix4(this.localToWorld);
			return v;
		}

		GetBottomEdgeMidpoint() {
			const v = new THREE.Vector3((this.bounds.max.x + this.bounds.min.x) * 0.5, this.bounds.min.y, 0);
			v.applyMatrix4(this.localToWorld);
			return v;
		}
	}


	class QuadTree {
		constructor(params) {
			const s = params.size;
			const b = new THREE.Box3(
				new THREE.Vector3(-s, -s, 0),
				new THREE.Vector3(s, s, 0)
			);
			this.root_ = new Node();
			this.root_.bounds = b;
			this.root_.newBounds = new THREE.Box3();
			this.root_.children = [];
			this.root_.parent = null;
			this.root_.tree = this;
			this.root_.center = b.getCenter(new THREE.Vector3());
			this.root_.newCenter = b.getCenter(new THREE.Vector3());	
			this.root_.localToWorld = params.localToWorld;
			this.root_.size = b.getSize(new THREE.Vector3());
			this.root_.root = true;


			this._params = params;
			this.worldToLocal = params.worldToLocal;
      
			this.root_.newCenter = this.root_.center.clone();
			this.root_.newCenter.applyMatrix4(this._params.localToWorld);   

			let newsize = this.root_.size.clone();
			newsize.applyMatrix4(this._params.localToWorld);
			newsize = new THREE.Vector3(Math.abs(newsize.x), Math.abs(newsize.y), Math.abs(newsize.z));

			this.root_.newBounds.setFromCenterAndSize(this.root_.newCenter, newsize);
		}

		GetChildren() {
			const children = [];
			this._GetChildren(this.root_, children);
			return children;
		}

		_GetChildren(node, target) {
			if (node.children.length == 0) {
				target.push(node);
				return;
			}
			for (let c of node.children) {
				this._GetChildren(c, target);
			}
		}


		_LODBuckets(minRadius, numLayers){

			const lodRadii = [];
			const lodBuckets = [];
			lodBuckets.push({min: 0, max: minRadius});
			for(let i = 0; i < numLayers; i++){
				lodRadii.push(minRadius * 2 ** i);
				lodBuckets.push({min: minRadius * 2 ** i, max: minRadius * 2 ** (i + 1)});
			}
			return {lodRadii: lodRadii, lodBuckets: lodBuckets};
		}


		_ChildLod(lodRadii, childSize){

			for(let i = 0; i < lodRadii.length; i++){
				if(childSize < lodRadii[i]){
					return i;
				}
			}
			return -1;
		}


		_DetermineLOD(squaredDistance, lodBuckets){

			for(let i = 0; i < lodBuckets.length; i++){
				if(squaredDistance >= lodBuckets[i].min ** 2 && squaredDistance < lodBuckets[i].max ** 2){
					return i;
				}
			}
			return -1;
		}


		//pos = cameraPosition
		Insert(pos) {

			const minRadius = this._params.min_lod_radius;
			const numLayers = this._params.lod_layers;
			const lodBuckets = this._LODBuckets(minRadius, numLayers);
			this._Insert(this.root_, pos, lodBuckets.lodRadii, lodBuckets.lodBuckets);
		}

		_Insert(child, pos, lodRadii, lodBuckets) {
	
			const factor = 2;
			const lodCenter = pos;
			const closestPoint = new THREE.Vector3();
			child.newBounds.clampPoint(lodCenter, closestPoint);
			const squaredDistance = lodCenter.distanceToSquared(closestPoint);
			const currentLOD = this._DetermineLOD(squaredDistance, lodBuckets);
			child.lod = this._ChildLod(lodRadii, child.size.x * factor);
			
			if(currentLOD != -1 && child.size.x >= lodRadii[currentLOD]/factor){
				child.children = this._CreateChildren(child);
				for (let c of child.children) {
					this._Insert(c, pos, lodRadii, lodBuckets);
				}
			}
		}



		_CreateChildren(child) {
			
			const midpoint = child.bounds.getCenter(new THREE.Vector3());
			
			// Bottom left
			const b1 = new THREE.Box3(child.bounds.min, midpoint);
			// Bottom right
			const b2 = new THREE.Box3(
				new THREE.Vector3(midpoint.x, child.bounds.min.y, 0),
				new THREE.Vector3(child.bounds.max.x, midpoint.y, 0)
			);
			
			// Top left
			const b3 = new THREE.Box3(
				new THREE.Vector3(child.bounds.min.x, midpoint.y, 0),
				new THREE.Vector3(midpoint.x, child.bounds.max.y, 0)
			);
			
			// Top right
			const b4 = new THREE.Box3(midpoint, child.bounds.max);
			
			const children = [b1, b2, b3, b4].map(
				b => {
					return {
						bounds: b,
						children: [],
						parent: child,
						center: b.getCenter(new THREE.Vector3()),
						size: b.getSize(new THREE.Vector3()),
						newCenter: null
					};
				}
			);
			
			const nodes = [];
			for (let c of children) {  
				c.newCenter = c.center.clone();
				c.newCenter.applyMatrix4(this._params.localToWorld);
				
				const n = new Node();
				
				const transformedBounds = new THREE.Box3();
				let newsize = c.size.clone();
				newsize.applyMatrix4(this._params.localToWorld);
				newsize = new THREE.Vector3(Math.abs(newsize.x), Math.abs(newsize.y), Math.abs(newsize.z));
				transformedBounds.setFromCenterAndSize(c.newCenter, newsize);
				
				n.bounds = c.bounds;
				n.newBounds = transformedBounds;
				n.children = [];
				n.parent = child;
				n.tree = this;
				n.center = c.center;
				n.newCenter = c.newCenter;
				n.size = c.size;
				n.lod = null;
				n.localToWorld = child.localToWorld;
				nodes.push(n);
			}
			
			return nodes;
		}
	}

	return {
		QuadTree: QuadTree,
		Root: Root,
	}
})();
