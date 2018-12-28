import extract from "../../lib/img-extract"

export default function renderButton(circle, icons) {
	return function Button(icon) {
		let button = extract(circle)
		let context = button.getContext("2d")
		button.className = "button"
		context.drawImage(icon, 4, 4)
		return button
	}
}
