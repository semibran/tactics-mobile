import { weapons, armor } from "./equipment"

export function create(name, type, faction, ai, cell) {
	return {
		name: name,
		type: type,
		faction: faction,
		ai: ai,
		cell: cell,
		hp: 3
	}
}

export function allied(unit, other) {
	return unit.faction === other.faction
}

export function move(unit, dest) {
	unit.cell = dest.slice()
}

export function attack() {
	return
}

export function str(type) {
	return stats[type].str
}

export function int(type) {
	return stats[type].int
}

export function agi(type) {
	return stats[type].agi
}

export function atk(type) {
	let weapon = wpn(type)
	return stats[type][weapon ? weapon.stat : "str"]
		+ (weapon ? weapon.atk : 0)
}

export function def(type) {
	let armor = arm(type)
	return armor ? armor.def : 0
}

export function res(type) {
	return int(type) + def(type)
}

export function hit(type) {
	let weapon = wpn(type)
	return agi(type) + (weapon ? weapon.hit : 0)
}

export function avo(type) {
	let armor = arm(type)
	return agi(type) - (!armor ? 0 : armor.wt)
}

export function mov(type) {
	let armor = arm(type)
	let wt = armor ? armor.wt : 0
	return 5 + Math.floor(agi(type) / 3 - wt / 2)
}

export function rng(type) {
	return wpn(type).rng
}

export function wpn(type) {
	return equipment[type].weapon
}

export function arm(type) {
	return equipment[type].armor
}

export const stats = {
	fighter:   { str: 2, int: 0, agi: 1 },
	knight:    { str: 1, int: 0, agi: 1 },
	thief:     { str: 1, int: 1, agi: 2 },
	mage:      { str: 1, int: 1, agi: 1 },
}

export const equipment = {
	fighter:   { weapon: weapons.axe,    armor: armor.leather },
	knight:    { weapon: weapons.lance,  armor: armor.mail   },
	thief:     { weapon: weapons.dagger, armor: armor.leather },
	mage:      { weapon: weapons.tome,   armor: armor.leather },
	berserker: { weapon: weapons.axe,    armor: armor.leather },
	general:   { weapon: weapons.lance,  armor: armor.plate   },
	assassin:  { weapon: weapons.dagger, armor: armor.leather },
	sorcerer:  { weapon: weapons.tome,   armor: armor.leather }
}
