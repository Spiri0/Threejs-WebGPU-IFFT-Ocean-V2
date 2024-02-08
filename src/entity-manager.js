export const entity_manager = (() => {

    class EntityManager {
        constructor() {
            this.ids_ = 0;
            this.entitiesMap_ = {};
            this.entities_ = [];
        }
  
        _GenerateName() {
            return '__name__' + this.ids_;
        }
  
        Get(n) {
            return this.entitiesMap_[n];
        }
  
        Filter(cb) {
            return this.entities_.filter(cb);
        }
  
        Add(e, n) {
            this.ids_ += 1;
  
            if (!n) {
                n = this._GenerateName();
            }
  
            this.entitiesMap_[n] = e;
            this.entities_.push(e);
  
            e.SetParent(this);
            e.SetName(n);
            e.SetId(this.ids_);
            e.InitEntity();
        }
  
        SetActive(e, b) {
            const i = this.entities_.indexOf(e);
  
            if (!b) {
                if (i < 0) {
                    return;
                }
    
                this.entities_.splice(i, 1);
            } else {
                if (i >= 0) {
                    return;
                }
  
                this.entities_.push(e);
            }
        }
  
        Update(timeElapsed, pass) {
            const dead = [];
            const alive = [];
            for (let i = 0; i < this.entities_.length; ++i) {
                const e = this.entities_[i];
  
                e.Update(timeElapsed, pass);
  
                if (e.dead_) {
                    dead.push(e);
                } else {
                    alive.push(e);
                }
            }
  
            for (let i = 0; i < dead.length; ++i) {
                const e = dead[i];
  
                delete this.entitiesMap_[e.Name];
    
                e.Destroy();
            }
  
            this.entities_ = alive;
        }
    }
  
    return {
        EntityManager: EntityManager
    };
  
})();