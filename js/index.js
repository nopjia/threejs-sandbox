c = {};
c.CAM_FOV = 45;
c.CAM_NEAR = 1;
c.CAM_FAR = 1000;
c.FOG_NEAR = 10;
c.FOG_FAR = 100;

g = {};
g.container, g.renderer, g.scene, g.camera, g.controls;
g.height = window.innerHeight;
g.width  = window.innerWidth;

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

  // red cube
  mesh = new THREE.Mesh(
    new THREE.CubeGeometry( 5, 5, 5 ),
    new THREE.MeshLambertMaterial( { color: 0xFF0000 } )
  );
  node = new THREE.Object3D();
  node.position.y = 5;
  node.add(mesh);
  g.scene.add(node);

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

    var textureCanvas = new THREE.Texture( imageCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );
    var materialCanvas = new THREE.MeshBasicMaterial( { map: textureCanvas } );

    textureCanvas.needsUpdate = true;
    textureCanvas.repeat.set( 1000, 1000 );

    var geometry = new THREE.PlaneGeometry( 100, 100 );

    var meshCanvas = new THREE.Mesh( geometry, materialCanvas );
    meshCanvas.scale.set( 100, 100, 100 );

    g.scene.add(meshCanvas);
  })();

  g.scene.fog = new THREE.Fog( 0x000000, c.FOG_NEAR, c.FOG_FAR );
}

function animate() {
  //debug test
  g.scene.children[3].rotation.x += 0.01;
  g.scene.children[3].rotation.y += 0.01;
}

function init() {
  g.renderer = new THREE.WebGLRenderer({ 
    clearAlpha: 1, 
    clearColor: 0x000000,
    antialias: true
  });
  g.renderer.setSize( g.width, g.height );

  g.container = document.getElementById("container");
  g.container.appendChild( g.renderer.domElement );

  var ORIGIN = new THREE.Vector3();
  g.camera = new THREE.PerspectiveCamera(
    c.CAM_FOV, 
    g.width/g.height,
    c.CAM_NEAR, 
    c.CAM_FAR
  );
  g.camera.position.set(0, 5, 15);
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

  g.stats = new Stats();
  g.stats.domElement.style.position = 'absolute';
  g.stats.domElement.style.top = '0px';
  g.stats.domElement.style.zIndex = 100;
  g.container.appendChild( g.stats.domElement );

  window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize(event) {
  g.width = window.innerWidth;
  g.height = window.innerHeight;

  g.renderer.setSize( g.width, g.height );

  g.camera.aspect = g.width / g.height;
  g.camera.updateProjectionMatrix();
};

function update() {
  animate();
  g.stats.update();
  g.controls.update();
  g.renderer.render(g.scene, g.camera);

  requestAnimationFrame(update);
};

$(function() {
  init();  
  update();
});