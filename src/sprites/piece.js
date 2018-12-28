import Canvas from "../../lib/canvas"
import pixels from "../../lib/pixels"
import colors from "./colors"
import * as icons from "./icons"

export default function renderPieces(sprites) {
	let pieces = {}
	let palettes = {
		player: {
			default: colors.blue,
			light: colors.cyan,
			dark: colors.navy
		},
		enemy: {
			default: colors.red,
			light: colors.pink,
			dark: colors.purple
		}
	}

	for (let faction in palettes) {
		let palette = palettes[faction]
		for (let type in icons.units) {
			let name = icons.units[type]
			let icon = sprites.icons[name]
			if (!pieces[type]) pieces[type] = {}
			pieces[type][faction] = renderPiece(sprites.piece.base, icon, palette)
		}
	}

	return pieces
}

function renderPiece(base, icon, palette) {
	base = base
		.getContext("2d")
		.getImageData(0, 0, 16, 16)

	icon = icon
		.getContext("2d")
		.getImageData(0, 0, icon.width, icon.height)

	pixels.replace(base, colors.white, palette.default)
	pixels.replace(base, colors.black, palette.dark)

	let piece = Canvas(base.width, base.height)
	piece.putImageData(base, 0, 0)

	let light = Canvas(8, 8)
	pixels.replace(icon, colors.white, palette.light)
	light.putImageData(icon, 0, 0)
	piece.drawImage(light.canvas, 4, 4)

	let dark = Canvas(8, 8)
	pixels.replace(icon, palette.light, palette.dark)
	dark.putImageData(icon, 0, 0)
	piece.drawImage(dark.canvas, 4, 3)

	return scale(piece.canvas, 4)
}

function scale(image, factor) {
	let canvas = document.createElement("canvas")
	let context = canvas.getContext("2d")
	canvas.width = image.width * factor
	canvas.height = image.height * factor
	context.webkitImageSmoothingEnabled = false;
	context.mozImageSmoothingEnabled = false;
	context.msImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false;
	context.drawImage(image, 0, 0, image.width * factor, image.height * factor)
	return canvas
}
