import { x, y } from "./cell"

export default function manhattan(a, b) {
	return Math.abs(x(b) - x(a)) + Math.abs(y(b) - y(a))
}
