import { equals, search, neighborhood, manhattan } from "./cell"

export default function pathfind(cells, src, dest) {
	var path = []
	var open = [ src ]
	var opened = {}
	var closed = {}
	var parent = {}
	var g = {}
	var f = {}
	for (var i = 0; i < cells.length; i++) {
		let cell = cells[i]
		g[cell] = Infinity
		f[cell] = Infinity
	}
	g[src] = 0
	f[src] = manhattan(src, dest)
	while (open.length) {
		var best = { score: Infinity, index: -1, cell: null }
		for (var i = 0; i < open.length; i++) {
			var cell = open[i]
			var index = i
			var score = f[cell]
			if (score < best.score) {
				best.score = score
				best.index = i
				best.cell = cell
			}
		}
		var cell = best.cell
		if (equals(cell, dest)) {
			while (!equals(cell, src)) {
				path.unshift(cell)
				cell = parent[cell]
			}
			path.unshift(cell)
			return path
		}
		open.splice(best.index, 1)
		opened[cell] = false
		closed[cell] = true
		var neighbors = neighborhood(cell)
		for (var i = 0; i < neighbors.length; i++) {
			var neighbor = neighbors[i]
			var index = search(cells, neighbor)
			if (index === -1) continue
			if (closed[neighbor]) continue
			if (!opened[neighbor]) {
				opened[neighbor] = true
				open.push(neighbor)
			}
			var score = g[cell] + 1
			if (score >= g[neighbor]) continue
			parent[neighbor] = cell
			g[neighbor] = score
			f[neighbor] = score + manhattan(neighbor, dest)
		}
	}
	return []
}
