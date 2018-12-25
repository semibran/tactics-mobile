import Canvas from "../../lib/canvas"

export default function TextBox(Text, Box) {
	return function TextBox(content) {
		let text = Text(content)
		let width = text.width
		let height = 8

		let box = Box(width + 16, height + 16)
		let context = Canvas(width, height)
		context.drawImage(text, 0, 0)

		if (context.canvas.width) {
			box.getContext("2d")
				.drawImage(context.canvas, 8, 8)
		}

		return box
	}
}
