/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Yani Julian <bjulia2@illinois.edu>  
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext == null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        var vid = 3*(i*(this.div+1) + j);
        this.vBuffer[vid] = v[0];
        this.vBuffer[vid + 1] = v[1];
        this.vBuffer[vid + 2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        var vid = 3*(i*(this.div+1) + j);
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid + 1];
        v[2] = this.vBuffer[vid + 2];
    }
    
    offsetHeight(amount, i, j) {
        let originalVec = vec3.create()
        this.getVertex(originalVec, i, j);
        originalVec[2] += amount;
        this.setVertex(originalVec, i, j);
    }

    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }
    /**
     * Fill the vertex and buffer arrays 
     */    
    generateTriangles() {
        //Your code here
        var deltaX = (this.maxX - this.minX) / this.div;
        var deltaY = (this.maxY - this.minY) / this.div;
        for(var i = 0; i <= this.div; i++) {
            for (var j = 0; j <= this.div; j++) {
                this.vBuffer.push(this.minX+deltaX*j);
                this.vBuffer.push(this.minY+deltaY*i);
                this.vBuffer.push(0);

                this.nBuffer.push(0);
                this.nBuffer.push(0);//sample points uniform from unit circle?
                this.nBuffer.push(1);
            }
        }
        for(var i = 0; i < this.div; i++) {
            for (var j = 0; j < this.div; j++) {
                var vid = i*(this.div+1) +j;
                console.log(vid);
                this.fBuffer.push(vid);
                this.fBuffer.push(vid + 1);
                this.fBuffer.push(vid + this.div + 1);

                this.fBuffer.push(vid + 1);
                this.fBuffer.push(vid + 1 + this.div + 1);
                this.fBuffer.push(vid + this.div + 1);
            }
        }
        
        //
        this.numVertices = this.vBuffer.length/3;
        this.numFaces = this.fBuffer.length/3;
        this.setHeightsByPartition(1000, 0.005);
        //this.generateNormals();
    }

    generateNormals() {
        for(var i=0;i<this.numFaces;i++) {
            let v1Index = this.fBuffer[i*3];
            let v2Index = this.fBuffer[i*3 + 1];
            let v3Index = this.fBuffer[i*3 + 2];
            let v1X = this.vBuffer[v1Index*3];
            let v1Y = this.vBuffer[v1Index*3 + 1];
            let v1Z = this.vBuffer[v1Index*3+2];
            let v1 = vec3.fromValues(v1X, v1Y, v1Z);

            let v2X = this.vBuffer[v2Index*3];
            let v2Y = this.vBuffer[v2Index*3 + 1];
            let v2Z = this.vBuffer[v2Index*3+2];
            let v2 = vec3.fromValues(v2X, v2Y, v2Z);

            let v3X = this.vBuffer[v3Index*3];
            let v3Y = this.vBuffer[v3Index*3 + 1];
            let v3Z = this.vBuffer[v3Index*3+2];
            let v3 = vec3.fromValues(v3X, v3Y, v3Z);

            let outA = vec3.create();
            let outB = vec3.create();
            vec3.subtract(outA, v2, v1);
            vec3.subtract(outB, v3, v1);
            let N = vec3.dot(outA, outB);
            this.nBuffer[v1Index*3] += this.nBuffer[v1Index*3] + N;
            this.nBuffer[v1Index*3 + 1] += this.nBuffer[v1Index*3 + 1] + N;
            this.nBuffer[v1Index*3 + 2] += this.nBuffer[v1Index*3 + 2] + N;
            let n1 = vec3.fromValues(this.nBuffer[v1Index*3], this.nBuffer[v1Index*3 + 1], this.nBuffer[v1Index*3 + 2]);
            vec3.normalize(n1, n1);
            this.nBuffer[v1Index*3] = n1[0];
            this.nBuffer[v1Index*3 + 1] = n1[1];
            this.nBuffer[v1Index*3 + 2] = n1[2];

            this.nBuffer[v2Index*3] += this.nBuffer[v2Index*3] + N;
            this.nBuffer[v2Index*3 + 1] += this.nBuffer[v2Index*3 + 1] + N;
            this.nBuffer[v2Index*3 + 2] += this.nBuffer[v2Index*3 + 2] + N;
            let n2 = vec3.fromValues(this.nBuffer[v2Index*3], this.nBuffer[v2Index*3 + 1], this.nBuffer[v2Index*3 + 2]);
            vec3.normalize(n2, n2);
            this.nBuffer[v2Index*3] = n2[0];
            this.nBuffer[v2Index*3 + 1] = n2[1];
            this.nBuffer[v2Index*3 + 2] = n2[2];

            this.nBuffer[v3Index*3] += this.nBuffer[v3Index*3] + N;
            this.nBuffer[v3Index*3 + 1] += this.nBuffer[v3Index*3 + 1] + N;
            this.nBuffer[v3Index*3 + 2] += this.nBuffer[v3Index*3 + 2] + N;
            let n3 = vec3.fromValues(this.nBuffer[v3Index*3], this.nBuffer[v3Index*3 + 1], this.nBuffer[v3Index*3 + 2]);
            vec3.normalize(n3, n3);
            this.nBuffer[v3Index*3] = n3[0];
            this.nBuffer[v3Index*3 + 1] = n3[1];
            this.nBuffer[v3Index*3 + 2] = n3[2];
        }
    }
    /**
     * Set the vertex heights according to a slow but simple noise generating
     * algorithm. We repeatedly parition the terrain using a random cutting plane.
     * On one side of the plane we raise the terrain, on the other side we lower it.
     * @param {number} N the number of times to parition the terrain grad and 
     *                  adjust the heights on each side.
     * @param {number} delta the amount to raise (and lower) the patitioned vertices
     */
    setHeightsByPartition(N, delta) {
        if (N == 0) {
            return;
        }
        let randomX = Math.random() * (this.maxX - this.minX) + this.minX;
        let randomY = Math.random() * (this.maxY - this.minY) + this.minY;
        let p = vec3.fromValues(randomX, randomY, 0);
        let randomRadian = Math.random() * Math.PI*2;
        let n = vec3.fromValues(Math.cos(randomRadian), Math.sin(randomRadian), 0);
        //console.log(n);
        for(let i = 0; i <= this.div; i++) {
            for (let j = 0; j <= this.div; j++) {
                let b = vec3.create();
                this.getVertex(b, i, j);
                vec3.subtract(b, b, p);
                //console.log(b);
                let signTest = vec3.dot(b, n);
                if(signTest > 0) {
                    this.offsetHeight(delta, i, j);
                } else {
                    this.offsetHeight(-1*delta, i, j);
                }

            }
        }
        this.setHeightsByPartition(N-1, delta);
    }

    /**
     * Print vertices and triangles to console for debugging
     */
    printBuffers() {
        for(var i=0;i<this.numVertices;i++) {
            console.log("v ", this.vBuffer[i*3], " ", 
                                this.vBuffer[i*3 + 1], " ",
                                this.vBuffer[i*3 + 2], " ");
                        
        }
        
        for(var i=0;i<this.numFaces;i++) {
            console.log("f ", this.fBuffer[i*3], " ", 
                                this.fBuffer[i*3 + 1], " ",
                                this.fBuffer[i*3 + 2], " ");
                        
        }
    }

    /**
     * Generates line values from faces in faceArray
     * to enable wireframe rendering
     */
    generateLines() {
        var numTris=this.fBuffer.length/3;
        for(var f=0;f<numTris;f++) {
            var fid=f*3;
            this.eBuffer.push(this.fBuffer[fid]);
            this.eBuffer.push(this.fBuffer[fid+1]);
            
            this.eBuffer.push(this.fBuffer[fid+1]);
            this.eBuffer.push(this.fBuffer[fid+2]);
            
            this.eBuffer.push(this.fBuffer[fid+2]);
            this.eBuffer.push(this.fBuffer[fid]);
        }
    }
}
