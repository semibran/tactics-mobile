import Canvas from "../lib/canvas"
import div from "../lib/div"
import * as icons from "./sprites/icons"
import * as Game from "../lib/game"
import * as Map from "../lib/map"
import * as Cell from "../lib/cell"
import * as Unit from "../lib/unit"
import pathfind from "../lib/pathfind"
import enclose from "../lib/bounds"
import extract from "../lib/img-extract"
import tracePath from "../lib/trace"
import pathlerp from "../lib/pathlerp"

const scale = 2

export function create({ state, actions }, sprites) {
	let view = {
		sprites: sprites,
		element: document.createElement("main"),
		state: {
			time: 0,
			cursor: {
				position: null,
				drag: null
			},
			selection: null,
			viewport: {
				size: [ window.innerWidth / scale, window.innerHeight / scale ],
				position: [ 8, 8 ]
			},
			anims: [],
			cache: {
				box: null,
				elements: {},
				ranges: [],
				cursor: {
					cell: null,
					unit: null
				}
			}
		}
	}
	init(view, state.game, actions)
	return view
}

function init(view, game, actions) {
	let state = view.state
	let map = game.map
	let sprites = view.sprites
	let cursor = state.cursor
	let viewport = state.viewport
	let anims = state.anims
	let cache = state.cache
	let elements = cache.elements

	elements.game = div("game")
	elements.map = renderMap(sprites, map)
	elements.ui = div("ui")

	let unit = map.units[0]
	if (unit) {
		viewport.position[0] = -free(unit.cell[0])
		viewport.position[1] = -free(unit.cell[1])
		updateViewport(view, game)
	}

	elements.shadows = Layer("shadows")
	elements.squares = Layer("squares")
	elements.boxes = Layer("boxes")

	elements.markers = {
		wrap: div("layer markers"),
		arrow: null,
		cursor: null
	}

	elements.pieces = {
		wrap: div("layer pieces"),
		list: [],
		selection: {
			z: 0
		}
	}

	elements.selection = {
		wrap: div("layer selection"),
		piece: null,
		z: 0
	}

	for (let unit of map.units) {
		let x = unit.cell[0] * 16
		let y = unit.cell[1] * 16
		let piece = sprites.Piece(unit.type, unit.faction)
		piece.className = "piece"
		piece.style.left = x + "px"
		piece.style.top = y - 1 + "px"
		elements.pieces.wrap.appendChild(piece)
		elements.pieces.list.push(piece)

		let shadow = extract(sprites.pieces.shadow)
		shadow.className = "shadow"
		shadow.style.left = x + 1 + "px"
		shadow.style.top = y + 3 + "px"
		elements.shadows.wrap.appendChild(shadow)
		elements.shadows.list.push(shadow)
	}

	elements.game.appendChild(elements.map)
	elements.game.appendChild(elements.squares.wrap)
	elements.game.appendChild(elements.shadows.wrap)
	elements.game.appendChild(elements.pieces.wrap)
	elements.game.appendChild(elements.markers.wrap)
	elements.game.appendChild(elements.selection.wrap)
	elements.ui.appendChild(elements.boxes.wrap)

	view.element.appendChild(elements.game)
	view.element.appendChild(elements.ui)

	loop()

	function loop() {
		update(view, game)
		requestAnimationFrame(loop)
	}

	view.element.addEventListener("touchstart", event => {
		let position = cursor.position = normalize(event)
		let cell = cursor.cell = contextualize(cursor.position).map(snap)
		let unit = Map.unitAt(map, cell)
		if (unit) {
			// piece dragging
			let index = map.units.indexOf(unit)
			let piece = elements.pieces.list[index]
			if (!state.selection && !anims.length) {
				// select unit
				state.selection = {
					unit: unit,
					time: state.time
				}
				cursor.drag = [
					parseInt(piece.style.left) - position[0],
					parseInt(piece.style.top) - position[1]
				]
			} else if (unit !== state.selection.unit) {
				// deselect, since a unit is already selected
				state.selection = null
			}
		} else {
			if (state.selection) {
				let unit = state.selection.unit
				let index = map.units.indexOf(unit)
				let range = cache.ranges[index]
				let piece = elements.pieces.list[index]
				if (Cell.search(range.move, cell) === -1) {
					state.selection = null
				} else {
					cursor.drag = [
						cell[0] * 16 - position[0],
						cell[1] * 16 - position[1]
					]
				}
			}
			if (!state.selection) {
				// begin viewport pan
				cursor.drag = [
					viewport.position[0] - position[0],
					viewport.position[1] - position[1]
				]
			}
		}
		// console.log("touchstart", cursor.position, cursor.cell)
	})

	view.element.addEventListener("touchmove", event => {
		event.preventDefault()
		cursor.position = normalize(event)
		cursor.cell = contextualize(cursor.position).map(snap)
		// console.log("touchmove", cursor.position, cursor.cell)
	})

	view.element.addEventListener("touchend", event => {
		cursor.position = normalize(event)
		cursor.cell = contextualize(cursor.position).map(snap)
		cursor.drag = null
		if (state.selection) {
			let unit = state.selection.unit
			let path = state.path
			if (path && path.length) {
				let dest = path[path.length - 1]
				let target = Map.unitAt(map, cursor.cell)
				if (!target && Cell.equals(cursor.cell, dest)) {
					move(unit, path)
				}
				if (unit !== target) {
					state.selection = null
				}
			} else if (elements.selection.piece) {
				let ghost = elements.selection.piece
				elements.selection.piece = null
				elements.selection.wrap.removeChild(ghost)
				elements.shadows.wrap.removeChild(elements.shadows.list.pop())
			}
		}
		// console.log("touchend", cursor.position, cursor.cell)
	})

	window.addEventListener("resize", event => {
		viewport.size[0] = window.innerWidth / scale
		viewport.size[1] = window.innerHeight / scale
		console.log(viewport.size)
	})

	window.addEventListener("contextmenu", event => {
		event.preventDefault()
		return false
	})

	function move(unit, path) {
		let index = map.units.indexOf(unit)
		cache.ranges.length = 0
		state.path = null
		unit.cell = path[path.length - 1].slice()
		anims.push({
			type: "move",
			unit: unit,
			path: path,
			time: state.time
		})
	}

	function normalize(event) {
		let touch = event.changedTouches[0]
		return [ touch.pageX / scale, touch.pageY / scale ]
	}

	function contextualize(position) {
		let rect = elements.game.getBoundingClientRect()
		return [
			position[0] - rect.left / scale,
			position[1] - rect.top / scale
		]
	}
}

export function update(view, game) {
	let map = game.map
	let sprites = view.sprites
	let state = view.state
	let cursor = state.cursor
	let viewport = state.viewport
	let cache = state.cache
	let anims = state.anims
	let elements = cache.elements
	let time = ++state.time

	// respond to changes in selection
	if (!cache.selection && state.selection
	|| cache.selection && !state.selection
	|| state.selection && cache.selection !== state.selection.unit
	) {
		if (cache.selection) {
			// deselect old unit
			let unit = cache.selection
			let index = map.units.indexOf(unit)
			let x = unit.cell[0] * 16
			let y = unit.cell[1] * 16

			// remove ghost
			if (elements.selection.piece) {
				let ghost = elements.selection.piece
				elements.selection.piece = null
				elements.selection.z = 0
				elements.selection.wrap.removeChild(ghost)
				elements.shadows.wrap.removeChild(elements.shadows.list.pop())
			}


			if (!anims.length) {
				let shadow = elements.shadows.list[index]
				shadow.style.left = x + 1 + "px"
				shadow.style.top = y + 3 + "px"

				let piece = elements.pieces.list[index]
				piece.style.left = x + "px"
				piece.style.top = y - 1 + "px"
				elements.pieces.wrap.appendChild(piece)
			}

			// remove squares
			for (let square of elements.squares.list) {
				elements.squares.wrap.removeChild(square)
			}
			elements.squares.list.length = 0

			let cursor = elements.markers.cursor
			if (cursor) {
				elements.markers.wrap.removeChild(cursor.element)
				elements.markers.cursor = null
			}

			if (!anims.length) {
				let arrow = elements.markers.arrow
				if (arrow) {
					elements.markers.wrap.removeChild(arrow)
					elements.markers.arrow = null
				}
			}
		}

		if (state.selection) {
			// select new unit
			let unit = state.selection.unit
			let index = map.units.indexOf(unit)
			let piece = elements.pieces.list[index]
			elements.selection.wrap.appendChild(piece)

			let range = cache.ranges[index]
			if (!range) {
				range = cache.ranges[index] = Map.range(map, unit)
			}

			let cells = Array.prototype.concat(range.move, range.attack)
			let bounds = enclose(cells)
			let context = Canvas(bounds.width * 16, bounds.height * 16)

			for (let cell of range.move) {
				if (Cell.equals(cell, unit.cell)) continue
				let x = (cell[0] - bounds.left) * 16
				let y = (cell[1] - bounds.top) * 16
				context.drawImage(sprites.ui.squares.move, x, y)
			}

			for (let cell of range.attack) {
				if (Cell.search(range.move, cell) !== -1) continue
				let x = (cell[0] - bounds.left) * 16
				let y = (cell[1] - bounds.top) * 16
				context.drawImage(sprites.ui.squares.attack, x, y)
			}

			context.canvas.className = "range"
			context.canvas.style.left = bounds.left * 16 + "px"
			context.canvas.style.top = bounds.top * 16 + "px"
			elements.squares.wrap.appendChild(context.canvas)
			elements.squares.list.push(context.canvas)
			cache.selection = unit
		} else {
			cache.selection = null
		}

		if (cache.box) {
			cache.box.exiting = true
		}
	}

	if (state.selection) {
		let selection = state.selection
		let unit = selection.unit
		let index = map.units.indexOf(unit)
		let piece = elements.pieces.list[index]
		let z = time - selection.time
		if (z > 6) {
			let p = (z - 6) % 120 / 120
			z = Math.round(6 + Math.sin(2 * Math.PI * p) * 2)
		}

		piece.style.left = unit.cell[0] * 16 + "px"
		piece.style.top = unit.cell[1] * 16 - z + "px"

		if (!cache.box) {
			let textbox = sprites.ui.Box(unit.name.length * 8 + 12 + 16, 8 + 16)
			let text = sprites.ui.Text(unit.name)
			let icon = sprites.icons[icons.units[unit.type]]
			let context = textbox.getContext("2d")
			context.drawImage(icon, 8, 8)
			context.drawImage(text, 20, 8)
			textbox.className = "box"

			let box = {
				position: [ -textbox.width, viewport.size[1] - textbox.height - 8 ],
				element: textbox,
				exiting: false
			}

			elements.boxes.wrap.appendChild(box.element)
			elements.boxes.list.push(box.element)
			cache.box = box
		}

		if (cursor.drag) {
			if (!elements.selection.piece) {
				let piece = elements.pieces.list[index]
				let ghost = extract(piece)
				ghost.className = "ghost piece"
				ghost.style.display = "none"
				elements.selection.piece = ghost
				elements.selection.wrap.appendChild(ghost)

				let shadow = extract(sprites.pieces.shadow)
				shadow.className = "ghost shadow"
				elements.shadows.list.push(shadow)
				elements.shadows.wrap.appendChild(shadow)
			}

			let x = cursor.drag[0] + cursor.position[0]
			let y = cursor.drag[1] + cursor.position[1]
			let ghost = elements.selection.piece
			let shadow = elements.shadows.list[elements.shadows.list.length - 1]
			elements.selection.z += (12 - elements.selection.z) / 4
			if (!Cell.equals(cursor.cell, unit.cell)) {
				let z = elements.selection.z
				ghost.style.left = x + "px"
				ghost.style.top = y - z + "px"
				ghost.style.display = "block"
				shadow.style.left = x + 1 + "px"
				shadow.style.top = y + 4 + "px"
				shadow.style.display = "block"
			} else {
				ghost.style.display = "none"
				shadow.style.display = "none"
			}
		}
	}

	if (cache.box) {
		let box = cache.box
		updateBox(box)
		if (box.position[0] < -box.element.width - 16 * 15) {
			elements.boxes.wrap.removeChild(box.element)
			elements.boxes.list.splice(elements.boxes.list.indexOf(box.element), 1)
			cache.box = null
		}
	}

	updateViewport(view, game)
	updateCursor(view, game)

	if (cursor.drag) {
		let x = cursor.drag[0] + cursor.position[0]
		let y = cursor.drag[1] + cursor.position[1]
		if (!state.selection) {
			// no unit selected; pan with cursor
			viewport.position[0] = x
			viewport.position[1] = y
		}
	}

	let anim = anims[0]
	if (anim) {
		let elapsed = time - anim.time
		let path = anim.path
		let t = elapsed / path.length / 2
		let cell = pathlerp(path, t)
		let x = cell[0] * 16
		let y = cell[1] * 16
		let index = map.units.indexOf(anim.unit)

		let piece = elements.pieces.list[index]
		piece.style.left = x + "px"
		piece.style.top = y + "px"

		let shadow = elements.shadows.list[index]
		shadow.style.left = x + 1 + "px"
		shadow.style.top = y + 4 + "px"

		let arrow = elements.markers.arrow
		if (arrow) {
			if (arrow.style.display === "block") {
				arrow.style.display = "none"
			} else {
				arrow.style.display = "block"
			}
		}

		if (t === 1) {
			anims.shift()
			elements.pieces.wrap.appendChild(piece)
			elements.markers.wrap.removeChild(arrow)
			elements.markers.arrow = null
		}
	}
}

function updateCursor(view, game) {
	if (!view.state.selection) return
	let state = view.state
	let unit = state.selection.unit
	let cursor = state.cursor
	let map = game.map
	let index = map.units.indexOf(unit)
	let sprites = view.sprites
	let cache = state.cache
	let range = cache.ranges[index]
	let elements = cache.elements
	if (elements.markers.cursor && state.path && state.path.length) {
		let path = state.path
		let cell = path[path.length - 1]
		let x = cell[0] * 16
		let y = cell[1] * 16
		let { element, position } = elements.markers.cursor
		position[0] += (x - position[0]) / 4
		position[1] += (y - position[1]) / 4
		element.style.left = position[0] + "px"
		element.style.top = position[1] + "px"
	}
	if (cache.cursor.cell && Cell.equals(cache.cursor.cell, cursor.cell)) {
		return
	}
	cache.cursor.cell = cursor.cell
	let path = state.path = tracePath(map, unit, cursor.cell, range, state.path)
	if (path.length) {
		if (path.length > 1) {
			let bounds = enclose(path)
			let sprite = sprites.ui.Arrow(path)
			let arrow = elements.markers.arrow
			if (!arrow) {
				arrow = sprite
				arrow.className = "arrow"
				elements.markers.arrow = arrow
				elements.markers.wrap.appendChild(arrow)
			} else {
				let context = arrow.getContext("2d")
				arrow.width = sprite.width
				arrow.height = sprite.height
				context.drawImage(sprite, 0, 0)
			}
			arrow.style.left = bounds.left * 16 + "px"
			arrow.style.top = bounds.top * 16 + "px"
		} else if (path.length === 1) {
			let arrow = elements.markers.arrow
			if (arrow) {
				elements.markers.arrow = null
				elements.markers.wrap.removeChild(arrow)
			}
		}
		let cell = path[path.length - 1]
		let x = cell[0] * 16
		let y = cell[1] * 16
		if (!elements.markers.cursor) {
			let element = extract(sprites.ui.cursor[0])
			let position = [ x, y ]
			element.className = "cursor"
			element.style.left = x + "px"
			element.style.top = y + "px"
			elements.markers.wrap.appendChild(element)
			elements.markers.cursor = { element, position }
		}
	} else {
		// cursor is out of range
		state.path = null
		let cursor = elements.markers.cursor
		if (cursor) {
			elements.markers.cursor = null
			elements.markers.wrap.removeChild(cursor.element)
		}
		let arrow = elements.markers.arrow
		if (arrow) {
			elements.markers.arrow = null
			elements.markers.wrap.removeChild(arrow)
		}
	}
}

function updateBox(box) {
	if (!box.exiting) {
		box.position[0] += (8 - box.position[0]) / 4
	} else {
		box.position[0] -= 24
	}
	let element = box.element
	element.style.left = Math.round(box.position[0]) + "px"
	element.style.top = Math.round(box.position[1]) + "px"
}

function updateViewport(view, game) {
	let viewport = view.state.viewport
	let elements = view.state.cache.elements
	let diff = [
		game.map.layout.size[0] * 16 - viewport.size[0],
		game.map.layout.size[1] * 16 - viewport.size[1]
	]
	if (diff[0] >= 0 && diff[1] >= 0) {
		if (viewport.position[0] > -viewport.size[0] / 2) {
			viewport.position[0] = -viewport.size[0] / 2
		} else if (viewport.position[0] + viewport.size[0] / 2 < -diff[0]) {
			viewport.position[0] = -diff[0] - viewport.size[0] / 2
		}
		if (viewport.position[1] > -viewport.size[1] / 2) {
			viewport.position[1] = -viewport.size[1] / 2
		} else if (viewport.position[1] + viewport.size[1] / 2 < -diff[1]) {
			viewport.position[1] = -diff[1] - viewport.size[1] / 2
		}
	}
	let x = viewport.position[0]
	let y = viewport.position[1]
	elements.game.style.transform = `translate(${x}px, ${y}px)`
}

function renderMap(sprites, map) {
	let width = map.layout.size[0] * 16;
	let height = map.layout.size[1] * 16;
	let context = Canvas(width, height)
	context.canvas.className = "map"
	for (let y = 0; y < map.layout.size[1]; y++) {
		for (let x = 0; x < map.layout.size[0]; x++) {
			context.drawImage(sprites.tiles.grass, x * 16, y * 16)
		}
	}
	return context.canvas
}

function Layer(name) {
	return {
		wrap: div("layer " + name),
		list: []
	}
}

function snap(x) {
	return Math.floor(x / 16)
}

function free(col) {
	return col * 16 + 8
}

function contextualize(element, position) {
	let rect = element.getBoundingClientRect()
	return [
		position[0] - rect.left / scale,
		position[1] - rect.top / scale
	]
}
