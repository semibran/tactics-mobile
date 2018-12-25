import * as Unit from "./unit"

export function create(data) {
	let units = data.units.map(unit => Unit.create(...unit))
	let allies = units.filter(unit => unit.faction === "player")
	return {
		map: {
			layout: data.map,
			units: units
		},
		phase: {
			faction: "player",
			pending: allies
		}
	}
}
