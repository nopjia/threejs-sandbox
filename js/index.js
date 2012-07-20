c = {};
c.CAM_FOV  = 45;
c.CAM_NEAR = 1;
c.CAM_FAR  = 200;
c.FOG_NEAR = 10;
c.FOG_FAR  = 200;

g = {};
g.container, g.renderer, g.scene, g.camera, g.controls
g.composer, g.postprocess;

g.height = window.innerHeight;
g.width  = window.innerWidth;

function init() {
  g.renderer = new THREE.WebGLRenderer({ 
    clearAlpha: 1, 
    clearColor: 0x000000,
    antialias: true
  });
  g.renderer.setSize( g.width, g.height );
  g.renderer.autoClear = false;

  g.container = document.getElementById("container");
  g.container.appendChild( g.renderer.domElement );

  var ORIGIN = new THREE.Vector3();
  g.camera = new THREE.PerspectiveCamera(
    c.CAM_FOV, 
    g.width/g.height,
    c.CAM_NEAR,
    c.CAM_FAR
  );
  g.camera.position.set(0, 5, 10);
  g.camera.lookAt(ORIGIN);

  g.scene = new THREE.Scene();
  g.scene.add(g.camera);

  g.controls = new THREE.TrackballControls(g.camera, g.container);
  g.controls.rotateSpeed = 1.0;
  g.controls.zoomSpeed = 1.2;
  g.controls.panSpeed = 1.0;    
  g.controls.dynamicDampingFactor = 0.3;
  g.controls.staticMoving = false;
  g.controls.noZoom = false;
  g.controls.noPan = false;

  initScene();

  g.postprocess = {};
  g.postprocess.enabled = true;
  g.postprocess.depthMaterial = new THREE.MeshDepthMaterial();
  initPostprocessing();

  g.stats = new Stats();
  g.stats.domElement.style.position = 'absolute';
  g.stats.domElement.style.top = '0px';
  g.stats.domElement.style.zIndex = 100;
  g.container.appendChild( g.stats.domElement );

  window.addEventListener( 'resize', onWindowResize, false );
}

function update() {
  animate();
  g.stats.update();
  g.controls.update();

  // render
  g.renderer.clear();
  
  if (g.postprocess.enabled) {
    // render depth buffer
    g.scene.overrideMaterial = g.postprocess.depthMaterial;
    g.renderer.render( g.scene, g.camera, g.postprocess.rtDepth, true );

    // render from composer
    g.composer.render(0.1);
  }
  else {
    g.renderer.render( g.scene, g.camera );
  }

/*
  if (g.postprocess.enabled) {

    // render scene into texture
    g.scene.overrideMaterial = null;
    g.renderer.render( g.scene, g.camera, g.postprocess.dof.rtColor, true );

    // render depth into texture
    g.scene.overrideMaterial = new THREE.MeshDepthMaterial();
    g.renderer.render( g.scene, g.camera, g.postprocess.rtDepth, true );
    //g.renderer.render( g.scene, g.camera );

    // render composite
    g.renderer.render( g.postprocess.scene, g.postprocess.camera );
  }
  else 
    g.renderer.render( g.scene, g.camera );
*/
  requestAnimationFrame(update);
};

function onWindowResize(event) {
  g.width = window.innerWidth;
  g.height = window.innerHeight;

  g.renderer.setSize( g.width, g.height );

  g.camera.aspect = g.width / g.height;
  g.camera.updateProjectionMatrix();
};

function animate() {
  //debug test
  for (var i=4; i<g.scene.children.length; i++) {
    g.scene.children[i].rotation.x += 0.01;
    g.scene.children[i].rotation.y += 0.01;
  }
}

function initPostprocessing() {

  // init depth buffer
  var pars = { 
    minFilter: THREE.LinearFilter, 
    magFilter: THREE.LinearFilter, 
    format: THREE.RGBFormat 
  };
  g.postprocess.rtDepth = new THREE.WebGLRenderTarget( g.width, g.height, pars );

  // passes
  var renderPass = new THREE.RenderPass( g.scene, g.camera );
  var effectBloom = new THREE.BloomPass( 1.0 );
  var effectScreen = new THREE.ShaderPass( THREE.ShaderExtras["screen"] );

  // dof pass
  g.postprocess.dof = new THREE.ShaderPass( Shaders["depthOfField"] );
  g.postprocess.dof.uniforms[ "tDepth" ].texture = g.postprocess.rtDepth;
  g.postprocess.dof.uniforms[ "focus" ].value = 1.0;
  g.postprocess.dof.uniforms[ "maxblur" ].value = 2.0;
  g.postprocess.dof.uniforms[ "h" ].value = 1.0/g.width;
  g.postprocess.dof.uniforms[ "v" ].value = 1.0/g.height;

  g.postprocess.dof.renderToScreen = true;

  // composer
  g.composer = new THREE.EffectComposer( g.renderer );
  g.composer.addPass( renderPass );
  g.composer.addPass( g.postprocess.dof );
  // g.composer.addPass( effectBloom );
  // g.composer.addPass( effectScreen );
}

function initPostprocessingDof() {
  g.postprocess.scene = new THREE.Scene();

  g.postprocess.camera = new THREE.OrthographicCamera( 
    g.width/-2, g.width/2, g.height/2, g.height/-2, -1, 1 );
  g.postprocess.scene.add( g.postprocess.camera );

  var pars = { 
    minFilter: THREE.LinearFilter, 
    magFilter: THREE.LinearFilter, 
    format: THREE.RGBFormat 
  };
  g.postprocess.rtDepth = new THREE.WebGLRenderTarget( g.width, g.height, pars );

  var shader = Shaders[ "depthOfField" ];
  g.postprocess.dof = {};  
  g.postprocess.dof.rtColor = new THREE.WebGLRenderTarget( g.width, g.height, pars );

  g.postprocess.dof.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

  g.postprocess.dof.uniforms[ "tDepth" ].texture = g.postprocess.rtDepth;
  g.postprocess.dof.uniforms[ "tColor" ].texture = g.postprocess.dof.rtColor;
  g.postprocess.dof.uniforms[ "focus" ].value = 1.0;
  g.postprocess.dof.uniforms[ "maxblur" ].value = 2.0;
  g.postprocess.dof.uniforms[ "h" ].value = 1.0/g.width;
  g.postprocess.dof.uniforms[ "v" ].value = 1.0/g.height;

  g.postprocess.dof.material = new THREE.ShaderMaterial( {
    uniforms: g.postprocess.dof.uniforms,
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader
  } );

  g.postprocess.quad = new THREE.Mesh( 
    new THREE.PlaneGeometry( window.innerWidth, window.innerHeight ), 
    g.postprocess.dof.material 
  );
  g.postprocess.quad.rotation.x = Math.PI / 2;
  g.postprocess.scene.add( g.postprocess.quad );
}

function initScene() {
  var light, mesh, node;

  // front light
  light = new THREE.PointLight( 0xffffff, 0.8, 1000 );
  light.position.set( 15, 20, 10 );
  g.scene.add( light );

  // back light
  light = new THREE.PointLight( 0xffffff, 0.2, 1000 );
  light.position.set( -10, 10, -15 );
  g.scene.add( light );

  // ground
  (function() {
    var imageCanvas = document.createElement( "canvas" );
    var context = imageCanvas.getContext( "2d" );

    imageCanvas.width = imageCanvas.height = 128;

    context.fillStyle = "#CCC";
    context.fillRect( 0, 0, 128, 128 );

    context.fillStyle = "#fff";
    context.fillRect( 0, 0, 64, 64);
    context.fillRect( 64, 64, 64, 64 );

    var textureCanvas = new THREE.Texture( imageCanvas, 
      THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
    var materialCanvas = new THREE.MeshBasicMaterial( { map: textureCanvas } );

    textureCanvas.needsUpdate = true;
    textureCanvas.repeat.set( 1000, 1000 );

    var geometry = new THREE.PlaneGeometry( 100, 100 );

    var meshCanvas = new THREE.Mesh( geometry, materialCanvas );
    meshCanvas.scale.set( 100, 100, 100 );

    g.scene.add(meshCanvas);
  })();

  // red cube
  for (var x=-80; x<=80; x+=10)
  for (var z=-200; z<=0; z+=10) {
    mesh = new THREE.Mesh(
      new THREE.CubeGeometry( 2.5, 2.5, 2.5 ),
      new THREE.MeshLambertMaterial( { color: 0xFF0000 } )
    );
    mesh.position.set(x, 1.0, z);
    g.scene.add(mesh);
  }

  g.scene.fog = new THREE.Fog( 0x000000, c.FOG_NEAR, c.FOG_FAR );
}

$(function() {
  init();  
  update();
});