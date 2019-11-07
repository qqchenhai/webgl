#### 环境贴图入门
<p><iframe style="width: 100%; height: 520px; text-align:center;" src="/nehe_webgl/lessons/NeHeWebGL7.html" frameborder="0" width="500" height="500"></iframe></p>

#### 源码笔记
```
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=gb2312">
    <script type="text/javascript" src="../lib/glmatrix-0.9.5.js"></script>

    <script id="shader-vs" type="x-shader/x-vertex">
attribute vec3 v3Position;
uniform mat4 um4Rotate;
varying vec3 v_texCoord;
void main(void)
{
    v_texCoord = v3Position;//由于我们定义的立方体的中心就是(0,0,0)，所以取样坐标就是顶点位置
    gl_Position = um4Rotate * vec4(v3Position, 1.0);
}
</script>

    <script id="shader-fs" type="x-shader/x-fragment">
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif
uniform samplerCube s_texture;
varying vec3 v_texCoord;

void main(void)
{
    gl_FragColor = textureCube(s_texture, v_texCoord);//着色器内建的取样函数要变成立方图纹理的版本
}
</script>

    <script>
        function ShaderSourceFromScript(scriptID)
        {
            var shaderScript = document.getElementById(scriptID);
            if (shaderScript == null) return "";

            var sourceCode = "";
            var child = shaderScript.firstChild;
            while (child)
            {
                if (child.nodeType == child.TEXT_NODE ) sourceCode += child.textContent;
                child = child.nextSibling;
            }

            return sourceCode;
        }

        var webgl = null;
        var vertexShaderObject = null;
        var fragmentShaderObject = null;
        var programObject = null;
        var cubeBuffer = null;
        var cubeIndexBuffer = null;
        var v3PositionIndex = 0;
        var textureObject = null;
        var samplerIndex = -1;
        var interval = 300;
        var angle = 0;
        var um4RotateIndex = -1;
        var leftKeyDown = false;
        var rightKeyDown = false;
        var angleX = 0;
        var upKeyDown = false;
        var downKeyDown = false;

        function LoadData()
        {
            var jsCubeData = [
                0.5, 0.5, 0.5,
                0.5, -0.5, 0.5,
                -0.5, -0.5, 0.5,
                -0.5, 0.5, 0.5,
                0.5, 0.5, -0.5,
                0.5, -0.5, -0.5,
                -0.5, -0.5, -0.5,
                -0.5, 0.5, -0.5
            ];

            cubeBuffer = webgl.createBuffer();
            webgl.bindBuffer(webgl.ARRAY_BUFFER, cubeBuffer);
            webgl.bufferData(webgl.ARRAY_BUFFER, new Float32Array(jsCubeData), webgl.STATIC_DRAW);


            var jsCubeIndex = [
                //前
                1,2,3,
                3,4,1,

                //后
                5,8,7,
                7,6,5,

                //左
                4,3,7,
                7,8,4,

                //右
                5,6,2,
                2,1,5,

                //上
                5,1,4,
                4,8,5,

                //下
                2,6,7,
                7,3,2
            ];
            //数组中的是1-8的编号，要处理为0-7的索引
            for(var i=0; i<jsCubeIndex.length; ++i) --jsCubeIndex[i];

            cubeIndexBuffer = webgl.createBuffer();
            webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
            webgl.bufferData(webgl.ELEMENT_ARRAY_BUFFER, new Uint8Array(jsCubeIndex), webgl.STATIC_DRAW);


            textureObject = webgl.createTexture();
            webgl.bindTexture(webgl.TEXTURE_CUBE_MAP, textureObject);
            //立方图纹理需要设置六个方位上的纹理，为了方便区分，我设置了六个不同的纹理图像
            webgl.texImage2D(webgl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, webgl.RGB, webgl.RGB, webgl.UNSIGNED_BYTE, document.getElementById('myTexture1'));
            webgl.texImage2D(webgl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, webgl.RGB, webgl.RGB, webgl.UNSIGNED_BYTE, document.getElementById('myTexture2'));
            webgl.texImage2D(webgl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, webgl.RGB, webgl.RGB, webgl.UNSIGNED_BYTE, document.getElementById('myTexture3'));
            webgl.texImage2D(webgl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, webgl.RGB, webgl.RGB, webgl.UNSIGNED_BYTE, document.getElementById('myTexture4'));
            webgl.texImage2D(webgl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, webgl.RGB, webgl.RGB, webgl.UNSIGNED_BYTE, document.getElementById('myTexture5'));
            webgl.texImage2D(webgl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, webgl.RGB, webgl.RGB, webgl.UNSIGNED_BYTE, document.getElementById('myTexture6'));

            return 0;
        }

        function RenderScene()
        {
            webgl.clearColor(0.0, 0.0, 0.0, 1.0);
            webgl.clearDepth(1.0);
            webgl.clear(webgl.COLOR_BUFFER_BIT|webgl.DEPTH_BUFFER_BIT);

            //这些内容，也要针对立方图纹理进行设置
            webgl.texParameteri(webgl.TEXTURE_CUBE_MAP, webgl.TEXTURE_MIN_FILTER, webgl.NEAREST);
            webgl.texParameteri(webgl.TEXTURE_CUBE_MAP, webgl.TEXTURE_MAG_FILTER, webgl.NEAREST);
            webgl.texParameteri(webgl.TEXTURE_CUBE_MAP, webgl.TEXTURE_WRAP_S, webgl.CLAMP_TO_EDGE);
            webgl.texParameteri(webgl.TEXTURE_CUBE_MAP, webgl.TEXTURE_WRAP_T, webgl.CLAMP_TO_EDGE);

            webgl.activeTexture(webgl.TEXTURE0);
            webgl.bindTexture(webgl.TEXTURE_CUBE_MAP, textureObject);
            webgl.uniform1i(samplerIndex, 0);

            var m4Rotate = mat4.create();
            mat4.identity(m4Rotate);
            mat4.rotateZ(m4Rotate, angle*Math.PI/180);
            mat4.rotateX(m4Rotate, angleX*Math.PI/180);
            webgl.uniformMatrix4fv(um4RotateIndex, false, m4Rotate);

            webgl.enable(webgl.DEPTH_TEST);
            webgl.frontFace(webgl.CW);


            webgl.bindBuffer(webgl.ARRAY_BUFFER, cubeBuffer);
            webgl.bindBuffer(webgl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
            webgl.enableVertexAttribArray(v3PositionIndex);
            webgl.vertexAttribPointer(v3PositionIndex, 3, webgl.FLOAT, false, 0, 0);

            webgl.drawElements(webgl.TRIANGLES, 36, webgl.UNSIGNED_BYTE, 0);
        }

        function RotateTriangle()
        {
            if(leftKeyDown) angle += 10;
            if(rightKeyDown) angle -= 10;
            if(angle >= 360) angle -= 360;
            if(angle < 0) angle += 360;

            if(upKeyDown) angleX += 10;
            if(downKeyDown) angleX -= 10;
            if(angleX >= 360) angleX -= 360;
            if(angleX < 0) angleX += 360;

            RenderScene();
        }

        document.onkeydown = function(e)
        {
            if(e.keyCode == 37) leftKeyDown = true;
            if(e.keyCode == 39) rightKeyDown = true;
            if(e.keyCode == 38) upKeyDown = true;
            if(e.keyCode == 40) downKeyDown = true;
        }
        document.onkeyup = function(e)
        {
            if(e.keyCode == 37) leftKeyDown = false;
            if(e.keyCode == 39) rightKeyDown = false;
            if(e.keyCode == 38) upKeyDown = false;
            if(e.keyCode == 40) downKeyDown = false;
        }

        function Init()
        {
            var myCanvasObject = document.getElementById('myCanvas');
            webgl = myCanvasObject.getContext("experimental-webgl");

            webgl.viewport(0, 0, myCanvasObject.clientWidth, myCanvasObject.clientHeight);

            vertexShaderObject = webgl.createShader(webgl.VERTEX_SHADER);
            fragmentShaderObject = webgl.createShader(webgl.FRAGMENT_SHADER);

            webgl.shaderSource(vertexShaderObject, ShaderSourceFromScript("shader-vs"));
            webgl.shaderSource(fragmentShaderObject, ShaderSourceFromScript("shader-fs"));

            webgl.compileShader(vertexShaderObject);
            webgl.compileShader(fragmentShaderObject);

            if(!webgl.getShaderParameter(vertexShaderObject, webgl.COMPILE_STATUS)){alert(webgl.getShaderInfoLog(vertexShaderObject));return;}
            if(!webgl.getShaderParameter(fragmentShaderObject, webgl.COMPILE_STATUS)){alert(webgl.getShaderInfoLog(fragmentShaderObject));return;}

            programObject = webgl.createProgram();

            webgl.attachShader(programObject, vertexShaderObject);
            webgl.attachShader(programObject, fragmentShaderObject);

            webgl.bindAttribLocation(programObject, v3PositionIndex, "v3Position");

            webgl.linkProgram(programObject);
            if(!webgl.getProgramParameter(programObject, webgl.LINK_STATUS)){alert(webgl.getProgramInfoLog(programObject));return;}

            samplerIndex = webgl.getUniformLocation(programObject, "s_texture");
            um4RotateIndex = webgl.getUniformLocation(programObject, "um4Rotate");

            webgl.useProgram(programObject);

            if(LoadData() != 0){alert("error:LoadData()!");return;}


            window.setInterval("RotateTriangle()", interval);
        }

    </script>
</head>
<body onload='Init()'>
<canvas id="myCanvas" style="border:1px solid red;" width='600px' height='450px'></canvas>
<img id="myTexture1" src='../resources/cube/01.bmp'><!--图片改为了6个128*128的-->
<img id="myTexture2" src='../resources/cube/02.bmp'><br>
<img id="myTexture3" src='../resources/cube/03.bmp'>
<img id="myTexture4" src='../resources/cube/04.bmp'><br>
<img id="myTexture5" src='../resources/cube/05.bmp'>
<img id="myTexture6" src='../resources/cube/06.bmp'>
</body>
</html>
```