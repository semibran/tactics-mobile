import * as Map from "./map"
import * as Unit from "./unit"
import * as Cell from "./cell"

export default function range(map, unit) {
	var range = {
		move: [ unit.cell ],
		attack: [],
		fuse: []
	}

	var mov = unit.ai === "defend" ? 0 : Unit.mov(unit.type)
	var start = { steps: 0, cell: unit.cell }
	var queue = [ start ]
	var edges = []
	if (!mov) {
		queue.length = 0
		edges.push(unit.cell)
	}

	while (queue.length) {
		var node = queue.shift()
		var neighbors = Cell.neighborhood(node.cell)
		for (var i = 0; i < neighbors.length; i++) {
			var neighbor = neighbors[i]

			// exclude out of bounds / unwalkables
			if (!Map.walkable(map, neighbor)) {
				continue
			}

			// avoid duplicates
			if (Cell.search(range.move, neighbor) !== -1) {
				continue
			}

			// determine appropriate action for cell based on contents:
			// * empty -> move
			// * enemy -> attack
			// * ally -> fuse
			var target = Map.unitAt(map, neighbor)
			if (!target) {
				range.move.push(neighbor)
			} else {
				var action = Unit.allied(unit, target)
					? range.fuse
					: range.attack

				// only like pieces can be fused (for now)
				if (target.type === unit.type || action !== range.fuse) {
					// avoid duplicates
					if (Cell.search(action, neighbor) === -1) {
						action.push(neighbor)
					}
				}
			}

			// maximum steps
			if (node.steps < mov - 1) {
				if (!target || Unit.allied(unit, target)) {
					// only consider cell if it is empty or if it is occupied by an ally
					queue.push({
						steps: node.steps + 1,
						cell: neighbor
					})
				}
			} else {
				// we've reached the extent of the range perimeter
				edges.push(neighbor)
			}
		}
	}

	// search for possible actions outside the perimeter of the movement range
	for (var i = 0; i < edges.length; i++) {
		var cell = edges[i]
		var neighbors = Cell.neighborhood(cell, Unit.rng(unit.type))
		for (var j = 0; j < neighbors.length; j++) {
			var neighbor = neighbors[j]
			if (!Map.contains(map, neighbor)
			|| !Map.walkable(map, neighbor)
			|| Cell.equals(unit.cell, neighbor)
			) {
				continue
			}

			var target = Map.unitAt(map, neighbor)

			// add extraneous attack cells
			if (!target || !Unit.allied(unit, target)) {
				if (Cell.search(range.attack, neighbor) === -1) {
					range.attack.push(neighbor)
				}
			}

			// add extraneous fusion cells
			if (!target || Unit.allied(unit, target) && unit.type === target.type) {
				if (Cell.search(range.fuse, neighbor) === -1) {
					range.fuse.push(neighbor)
				}
			}
		}
	}

	return range
}
