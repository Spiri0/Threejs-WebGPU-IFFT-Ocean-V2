import {entity} from "./entity.js";


class PlayerInput extends entity.Component {

	constructor( params ) {

		super();
		this.params_ = params;

	}

	InitEntity() {

		this.Parent.Attributes.InputCurrent = {
			axis1Forward: 0.0,
			axis1Side: 0.0,
			axis1Up: 0.0,
			axis1Roll: 0.0,
			space: 0.0,
		};
		this.Parent.Attributes.InputPrevious = {
			...this.Parent.Attributes.InputCurrent
		};

		document.addEventListener( 'keydown', ( e ) => this.OnKeyDown_( e ), false );
		document.addEventListener( 'keyup', ( e ) => this.OnKeyUp_( e ), false );

	}

	OnKeyDown_( event ) {

		if ( event.currentTarget.activeElement != document.body ) {

			return;

		}

		switch ( event.keyCode ) {

			case 87: // w
				this.Parent.Attributes.InputCurrent.axis1Forward = - 1.0;
				break;
			case 65: // a
				this.Parent.Attributes.InputCurrent.axis1Side = - 1.0;
				break;
			case 83: // s
				this.Parent.Attributes.InputCurrent.axis1Forward = 1.0;
				break;
			case 68: // d
				this.Parent.Attributes.InputCurrent.axis1Side = 1.0;
				break;
			case 38: // PG_UP
			event.preventDefault();
				this.Parent.Attributes.InputCurrent.axis1Up = 1.0;
				break;
			case 40: // PG_UP
			event.preventDefault();
				this.Parent.Attributes.InputCurrent.axis1Up = - 1.0;
				break;
			case 39: // PG_Right
			event.preventDefault();
				this.Parent.Attributes.InputCurrent.axis1Roll = 1.0;
				break;
			case 37: // PG_Left
			event.preventDefault();
				this.Parent.Attributes.InputCurrent.axis1Roll = - 1.0;
				break;
			case 32: // Space
			event.preventDefault();
				this.Parent.Attributes.InputCurrent.space = - 1.0;
				break;

		}

	}

	OnKeyUp_( event ) {

		if ( event.currentTarget.activeElement != document.body ) {

			return;

		}

		switch ( event.keyCode ) {

			case 87: // w
				this.Parent.Attributes.InputCurrent.axis1Forward = 0.0;
				break;
			case 65: // a
				this.Parent.Attributes.InputCurrent.axis1Side = 0.0;
				break;
			case 83: // s
				this.Parent.Attributes.InputCurrent.axis1Forward = 0.0;
				break;
			case 68: // d
				this.Parent.Attributes.InputCurrent.axis1Side = 0.0;
				break;
			case 38: // PG_UP
				this.Parent.Attributes.InputCurrent.axis1Up = 0.0;
				break;
			case 40: // PG_UP
				this.Parent.Attributes.InputCurrent.axis1Up = 0.0;
				break;
			case 39: // PG_Right
				this.Parent.Attributes.InputCurrent.axis1Roll = 0.0;
				break;
			case 37: // PG_Left
				this.Parent.Attributes.InputCurrent.axis1Roll = 0.0;
				break;
			case 32: // Space
			event.preventDefault();
				this.Parent.Attributes.InputCurrent.space = 0.0;
				break;

		}

	}

	Update( _ ) {

		this.Parent.Attributes.InputPrevious = {
			...this.Parent.Attributes.InputCurrent };

	}

}


export default PlayerInput;
