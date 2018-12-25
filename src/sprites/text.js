import Canvas from "../../lib/canvas"
import extract from "img-extract"

export default function Text(sprites) {
	const width = 8
	const height = 8
	const cols = sprites.width / width
	const rows = sprites.height / height
	const sequence =
		`0123456789` +
		`ABCDEFGHIJ` +
		`KLMNOPQRST` +
		`UVWXYZ,.!?` +
		`abcdefghij` +
		`klmnopqrst` +
		`uvwxyz;:'"` +
		`()/-+     `

	let typeface = {}
	let i = 0
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			let char = sequence[i++]
			typeface[char] = extract(sprites, x * width, y * height, width, height)
		}
	}

	return function Text(content) {
		let width = 0
		for (let i = 0; i < content.length; i++) {
			if (content[i] === " ") {
				width += 4
			} else {
				width += 8
			}
		}

		let text = Canvas(width, 8)
		for (let i = 0, x = 0; i < content.length; i++) {
			let char = content[i]
			if (char === " ") {
				x += 4
			} else {
				let sprite = typeface[char]
				text.drawImage(sprite, x, 0)
				x += 8
			}
		}

		return text.canvas
	}
}

