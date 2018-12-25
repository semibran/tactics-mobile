export default function bounds(points) {
	var left = Infinity
	var top = Infinity
	var right = -Infinity
	var bottom = -Infinity
	for (var i = 0; i < points.length; i++) {
		var point = points[i]
		var x = point[0]
		var y = point[1]
		if (x < left) left = x
		if (x > right) right = x
		if (y < top) top = y
		if (y > bottom) bottom = y
	}
	var width = right - left + 1
	var height = bottom - top + 1
	return {
		left: left,
		top: top,
		right: right,
		bottom: bottom,
		width: width,
		height: height
	}
}
