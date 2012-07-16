Shaders = {
  
  // Apply (box) blur scaled to depth map

  "depthOfField": {

    uniforms: {
      tColor:   { type: "t", value: 0, texture: null },
      tDepth:   { type: "t", value: 1, texture: null },
      focus:    { type: "f", value: 1.0 },
      maxblur:  { type: "f", value: 1.0 },
      h:        { type: "f", value: 1.0/512.0 },
      v:        { type: "f", value: 1.0/512.0 }
    },

    vertexShader: [

      "varying vec2 vUv;",

      "void main() {",

        "vUv = vec2( uv.x, 1.0 - uv.y );",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

      "}"

    ].join("\n"),

    fragmentShader: [

      "uniform sampler2D tColor;",
      "uniform sampler2D tDepth;",
      "uniform float focus;",
      "uniform float maxblur;",
      "uniform float h;",
      "uniform float v;",

      "varying vec2 vUv;",

      "void main() {",
      "  vec4 sum = vec4( 0.0 );",
      
      "  float hf = h * maxblur * abs(texture2D(tDepth, vUv).x - focus);",
      "  float vf = v * maxblur * abs(texture2D(tDepth, vUv).x - focus);",
      
      "  for (float x = -4.0; x <= 4.0; x++) ",
      "  for (float y = -4.0; y <= 4.0; y++) ",
      "  {",
      "    float ux = vUv.x + x * hf;",
      "    float uy = vUv.y + y * vf;",
      
      "    sum += texture2D( tColor, vec2( ux, uy ) );",
      "  }",

      "  gl_FragColor = sum/81.0;",
      "}"

    ].join("\n")

  }

};