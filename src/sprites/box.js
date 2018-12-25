import Canvas from "../../lib/canvas"
import extract from "img-extract"

export default function Box(sprites) {
	let tiles = {
		topLeft:     extract(sprites,  0,  0, 16, 16),
		top:         extract(sprites, 16,  0, 16, 16),
		topRight:    extract(sprites, 32,  0, 16, 16),
		left:        extract(sprites,  0, 16, 16, 16),
		center:      extract(sprites, 16, 16, 16, 16),
		right:       extract(sprites, 32, 16, 16, 16),
		bottomLeft:  extract(sprites,  0, 32, 16, 16),
		bottom:      extract(sprites, 16, 32, 16, 16),
		bottomRight: extract(sprites, 32, 32, 16, 16)
	}

	return function Box(width, height) {
		const cols = Math.ceil(width / 16)
		const rows = Math.ceil(height / 16)

		let box = Canvas(width, height)

		for (let x = 1; x < cols - 1; x++) {
			box.drawImage(tiles.top, x * 16, 0)
			box.drawImage(tiles.bottom, x * 16, height - 16)
		}

		for (let y = 1; y < rows - 1; y++) {
			box.drawImage(tiles.left, 0, y * 16)
			box.drawImage(tiles.right, width - 16, y * 16)
		}

		box.fillRect(4, 4, width - 8, height - 8)
		box.drawImage(tiles.topLeft, 0, 0)
		box.drawImage(tiles.topRight, width - 16, 0)
		box.drawImage(tiles.bottomLeft, 0, height - 16)
		box.drawImage(tiles.bottomRight, width - 16, height - 16)

		return box.canvas
	}
}
