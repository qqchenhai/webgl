//通过模型矩阵， 视图矩阵和投影矩阵对三角形同时变换
//【这一次把投影矩阵 * 视图矩阵 * 模型矩阵的计算操作， 组合成一个新的整体】
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'uniform mat4 u_MvpMatrix;\n' +       //模型视图投影矩阵
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    //投影矩阵 * 视图矩阵 * 模型矩阵 * 顶点坐标
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_Color = a_Color;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'varying vec4 v_Color;\n' +
    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // 设置顶点着色器中的颜色和坐标信息
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // 分别获取u_ModelMatrix, u_ViewMatrix, and u_ProjMatrix的存储位置
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix ) {
        console.log('Failed to Get the storage locations of u_MvpMatrix');
        return;
    }

    //分别新建模型矩阵， 视图矩阵， 投影矩阵
    var modelMatrix = new Matrix4(); // The model matrix
    var viewMatrix = new Matrix4();  // The view matrix
    var projMatrix = new Matrix4();  // The projection matrix
    //新建一个模型视图投影矩阵（把计算的操作都交给这个矩阵来完成）
    var mvpMatrix = new Matrix4();

    // Calculate the view matrix and the projection matrix
    modelMatrix.setTranslate(0.75, 0, 0);  // x轴平移0.75 个单位
    viewMatrix.setLookAt(0, 0, 5, 0, 0, -100, 0, 1, 0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);

    //开始计算我的模型视图投影矩阵(投影矩阵 * 视图矩阵 * 模型矩阵)
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);


    // 将模型视图投影矩阵传给顶点着色器中的u_MvpMatrix变量
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);



    gl.clear(gl.COLOR_BUFFER_BIT);   // Clear <canvas>

    //首先绘制右侧的一组三角形（这句话调用后， 就会开始绘制三角形）
    gl.drawArrays(gl.TRIANGLES, 0, n);



    // 把模型矩阵向左平移-0.75个单位
    modelMatrix.setTranslate(-0.75, 0, 0);
    //【特别注意】这里需要重新计算一次我的模型视图投影矩阵
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    // 把当前的模型矩阵传给顶点着色器
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);


    //开始绘制左边的一组三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);   // Draw the triangles
}

function initVertexBuffers(gl) {
    //定义了三个三角形， 他们的中心都在Z坐标轴上
    //注意WEBGL在默认的情况下会按照缓冲区中的顺序来绘制图形， 而且后绘制的图像会覆盖掉先绘制的图形
    var verticesColors = new Float32Array([
        // Vertex coordinates and color
        0.0,  1.0,   0.0,  0.4,  0.4,  1.0,  // The front blue one
        -0.5, -1.0,   0.0,  0.4,  0.4,  1.0,
        0.5, -1.0,   0.0,  1.0,  0.4,  0.4,

        0.0,  1.0,  -2.0,  1.0,  1.0,  0.4, // The middle yellow one
        -0.5, -1.0,  -2.0,  1.0,  1.0,  0.4,
        0.5, -1.0,  -2.0,  1.0,  0.4,  0.4,

        0.0,  1.0,  -4.0,  0.4,  1.0,  0.4, // The back green one
        -0.5, -1.0,  -4.0,  0.4,  1.0,  0.4,
        0.5, -1.0,  -4.0,  1.0,  0.4,  0.4,




    ]);
    var n = 9;

    // Create a buffer object
    var vertexColorbuffer = gl.createBuffer();
    if (!vertexColorbuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Write the vertex information and enable it
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

    var FSIZE = verticesColors.BYTES_PER_ELEMENT;

    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);

    // Assign the buffer object to a_Color and enable the assignment
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    return n;
}
