
function ndcToWorld (wc_min, wc_max) {
	let wc_width = wc_max[0]-wc_min[0];
	let wc_height = wc_max[1]-wc_min[1];

	let M = matMult(translate3x3(wc_min[0], wc_min[1]), 
				matMult(scale3x3 (wc_width, wc_height), 
				matMult(scale3x3(0.5, 0.5), translate3x3(1., 1.))) 
			);
	M.matrix = true;
	return M;
}

function displayToNDC (canvas_dims) {

	// form the xform 
	let M = matMult(scale3x3(1, -1., 1.), 
				matMult(translate3x3(-1, -1, 0.), 
					matMult(scale3x3(2, 2, 1.),
						scale3x3(1./canvas_dims[0], 1./canvas_dims[1], 1.)))
			);
	M.matrix = true;
	return M;
}


function worldToNDC (wc_min, wc_max) {
	// form the xform
	let wc_width = wc_max[0] - wc_min[0];
	let wc_height = wc_max[1] - wc_min[1];
	let M =  matMult(translate3x3 (-1., -1.),
				matMult(scale3x3(2./wc_width, 2./wc_height), 
					translate3x3(-wc_min[0], -wc_min[1]) ));
	M.matrix = true;
	return M;
}

function translate3x3(tx, ty) {
	trans = mat3();

	trans[0][2] = tx;
	trans[1][2] = ty;

	return trans;
}

function scale3x3 (sx, sy) {
	scale = mat3();

	scale[0][0] = sx;
	scale[1][1] = sy;

	return scale;
}
function rotate3x3 (theta) {
	let rot = mat3();
	rot[0][0] =  Math.cos(theta);
	rot[0][1] = -Math.sin(theta);
	rot[1][0] =  Math.sin(theta);
	rot[1][1] =  Math.cos(theta);

	return rot;
}
function rotate4x4 (theta, dim) {
	rot = mat4();
	switch (dim) {
		case 'x': 
			rot[1][1] =  Math.cos(theta);
			rot[1][2] = -Math.sin(theta);
			rot[2][1] =  Math.sin(theta);
			rot[2][2] =  Math.cos(theta);
			break;
		case 'y': 
			rot[0][1] =  Math.cos(theta);
			rot[0][2] =  Math.sin(theta);
			rot[2][0] = -Math.sin(theta);
			rot[2][2] =  Math.cos(theta);
			break;
		case 'z': 
			rot[0][0] =  Math.cos(theta);
			rot[0][1] = -Math.sin(theta);
			rot[1][0] =  Math.sin(theta);
			rot[1][1] =  Math.cos(theta);
			break;
	}

	return rot;
}

