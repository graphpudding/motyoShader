import './styles/index.scss';
import './assets/fonts/Roboto-Regular.ttf';
import './component.js';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
var model = "PickUP"; //"BOT_" + window.location.search.replace('?model=', '');
var canvas = document.getElementById("babylon");
var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function() {
  return new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false
  });
};
var createScene = function() {
    let scene = new BABYLON.Scene(engine);
    var sphere = BABYLON.MeshBuilder.CreateCylinder("ball", {
      height: 1,
      diameter: .1
    }, scene);
    var camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(90), BABYLON.Tools.ToRadians(65), 1.5, BABYLON.Vector3.Zero(), scene);
    camera.lowerRadiusLimit = null;
    //scene.cameras[0].position = new BABYLON.Vector3(118.09937661819453, 31.54361658096592, 109.08371909435834);
    let mesh;
    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);
    //let mainTextureA = new BABYLON.Texture(model + "/" + model + "_2.png");
    BABYLON.SceneLoader.AppendAsync("", model + ".glb", scene).then(() => {
      mesh = scene.getMeshByName("Graph");
      mesh.setParent(null);
      camera.target = mesh.position;
      addShader(mesh);
      scene.clearColor = new BABYLON.Color3(.44, .55, .86);
    })
    //mesh = BABYLON.Mesh.CreatePlane("boxTarget", 10, scene);

    function addShader(mesh) {
      BABYLON.Effect.ShadersStore.customVertexShader = `
    precision highp float;
    // Attributes
    attribute vec3 position;
    attribute vec3 color;
    attribute vec3 normal;
    attribute vec2 uv;
    attribute vec2 uv2;

    // Uniforms
    uniform mat4 worldViewProjection;
    uniform float T;

    // Varying
    varying vec4 Cd;

    void main(void) {
      float r = uv.x+3.;
      vec3 pos = position;
      pos.y += clamp(uv.x+T*2.,0.,1.)*uv.y*r;
      pos += normal*uv2.x*(1.-clamp(1.-abs((uv.x+T*2.)*2.-1.),0.,1.));
      float s = sin(-T*uv.y*4.);
      float c = cos(-T*uv.y*4.);
      mat2 m = mat2(c, -s, s, c);
      vec2 p2 = pos.xz*m;
      gl_Position = worldViewProjection * vec4(p2.x, pos.y, p2.y,1.);
      Cd = vec4(color.rgb,uv2.y);
    }
 `;
      BABYLON.Effect.ShadersStore.customFragmentShader = `
        precision highp float;
        varying vec4 Cd;
        void main(void) {
          gl_FragColor = vec4(Cd.rgb,1.);
          if (Cd.w<.1) discard;
        }

    `;
      var shader = new BABYLON.ShaderMaterial("shaderGradient", scene, "custom", {
          attributes: ["uv2", "uv", "color", "position", "normal"],
          defines: ["#define INSTANCES"],
          uniforms: ["T", "world", "worldViewProjection"]
          });
        //  mainTextureA.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
        var time = 0;
        var time1 = 0; scene.registerBeforeRender(function() {
            if (!mesh) return;
            time += 1 / engine.getFps();
              //time1 += 10 / (engine.getFps());
              shader.setFloat("T", (Math.sin(time)+1)/2);
              //shader.setFloat("angle", (Math.sin(time1) + 1) / 2);
              //mesh.position.y = Math.sin(time);
            })
          //ljnhjhvhgxrt
          mesh.material = shader;
        }


        function randomIntFromInterval(min, max) { // min and max included
          return Math.floor(Math.random() * (max - min + 1) + min);
        }

        return scene;
      };

      var asyncEngineCreation = async function() {
        console.log(createDefaultEngine())
        try {
          return createDefaultEngine();
        } catch (e) {
          console.log("the available createEngine function failed. Creating the default engine instead");
          return createDefaultEngine();
        }
      }
      window.initFunction = async function() {

        engine = await asyncEngineCreation();
        if (!engine) throw 'engine should not be null.';
        scene = createScene();
        window.scene = scene;
      };
      window.initFunction().then(() => {
        sceneToRender = scene
        engine.runRenderLoop(function() {
          if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
          }
        });
      });

      // Resize
      window.addEventListener("resize", function() {
        engine.resize();
      });
