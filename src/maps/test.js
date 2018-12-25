const grass = { name: "grass", walkable: true }

export default {
	id: "test",
	map: {
		size: [ 12, 16 ],
		data:
		( "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		+ "            "
		)
			.split("")
			.map(char => {
				switch (char) {
					case " ": return grass
				}
			})
	},
	units: [
		[ "Ulysses", "knight",  "player", null, [ 4, 6 ] ],
		[ "Alice",   "mage",    "player", null, [ 3, 9 ] ],
		[ "Garrick", "fighter", "enemy",  null, [ 8, 7 ] ]
	]
}
