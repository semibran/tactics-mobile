import renderArrow from "./arrow"
import renderText from "./text"
import renderBox from "./box"
import renderTextBox from "./textbox"
import renderSquares from "./squares"
import renderButton from "./button"
import renderCursor from "./cursor"
import renderRing from "./ring"

export default function ui(sprites) {
	let cursor = renderCursor(sprites.ui.cursor)
	let Button = renderButton(sprites.ui.circle)
	let Arrow = renderArrow(sprites.ui.arrows)
	let Text = renderText(sprites.ui.typeface)
	let Box = renderBox(sprites.ui.box)
	let TextBox = renderTextBox(Text, Box)
	let squares = renderSquares()
	let ring = renderRing(sprites.ui.ring)
	return { Text, Box, TextBox, Arrow, Button, squares, ring, cursor }
}
