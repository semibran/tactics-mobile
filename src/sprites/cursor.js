import extract from "img-extract"

export default function renderCursor(sprites) {
	return [
		extract(sprites, 0, 0, 16, 16),
		extract(sprites, 16, 0, 16, 16)
	]
}
