module.exports = function extract(image, x, y, width, height) {
	if (!x) x = 0
	if (!y) y = 0
	if (!width) width = image.width
	if (!height) height = image.height
	var canvas = document.createElement("canvas")
	var context = canvas.getContext("2d")
	canvas.width = width
	canvas.height = height
	context.drawImage(image, -x, -y)
	return canvas
}
