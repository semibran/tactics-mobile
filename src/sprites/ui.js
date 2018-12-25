import renderArrow from "./arrow"
import renderText from "./text"
import renderBox from "./box"
import renderTextBox from "./textbox"
import renderSquares from "./squares"
import renderCursor from "./cursor"

export default function ui(sprites) {
	let cursor = renderCursor(sprites.ui.cursor)
	let Arrow = renderArrow(sprites.ui.arrows)
	let Text = renderText(sprites.ui.typeface)
	let Box = renderBox(sprites.ui.box)
	let TextBox = renderTextBox(Text, Box)
	let squares = renderSquares()
	return { Text, Box, TextBox, Arrow, squares, cursor }
}
