/**
 * @fileoverview Terrain - 3D Terrain Object in WebGL
 * @author Yani Julian <bjulia2@illinois.edu>  
 */

/** Class implementing 3D terrain. */
class Terrain {
    /**
     * Initialize members of a Terrain object
     * @param {number} div Number of triangles along x axis and y axis
     * @param {number} minX Minimum X coordinate value
     * @param {number} maxX Maximum X coordinate value
     * @param {number} minY Minimum Y coordinate value
     * @param {number} maxY Maximum Y coordinate value
     */
    constructor(div,minX,maxX,minY,maxY) {
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
    setVertex(v,i) {
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
    getVertex(v,i) {
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
    setNormal(n,i) {
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
    getNormal(n,i) {
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
     * Returns the highest and lowest z coordinates/height as (min,max)
     * @param {Object} out an output array of 2 to hold min/max of height
     */
    getHeightInterval(out) {
        let minZ = 1.0;
        let maxZ = -1.0;
        for (let i = 0; i < this.numVertices; i ++) {
            let vertex = vec3.create();
            this.getVertex(vertex, i);
            let currentZ = vertex[2];
            if (currentZ > maxZ) {
                maxZ = currentZ;
            }
            if (currentZ < minZ) {
                minZ = currentZ;
            }
        }
        out[0] = minZ;
        out[1] = maxZ;
    }

    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers() {
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
    
        // Setup Edges  
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
    drawTriangles() {
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
    drawEdges() {
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
                this.nBuffer.push(0);
                this.nBuffer.push(0);
            }
        }
        for(var i = 0; i < this.div; i++) {
            for (var j = 0; j < this.div; j++) {
                var vid = i*(this.div+1) +j;
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
        this.setHeightsByPartition(300, 0.005);
        this.generateNormals();
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
            let n = vec3.create();
            vec3.cross(n, v2_minus_v1, v3_minus_v1);
           
            
            let n1 = vec3.create();
            let n2 = vec3.create();
            let n3 = vec3.create();
            this.getNormalsByFaceIndex(n1, n2, n3, i);
            vec3.add(n1, n1, n1);
            vec3.add(n2, n2, n2);
            vec3.add(n3, n3, n2);

            vec3.add(n1, n1, n);
            vec3.add(n2, n2, n);
            vec3.add(n3, n3, n);

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
        let randomX = Math.seededRandom() * (this.maxX - this.minX) + this.minX;
        let randomY = Math.seededRandom() * (this.maxY - this.minY) + this.minY;
        let p = vec3.fromValues(randomX, randomY, 0);
        let randomRadian = Math.seededRandom() * Math.PI*2;
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
     * Prints the min/max of z coordinates to console for debugging
     */
    printHeightInterval(){
        let heightInterval = vec2.create();
        this.getHeightInterval(heightInterval);
        console.log("Min Height: " + heightInterval[0]);
        console.log("Max Height: " + heightInterval[1]);

        let minZ = heightInterval[0];
        let maxZ = heightInterval[1];
        let intervalLength = Math.abs(minZ) + Math.abs(maxZ);
        let interval_30 = intervalLength * 0.3;
        let interval_20 = intervalLength * 0.2;

        let topStartZ = maxZ - interval_20; // top color is 20 percent
        let midStartZ = topStartZ - interval_30; // mid color is 30 percent 
        let baseStartZ = midStartZ - interval_30; // base color is 30 percent
        let botStartZ = minZ;

        console.log("intervals: topStartZ->" + topStartZ + ", midStartZ->" + midStartZ + ", baseStartZ->" + baseStartZ + ", botStartZ->" + botStartZ);
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

/**
 * Psuedo Random Number Generator Based on a seed to reproduce random results
 * Source: http://indiegamr.com/generate-repeatable-random-numbers-in-js/
 */
Math.seededRandom = function() { 
    if (Math.seed == undefined) {
        // Initial Seed to be used in the Psuedo Random Number Generator for Math.seededRandom
        let randomSeed = Math.floor(Math.random() * 999999);
        console.log("using seed: " + randomSeed);
        Math.seed = randomSeed;
        //Math.seed = 186435; //522277
    }
    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    var rnd = Math.seed / 233280;
    return rnd;
}