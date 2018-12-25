export default function pathlerp(path, time) {
	let t = time * (path.length - 1)
	let i = Math.floor(t)
	let p = t - i
	if (time === 1) {
		return path[i]
	}
	let a = path[i]
	let b = path[i + 1]
	return [
		a[0] + (b[0] - a[0]) * p,
		a[1] + (b[1] - a[1]) * p
	]
}
