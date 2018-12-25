import { equals, search, neighborhood, manhattan } from "./cell"
import { allied, mov, rng } from "./unit"
import { unitAt } from "./map"
import pathfind from "./pathfind"

export default function tracePath(map, unit, cell, range, path) {
	if (equals(cell, unit.cell)) {
		return [ cell ] // path from a to a is [ a ]
	}

	// walkable cells include movement range as well as allied unit cells
	let cells = range.move.slice()
	for (let other of map.units) {
		if (!allied(unit, other) || equals(unit.cell, other.cell)) continue
		if (manhattan(unit.cell, other.cell) > mov(unit.type)) continue
		cells.push(other.cell)
	}

	let dest = cell
	let target = unitAt(map, cell)
	if (target) {
		// there's a unit in the way. recalculate dest
		let neighbors = allied(unit, target)
			? neighborhood(target.cell)
			: neighborhood(target.cell, rng(unit.type))

		if (path) {
			// find intersection between path and target neighbors
			let adjacent = neighbors.filter(neighbor => search(path, neighbor) !== -1)
			if (adjacent.length) { // prioritize path
				dest = adjacent.sort((a, b) => path.indexOf(a) - path.indexOf(b))[0]
			}
		}

		if (!dest) {
			// find intersection between walkable cells and target neighbors (must exist)
			let adjacent = neighbors.filter(neighbor => search(cells, neighbor) !== -1)
			dest = adjacent.sort((a, b) => manhattan(unit.cell, a) - manhattan(unit.cell, b))[0]
		}
	}

	if (!path) {
		return pathfind(cells, unit.cell, dest)
	} else if (equals(dest, path[path.length - 1])) {
		return path
	}

	let index = search(path, dest)
	if (index !== -1) {
		// cell is already in path
		// truncate up to current cell
		return path.slice(0, index + 1)
	} else {
		// prevent path overlap
		let pathless = cells.filter(cell => search(path, cell) === -1)
		let ext = pathfind(pathless, path[path.length - 1], dest)
		if (!ext.length) {
			return []
		} else if (ext && path.length + ext.length - 2 <= mov(unit.type)) {
			// resulting path length is within movement range
			ext.shift()
			return [ ...path, ...ext ]
		} else {
			// resulting path is too long; recalculate
			return pathfind(cells, unit.cell, dest)
		}
	}
}
