import loadImage from "img-load"
import normalize from "./sprites"
import * as maps from "./maps"
import * as View from "./view"
import * as Game from "../lib/game"
import * as Unit from "../lib/unit"

loadImage("sprites.png").then(main)

let map = maps.test
let game = Game.create(map)
let state = { game }
let actions = {
	game: {
		move(state, unit, cell) {
			Unit.move(unit, cell)
		},
		attack(state, unit, target) {
			Unit.attack(unit, target)
		}
	}
}

function main(spritesheet) {
	let sprites = normalize(spritesheet)
	let app = { state, actions }
	let view = View.create(app, sprites)
	document.body.appendChild(view.element)
}
