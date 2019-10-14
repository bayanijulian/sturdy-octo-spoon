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
    * Set the x,y,z coordinates of an indexed vertex
    * @param {Object} v an array of length 3 holding x,y,z coordinates
    * @param {number} i the index of the vertex
    */
    setVertex(v,i)
    {
        var vid = i*3;
        this.vBuffer[vid] = v[0];
        this.vBuffer[vid + 1] = v[1];
        this.vBuffer[vid + 2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of an indexed vertex
    * @param {Object} v output array of length 3 holding x,y,z coordinates
    * @param {number} i the index of the vertex
    */
    getVertex(v,i)
    {
        var vid = i*3;
        v[0] = this.vBuffer[vid];
        v[1] = this.vBuffer[vid + 1];
        v[2] = this.vBuffer[vid + 2];
    }
    
    /**
    * Set the x,y,z coordinates of a normal
    * @param {Object} n an array of length 3 holding x,y,z coordinates
    * @param {number} i the index of the normal
    */
    setNormal(n,i)
    {
        var nid = i*3;
        this.nBuffer[nid] = n[0];
        this.nBuffer[nid + 1] = n[1];
        this.nBuffer[nid + 2] = n[2];
    }
   
   /**
   * Return the x,y,z coordinates of a normal
   * @param {Object} n output array of length 3 holding x,y,z coordinates
   * @param {number} i the index of the normal
   */
    getNormal(n,i)
    {
        var nid = i*3;
        n[0] = this.nBuffer[nid];
        n[1] = this.nBuffer[nid + 1];
        n[2] = this.nBuffer[nid + 2];
    }

    /**
     * Returns the vertex indices of the triangle for the face
     * @param {Object} out output array of length 3 holding the triangle vertex indices
     * @param {number} i the index of the face
     */
    getVertexIndicesByFaceIndex(out, i) {
        var fid = i*3;
        out[0] = this.fBuffer[fid];
        out[1] = this.fBuffer[fid+1];
        out[2] = this.fBuffer[fid+2];
    }

    /**
     * Returns the 3 vertices of the triangle for the face
     * @param {Object} v1 output array of length 3 for vertex position v1
     * @param {Object} v2 output array of length 3 for vertex position v2
     * @param {Object} v3 output array of length 3 for vertex position v3
     * @param {number} i the index of the face
     */
    getVerticesByFaceIndex(v1, v2, v3, i) {
        let vertexIndices = vec3.create();
        this.getVertexIndicesByFaceIndex(vertexIndices, i);
        this.getVertex(v1, vertexIndices[0]);
        this.getVertex(v2, vertexIndices[1]);
        this.getVertex(v3, vertexIndices[2]);
    }

    /**
     * Returns the 3 normals for each vertex of the triangle for the face
     * @param {Object} n1 output array of length 3 for vertex normal v1
     * @param {Object} n2 output array of length 3 for vertex normal v2
     * @param {Object} n3 output array of length 3 for vertex normal v3
     * @param {number} i the index of the face
     */
    getNormalsByFaceIndex(n1, n2, n3, i) {
        let vertexIndices = vec3.create();
        this.getVertexIndicesByFaceIndex(vertexIndices, i);
        this.getNormal(n1, vertexIndices[0]);
        this.getNormal(n2, vertexIndices[1]);
        this.getNormal(n3, vertexIndices[2]);
    }

    /**
     * Sets the 3 normals for each vertex of the triangle for the face
     * @param {Object} n1 an array of length 3 for vertex normal v1
     * @param {Object} n2 an array of length 3 for vertex normal v2
     * @param {Object} n3 an array of length 3 for vertex normal v3
     * @param {number} i the index of the face
     */
    setNormalsByFaceIndex(n1, n2, n3, i) {
        let vertexIndices = vec3.create();
        this.getVertexIndicesByFaceIndex(vertexIndices, i);
        this.setNormal(n1, vertexIndices[0]);
        this.setNormal(n2, vertexIndices[1]);
        this.setNormal(n3, vertexIndices[2]);
    }

    /**
     * Offsets the vertex height at the index specified by a delta amount 
     * @param {number} delta offset the height of the vertex
     * @param {number} i the index of the vertex
     */
    offsetHeight(delta, i) {
        let pos = vec3.create()
        this.getVertex(pos, i);
        pos[2] += delta;
        this.setVertex(pos, i);
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

    /**
     * Computes per vertex normals on the mesh
     */
    generateNormals() {
        for(var i=0;i<this.numFaces;i++) {
            let v1 = vec3.create();
            let v2 = vec3.create();
            let v3 = vec3.create();
            this.getVerticesByFaceIndex(v1, v2, v3, i);

            let v2_minus_v1 = vec3.create();
            vec3.subtract(v2_minus_v1, v2, v1);

            let v3_minus_v1 = vec3.create();
            vec3.subtract(v3_minus_v1, v3, v1);
            let n = vec3.dot(v2_minus_v1, v3_minus_v1);
            let nVec = vec3.fromValues(n, n, n);
            
            let n1 = vec3.create();
            let n2 = vec3.create();
            let n3 = vec3.create();
            this.getNormalsByFaceIndex(n1, n2, n3, i);
            vec3.add(n1, n1, n1);
            vec3.add(n2, n2, n2);
            vec3.add(n3, n3, n2);

            vec3.add(n1, n1, nVec);
            vec3.add(n2, n2, nVec);
            vec3.add(n3, n3, nVec);

            this.setNormalsByFaceIndex(n1, n2, n3, i);
        }
        for (var i = 0; i < this.numVertices; i++) {
            let n = vec3.create();
            this.getNormal(n, i);
            vec3.normalize(n, n);
            this.setNormal(n, i);
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
        for(let i = 0; i < this.numVertices; i++) {
            let b = vec3.create();
            this.getVertex(b, i);
            vec3.subtract(b, b, p);
            //console.log(b);
            let signTest = vec3.dot(b, n);
            if(signTest > 0) {
                this.offsetHeight(delta, i);
            } else {
                this.offsetHeight(-1*delta, i);
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
