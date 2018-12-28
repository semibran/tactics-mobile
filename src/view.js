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
				pos: null,
				drag: null
			},
			viewport: {
				size: [ window.innerWidth / scale, window.innerHeight / scale ],
				pos: [ 0, 0 ],
				dest: null
			},
			modes: [],
			anims: [],
			cache: {
				box: null,
				layers: {},
				ranges: [],
				modes: [],
				units: [],
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
	let modes = state.modes
	let anims = state.anims
	let cache = state.cache
	let layers = cache.layers

	layers.game = div("game")
	layers.map = renderMap(sprites, map)
	layers.ui = div("ui")

	let unit = map.units[0]
	if (unit) {
		let x = -free(unit.cell[0])
		let y = -free(unit.cell[1])
		viewport.pos = [ x, y ]
		updateViewport(view, game)
	}

	layers.shadows = Layer("shadows")
	layers.squares = Layer("squares")
	layers.boxes = Layer("boxes")
	layers.buttons = Layer("buttons")

	layers.markers = {
		wrap: div("layer markers"),
		arrow: null,
		cursor: null
	}

	layers.pieces = {
		wrap: div("layer pieces"),
		list: [],
		selection: {
			z: 0
		}
	}

	layers.selection = {
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
		layers.pieces.wrap.appendChild(piece)
		layers.pieces.list.push(piece)

		let shadow = extract(sprites.pieces.shadow)
		shadow.className = "shadow"
		shadow.style.left = x + 1 + "px"
		shadow.style.top = y + 3 + "px"
		layers.shadows.wrap.appendChild(shadow)
		layers.shadows.list.push(shadow)
	}

	layers.game.appendChild(layers.map)
	layers.game.appendChild(layers.squares.wrap)
	layers.game.appendChild(layers.shadows.wrap)
	layers.game.appendChild(layers.pieces.wrap)
	layers.game.appendChild(layers.markers.wrap)
	layers.game.appendChild(layers.buttons.wrap)
	layers.game.appendChild(layers.selection.wrap)
	layers.ui.appendChild(layers.boxes.wrap)

	view.element.appendChild(layers.game)
	view.element.appendChild(layers.ui)

	loop()

	function loop() {
		update(view, game)
		requestAnimationFrame(loop)
	}

	view.element.addEventListener("touchstart", event => {
		// event.preventDefault()
		let pos = cursor.pos = normalize(event)
		let cell = cursor.cell = contextualize(cursor.pos).map(snap)
		let unit = Map.unitAt(map, cell)
		let index = map.units.indexOf(unit)
		let piece = layers.pieces.list[index]
		let mode = modes[0]
		if (!mode) {
			if (unit) {
				let range = cache.ranges[index]
				if (!range) {
					range = cache.ranges[index] = Map.range(map, unit)
				}
				modes.push({
					type: "move",
					unit: unit,
					path: [ cell ],
					range: range,
					time: state.time
				})
				let x = -free(unit.cell[0])
				let y = -free(unit.cell[1])
				viewport.dest = [ x, y ]
				cursor.drag = [
					parseInt(piece.style.left) - pos[0] + viewport.pos[0],
					parseInt(piece.style.top) - pos[1] + viewport.pos[1]
				]
			} else {
				// begin viewport pan
				viewport.dest = null
				cursor.drag = [
					viewport.pos[0] - pos[0],
					viewport.pos[1] - pos[1]
				]
			}
		} else if (mode && mode.type === "move") {
			if (unit) {
				if (unit !== mode.unit) {
					// deselect, since a unit is already selected
					modes.length = 0
					layers.pieces.wrap.appendChild(piece)
					viewport.dest = null
				}
			} else {
				let unit = mode.unit
				let index = map.units.indexOf(unit)
				let range = cache.ranges[index]
				let piece = layers.pieces.list[index]
				if (Cell.search(range.move, cell) === -1) {
					modes.shift()
				} else {
					cursor.drag = [
						cell[0] * 16 - pos[0] + viewport.pos[0],
						cell[1] * 16 - pos[1] + viewport.pos[1]
					]
				}
			}
		} else if (mode && mode.type === "act") {
			let selection = null
			for (let button of mode.buttons) {
				let rect = button.el.getBoundingClientRect()
				let r = rect.width / 2
				let x = rect.left + r
				let y = rect.top + r
				let dx = Math.pow(x - cursor.pos[0] * scale, 2)
				let dy = Math.pow(y - cursor.pos[1] * scale, 2)
				if (dx + dy < r * r) {
					selection = button
					break
				}
			}
			let unit = mode.unit
			if (!selection || selection.id === "back") {
				unit.cell = cache.src
			}
			let index = map.units.indexOf(unit)
			let piece = layers.selection.wrap.children[0]
			let shadow = layers.shadows.wrap.children[index]
			let x = unit.cell[0] * 16
			let y = unit.cell[1] * 16
			piece.style.left = x + "px"
			piece.style.top = y - 1 + "px"
			shadow.style.left = x + 1 + "px"
			shadow.style.top = y + 4 + "px"
			viewport.dest = [ -free(unit.cell[0]), -free(unit.cell[1]) ]
			modes.length = 0
		}
	})

	view.element.addEventListener("touchmove", event => {
		event.preventDefault()
		cursor.pos = normalize(event)
		cursor.cell = contextualize(cursor.pos).map(snap)
	})

	view.element.addEventListener("touchend", event => {
		// event.preventDefault()
		cursor.pos = normalize(event)
		cursor.cell = contextualize(cursor.pos).map(snap)
		cursor.drag = null
		let mode = modes[0]
		if (mode && mode.type === "move") {
			let unit = mode.unit
			let path = mode.path
			if (path && path.length) {
				let dest = path[path.length - 1]
				let target = Map.unitAt(map, cursor.cell)
				if (!target && Cell.equals(cursor.cell, dest)) {
					move(unit, path)
				}
			} else if (layers.selection.ghost) {
				let ghost = layers.selection.ghost
				layers.selection.ghost = null
				layers.selection.wrap.removeChild(ghost.el)
				layers.shadows.wrap.removeChild(ghost.shadow)
			}
		}
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
		cache.src = unit.cell
		unit.cell = path[path.length - 1].slice()
		modes.unshift({
			type: "moving",
			unit: unit,
			path: path,
			time: state.time
		})
		viewport.dest = [
			-free(unit.cell[0]),
			-free(unit.cell[1])
		]
	}

	function normalize(event) {
		let touch = event.touches[0] || event.changedTouches[0]
		return [ touch.pageX / scale, touch.pageY / scale ]
	}

	function contextualize(pos) {
		let rect = layers.game.getBoundingClientRect()
		return [
			pos[0] - rect.left / scale,
			pos[1] - rect.top / scale
		]
	}
}

export function update(view, game) {
	let map = game.map
	let sprites = view.sprites
	let state = view.state
	let cursor = state.cursor
	let viewport = state.viewport
	let screens = state.screens
	let modes = state.modes
	let anims = state.anims
	let cache = state.cache
	let layers = cache.layers
	let time = ++state.time
	let mode = modes[0]

	// respond to mode transitions
	if (cache.modes.length !== modes.length) {
		let prev = cache.modes[0]
		let next = modes[0]
		cache.modes = modes.slice()

		if (prev && prev.type === "move") {
			// remove movement elements: range, arrow, ghost, cursor
			let ghost = layers.selection.ghost
			if (ghost) {
				layers.selection.ghost = null
				layers.selection.wrap.removeChild(ghost.el)
				layers.shadows.wrap.removeChild(ghost.shadow)
			}

			for (let square of layers.squares.list) {
				layers.squares.wrap.removeChild(square)
			}
			layers.squares.list.length = 0

			let cursor = layers.markers.cursor
			if (cursor) {
				layers.markers.wrap.removeChild(cursor.el)
				layers.markers.cursor = null
			}

			if (!next || next.type !== "moving") {
				let arrow = layers.markers.arrow
				if (arrow) {
					layers.markers.wrap.removeChild(arrow)
					layers.markers.arrow = null
				}
				cache.cursor.cell = null
			}

			let unit = prev.unit
			let index = map.units.indexOf(unit)
			let piece = layers.pieces.list[index]
			let x = unit.cell[0] * 16
			let y = unit.cell[1] * 16 - 1
			piece.style.left = x + "px"
			piece.style.top = y + "px"
		}

		if (prev && prev.type === "act") {
			let index = map.units.indexOf(prev.unit)
			let piece = layers.pieces.list[index]
			layers.pieces.wrap.appendChild(piece)
			cache.src = null
			for (let button of prev.buttons) {
				layers.buttons.wrap.removeChild(button.el)
			}
		}

		if (next && next.type === "move") {
			let unit = next.unit
			let index = map.units.indexOf(unit)
			let piece = layers.pieces.list[index]
			layers.selection.wrap.appendChild(piece)

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
			layers.squares.wrap.appendChild(context.canvas)
			layers.squares.list.push(context.canvas)
		}

		if (next && next.type === "act") {
			let unit = next.unit
			let options = next.options
			for (let i = 0; i < options.length; i++) {
				let option = options[i]
				let icon = null
				if (option === "attack") icon = sprites.icons.sword
				if (option === "wait") icon = sprites.icons.checkmark
				if (option === "back") icon = sprites.icons.arrow
				let sprite = sprites.ui.Button(icon)
				sprite.style.display = "none"
				let button = { id: option, el: sprite }
				layers.buttons.wrap.appendChild(sprite)
				next.buttons.push(button)

				// layers.ring.wrap.appendChild()
			}
		}
	}

	if (mode && mode.unit) {
		let unit = mode.unit
		if (!cache.box) {
			let textbox = sprites.ui.Box(unit.name.length * 8 + 12 + 16, 8 + 16)
			let text = sprites.ui.Text(unit.name)
			let icon = sprites.icons[icons.units[unit.type]]
			let context = textbox.getContext("2d")
			context.drawImage(icon, 8, 8)
			context.drawImage(text, 20, 8)
			textbox.className = "box"

			let box = {
				pos: [ -textbox.width, viewport.size[1] - textbox.height - 8 ],
				element: textbox,
				exiting: false
			}

			layers.boxes.wrap.appendChild(box.element)
			layers.boxes.list.push(box.element)
			cache.box = box
		}
	} else if (cache.box) {
		cache.box.exiting = true
	}

	if (mode) {
		if (mode.type === "move" || mode.type === "act") {
			let unit = mode.unit
			let index = map.units.indexOf(unit)
			let piece = layers.pieces.list[index]
			let z = time - mode.time
			if (z > 6) {
				let p = (z - 6) % 120 / 120
				z = Math.round(6 + Math.sin(2 * Math.PI * p) * 2)
			}
			piece.style.left = unit.cell[0] * 16 + "px"
			piece.style.top = unit.cell[1] * 16 - z + "px"
		}

		if (mode.type === "move") {
			let unit = mode.unit
			let index = map.units.indexOf(unit)
			let piece = layers.pieces.list[index]
			if (cursor.drag && mode.type === "move") {
				if (!layers.selection.ghost) {
					let ghost = extract(piece)
					ghost.className = "ghost piece"
					ghost.style.display = "none"

					let shadow = extract(sprites.pieces.shadow)
					shadow.className = "ghost shadow"

					layers.shadows.wrap.appendChild(shadow)
					layers.selection.wrap.appendChild(ghost)
					layers.selection.ghost = {
						el: ghost,
						shadow: shadow
					}
				}

				let x = cursor.drag[0] + cursor.pos[0] - viewport.pos[0]
				let y = cursor.drag[1] + cursor.pos[1] - viewport.pos[1]
				let ghost = layers.selection.ghost.el
				let shadow = layers.selection.ghost.shadow
				if (!Cell.equals(cursor.cell, unit.cell)) {
					ghost.style.left = x + "px"
					ghost.style.top = y - 12 + "px"
					ghost.style.display = "block"
					shadow.style.left = x + 1 + "px"
					shadow.style.top = y + 4 + "px"
					shadow.style.display = "block"
				} else {
					ghost.style.display = "none"
					shadow.style.display = "none"
				}
			}
		} else if (mode.type === "moving") {
			let unit = mode.unit
			let path = mode.path
			let elapsed = time - mode.time
			let t = elapsed / path.length / 2
			let cell = pathlerp(path, t)
			let x = cell[0] * 16
			let y = cell[1] * 16
			let index = map.units.indexOf(unit)

			let piece = layers.pieces.list[index]
			piece.style.left = x + "px"
			piece.style.top = y - 1 + "px"

			let shadow = layers.shadows.list[index]
			shadow.style.left = x + 1 + "px"
			shadow.style.top = y + 3 + "px"

			let arrow = layers.markers.arrow
			if (arrow) {
				if (elapsed % 2 === 0) {
					arrow.style.display = "none"
				} else {
					arrow.style.display = "block"
				}
			}

			if (t === 1) {
				layers.markers.wrap.removeChild(arrow)
				layers.markers.arrow = null
				let options = [ "wait", "back" ]
				let neighbors = Cell.neighborhood(unit.cell, Unit.rng(unit.type))
				let occupied = neighbors.filter(neighbor => Map.unitAt(map, neighbor))
				let units = occupied.map(cell => Map.unitAt(map, cell))
				let enemies = units.filter(other => other.faction !== unit.faction)
				if (enemies.length) {
					options.unshift("attack")
				}
				modes.unshift({
					type: "act",
					unit: unit,
					time: time,
					options: options,
					buttons: []
				})
			}
		} else if (mode.type === "act") {
			let elapsed = time - mode.time
			let p = (elapsed - 5) / 30
			if (p < 0) p = 0
			if (p > 1) p = 1
			let t = -Math.pow(2, -10 * p) + 1
			let unit = mode.unit
			let options = mode.options
			let step = 2 * Math.PI / options.length
			for (let i = 0; i < options.length; i++) {
				let option = options[i]
				let button = layers.buttons.wrap.children[i]
				let a = step * i + Math.PI / 2 + Math.PI * t
				let r = 20 * t
				let x = unit.cell[0] * 16 + Math.cos(a) * r
				let y = unit.cell[1] * 16 + Math.sin(a) * r
				if (t) {
					button.style.display = "block"
				}
				button.style.left = x + "px"
				button.style.top = y + "px"
			}
		}
	}

	if (cache.box) {
		let box = cache.box
		updateBox(box)
		if (box.pos[0] < -box.element.width - 16 * 15) {
			layers.boxes.wrap.removeChild(box.element)
			layers.boxes.list.splice(layers.boxes.list.indexOf(box.element), 1)
			cache.box = null
		}
	}

	updateViewport(view, game)

	if (mode && mode.type === "move") {
		updateCursor(view, game)
	}

	// viewport panning
	if (cursor.drag && !mode) {
		let x = cursor.drag[0] + cursor.pos[0]
		let y = cursor.drag[1] + cursor.pos[1]
		viewport.pos[0] = x
		viewport.pos[1] = y
	}
}

function updateCursor(view, game) {
	let state = view.state
	let mode = state.modes[0]
	let unit = mode.unit
	let cursor = state.cursor
	let map = game.map
	let index = map.units.indexOf(unit)
	let sprites = view.sprites
	let cache = state.cache
	let range = cache.ranges[index]
	let layers = cache.layers
	if (layers.markers.cursor && mode.path && mode.path.length) {
		let path = mode.path
		let cell = path[path.length - 1]
		let x = cell[0] * 16
		let y = cell[1] * 16
		let { el, pos } = layers.markers.cursor
		pos[0] += (x - pos[0]) / 4
		pos[1] += (y - pos[1]) / 4
		el.style.left = pos[0] + "px"
		el.style.top = pos[1] + "px"
	}
	if (cache.cursor.cell && Cell.equals(cache.cursor.cell, cursor.cell)) {
		return
	}
	cache.cursor.cell = cursor.cell
	let path = mode.path = tracePath(map, unit, cursor.cell, range, mode.path)
	if (path.length) {
		if (path.length > 1) {
			let bounds = enclose(path)
			let sprite = sprites.ui.Arrow(path)
			let arrow = layers.markers.arrow
			if (!arrow) {
				arrow = sprite
				arrow.className = "arrow"
				layers.markers.arrow = arrow
				layers.markers.wrap.appendChild(arrow)
			} else {
				let context = arrow.getContext("2d")
				arrow.width = sprite.width
				arrow.height = sprite.height
				context.drawImage(sprite, 0, 0)
			}
			arrow.style.left = bounds.left * 16 + "px"
			arrow.style.top = bounds.top * 16 + "px"
		} else if (path.length === 1) {
			let arrow = layers.markers.arrow
			if (arrow) {
				layers.markers.arrow = null
				layers.markers.wrap.removeChild(arrow)
			}
		}
		let cell = path[path.length - 1]
		let x = cell[0] * 16
		let y = cell[1] * 16
		if (!layers.markers.cursor) {
			let el = extract(sprites.ui.cursor[0])
			let pos = [ x, y ]
			el.className = "cursor"
			el.style.left = x + "px"
			el.style.top = y + "px"
			layers.markers.wrap.appendChild(el)
			layers.markers.cursor = { el, pos }
		}
	} else {
		// cursor is out of range
		mode.path = null
		cache.cursor.cell = null
		let cursor = layers.markers.cursor
		if (cursor) {
			layers.markers.cursor = null
			layers.markers.wrap.removeChild(cursor.el)
		}
		let arrow = layers.markers.arrow
		if (arrow) {
			layers.markers.arrow = null
			layers.markers.wrap.removeChild(arrow)
		}
	}
}

function updateBox(box) {
	if (!box.exiting) {
		box.pos[0] += (8 - box.pos[0]) / 4
	} else {
		box.pos[0] -= 24
	}
	let element = box.element
	element.style.left = Math.round(box.pos[0]) + "px"
	element.style.top = Math.round(box.pos[1]) + "px"
}

function updateViewport(view, game) {
	let viewport = view.state.viewport
	let layers = view.state.cache.layers
	let diff = [
		game.map.layout.size[0] * 16 - viewport.size[0],
		game.map.layout.size[1] * 16 - viewport.size[1]
	]

	if (viewport.dest) {
		viewport.pos[0] += (viewport.dest[0] - viewport.pos[0]) / 8
		viewport.pos[1] += (viewport.dest[1] - viewport.pos[1]) / 8
	}

	if (diff[0] >= 0 && diff[1] >= 0) {
		let pos = viewport.dest || viewport.pos
		if (pos[0] > -viewport.size[0] / 2) {
			pos[0] = -viewport.size[0] / 2
		} else if (pos[0] + viewport.size[0] / 2 < -diff[0]) {
			pos[0] = -diff[0] - viewport.size[0] / 2
		}
		if (pos[1] > -viewport.size[1] / 2) {
			pos[1] = -viewport.size[1] / 2
		} else if (pos[1] + viewport.size[1] / 2 < -diff[1]) {
			pos[1] = -diff[1] - viewport.size[1] / 2
		}
	}
	let x = Math.round(viewport.pos[0])
	let y = Math.round(viewport.pos[1])
	layers.game.style.transform = `translate(${x}px, ${y}px)`
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

function contextualize(element, pos) {
	let rect = element.getBoundingClientRect()
	return [
		pos[0] - rect.left / scale,
		pos[1] - rect.top / scale
	]
}
