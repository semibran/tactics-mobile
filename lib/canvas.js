export default function Canvas(width, height) {
	var canvas = document.createElement("canvas")
	var context = canvas.getContext("2d")
	canvas.width = width
	canvas.height = height
	return context
}
