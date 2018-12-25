import rgba from "../../lib/rgba"
import Canvas from "../../lib/canvas"
import colors from "./colors"

export default function squares() {
	return {
		move: square(colors.blue),
		attack: square(colors.red),
		fuse: square(colors.yellow)
	}

	function square(color) {
		let context = Canvas(16, 16)
		context.fillStyle = rgba(...color)
		context.globalAlpha = 0.5
		context.fillRect(0, 0, 15, 15)
		return context.canvas
	}
}
