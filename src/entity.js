import {THREE} from './three-defs.js';


export const entity = (() => {

    class Entity {
        constructor() {
            this.name_ = null;
            this.id_ = null;
            this.components_ = {};
            this.attributes_ = {};

            this._position = new THREE.Vector3();
            this._rotation = new THREE.Quaternion();
            this.handlers_ = {};
            this.parent_ = null;
            this.dead_ = false;
        }

        Destroy() {
            for (let k in this.components_) {
                this.components_[k].Destroy();
            }
            this.components_ = null;
            this.parent_ = null;
            this.handlers_ = null;
        }

        RegisterHandler_(n, h) {
            if (!(n in this.handlers_)) {
                this.handlers_[n] = [];
            }
            this.handlers_[n].push(h);
        }

        SetParent(p) {
            this.parent_ = p;
        }

        SetName(n) {
            this.name_ = n;
        }

        SetId(id) {
            this.id_ = id;
        }

        get Name() {
            return this.name_;
        }

        get ID() {
            return this.id_;
        }

        get Manager() {
            return this.parent_;
        }

        get Attributes() {
            return this.attributes_;
        }

        get IsDead() {
            return this.dead_;
        }

        SetActive(b) {
            this.parent_.SetActive(this, b);
        }

        SetDead() {
            this.dead_ = true;
        }

        AddComponent(c) {
            c.SetParent(this);
            this.components_[c.constructor.name] = c;

            c.InitComponent();
        }

        InitEntity() {
            for (let k in this.components_) {
                this.components_[k].InitEntity();
            }
        }

        GetComponent(n) {
            return this.components_[n];
        }

        FindEntity(n) {
            return this.parent_.Get(n);
        }

        Broadcast(msg) {
            if (this.IsDead) {
                return;
            }
            if (!(msg.topic in this.handlers_)) {
                return;
            }

            for (let curHandler of this.handlers_[msg.topic]) {
                curHandler(msg);
            }
        }

        SetPosition(p) {
            this._position.copy(p);
            this.Broadcast({
                topic: 'update.position',
                value: this._position,
            });
        }

        SetQuaternion(r) {
            this._rotation.copy(r);
            this.Broadcast({
                topic: 'update.rotation',
                value: this._rotation,
            });
        }

        get Position() {
            return this._position;
        }

        get Quaternion() {
            return this._rotation;
        }

        get Forward() {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this._rotation);
            return forward;
        }

        get Up() {
            const forward = new THREE.Vector3(0, 1, 0);
            forward.applyQuaternion(this._rotation);
            return forward;
        }

        Update(timeElapsed, pass) {
            for (let k in this.components_) {
                const c = this.components_[k];
                if (c.Pass == pass) {
                    c.Update(timeElapsed);
                }
            }
        }
    };

    class Component {
        constructor() {
            this.parent_ = null;
            this.pass_ = 0;
        }

        Destroy() {
        }

        SetParent(p) {
            this.parent_ = p;
        }

        SetPass(p) {
            this.pass_ = p;
        }

        get Pass() {
            return this.pass_;
        }

        InitComponent() {}
    
        InitEntity() {}

        GetComponent(n) {
            return this.parent_.GetComponent(n);
        }

        get Manager() {
            return this.parent_.Manager;
        }

        get Parent() {
            return this.parent_;
        }

        FindEntity(n) {
            return this.parent_.FindEntity(n);
        }

        Broadcast(m) {
            this.parent_.Broadcast(m);
        }

        Update(_) {}

        RegisterHandler_(n, h) {
            this.parent_.RegisterHandler_(n, h);
        }
    };

    return {
        Entity: Entity,
        Component: Component,
    };

})();