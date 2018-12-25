import sourcemap from "../../dist/tmp/sprites.json"
import extract from "../../lib/img-extract"
import renderPieces from "./piece"
import ui from "./ui"

export default function normalize(spritesheet) {
	let sprites = disassemble(spritesheet, sourcemap)
	let pieces = renderPieces(sprites)
	return {
		Piece: Piece,
		pieces: { shadow: sprites.piece.shadow },
		ui: ui(sprites),
		effects: sprites.effects,
		tiles: sprites.tiles,
		icons: sprites.icons
	}

	function Piece(type, faction) {
		return extract(pieces[type][faction])
	}
}

function disassemble(spritesheet, sourcemap) {
	let sprites = {}
	for (let id in sourcemap) {
		if (Array.isArray(sourcemap[id])) {
			let [ x, y, w, h ] = sourcemap[id]
			sprites[id] = extract(spritesheet, x, y, w, h)
		} else {
			sprites[id] = disassemble(spritesheet, sourcemap[id])
		}
	}
	return sprites
}
