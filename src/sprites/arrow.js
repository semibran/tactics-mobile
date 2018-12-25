import Canvas from "../../lib/canvas"
import enclose from "../../lib/bounds"
import extract from "img-extract"

export default function Arrow(sprites) {
	let arrows = {
		left:      extract(sprites,  0,  0, 16, 16),
		right:     extract(sprites, 16,  0, 16, 16),
		up:        extract(sprites, 32,  0, 16, 16),
		down:      extract(sprites, 48,  0, 16, 16),
		leftStub:  extract(sprites,  0, 16, 16, 16),
		rightStub: extract(sprites, 16, 16, 16, 16),
		upStub:    extract(sprites, 32, 16, 16, 16),
		downStub:  extract(sprites, 48, 16, 16, 16),
		upLeft:    extract(sprites,  0, 32, 16, 16),
		upRight:   extract(sprites, 16, 32, 16, 16),
		downLeft:  extract(sprites, 32, 32, 16, 16),
		downRight: extract(sprites, 48, 32, 16, 16),
		horiz:     extract(sprites,  0, 48, 16, 16),
		vert:      extract(sprites, 16, 48, 16, 16)
	}

	return function Arrow(path) {
		let images = []
		for (let i = 0; i < path.length; i++) {
			let [ x, y ] = path[i]

			let l = false
			let r = false
			let u = false
			let d = false

			let prev = path[i - 1]
			if (prev) {
				let dx = x - prev[0]
				let dy = y - prev[1]
				if (dx === 1) {
					l = true
				} else if (dx === -1) {
					r = true
				}
				if (dy === 1) {
					u = true
				} else if (dy === -1) {
					d = true
				}
			}

			let next = path[i + 1]
			if (next) {
				let dx = next[0] - x
				let dy = next[1] - y
				if (dx === -1) {
					l = true
				} else if (dx === 1) {
					r = true
				}
				if (dy === -1) {
					u = true
				} else if (dy === 1) {
					d = true
				}
			}

			if (l || r || u || d) {
				let direction = null
				if (l && r) direction = "horiz"
				else if (u && d) direction = "vert"
				else if (u && l) direction = "upLeft"
				else if (u && r) direction = "upRight"
				else if (d && l) direction = "downLeft"
				else if (d && r) direction = "downRight"
				else if (l && !i) direction = "leftStub"
				else if (r && !i) direction = "rightStub"
				else if (u && !i) direction = "upStub"
				else if (d && !i) direction = "downStub"
				else if (l) direction = "left"
				else if (r) direction = "right"
				else if (u) direction = "up"
				else if (d) direction = "down"

				if (direction) {
					images.push({
						sprite: arrows[direction],
						position: [ x, y ]
					})
				}
			}
		}

		let bounds = enclose(path)
		let arrow = Canvas(bounds.width * 16, bounds.height * 16)
		for (let { sprite, position } of images) {
			let [ x, y ] = position
			arrow.drawImage(sprite, (x - bounds.left) * 16, (y - bounds.top) * 16)
		}

		return arrow.canvas
	}
}
