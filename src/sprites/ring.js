import extract from "img-extract"

export default function renderRing(sprites) {
	let size = 48
	let length = sprites.width / size
	let frames = new Array(length)
	for (let i = 0; i < length; i++) {
		frames[i] = extract(sprites, size * i, 0, size, size)
	}
	return frames
}
