/*
  All the three.js for the page's 3D viewers: the one in the header and the one on each piece
  card. Kept free of React and loaded with a dynamic import, so three.js only downloads on
  this page and only after the page is up.

  The necklaces come from scripts/pmp-to-glb.mjs, which names their nodes after the .mdl meshes.
  The collars are exported straight from Blender and keep the names their parts have there.
  Each model is only downloaded when it is first shown.
*/

import {
  BackSide,
  Box3,
  BoxGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const FIELD_OF_VIEW = 26;
const START_YAW = 0.35;
const START_PITCH = 0.26;
const PITCH_RANGE = [-0.2, 0.75] as const;
const FRAMED_PITCH = 0.55; // the framing leaves room to tilt this far before anything gets cut off

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/*
  A thin film over polished metal, the kind that makes soap bubbles and oil slicks shimmer.
  Its colour depends on the angle it is seen from, so every facet shows its own colour and
  they all shift as the necklace turns. Two things make that easy to see. A real film only
  shifts a little with the angle, so here its thickness follows the angle as well, which
  runs each facet through a few rounds of colours on its way from face on to edge on. And
  the metal's pure white is toned down, because over a perfect mirror the colours cancel out.

  `sweep` is for chains. A round link faces every way at once, so all its colours blur into
  grey at this size. A chain's film therefore barely follows the facing, and follows the
  direction the camera sees each spot from instead: that lays the colours along the chain
  and makes the links run through them as it turns.
*/
type Film = { faceOn: number; edgeOn: number; sweep: number }; // nm, nm, and nm per unit of view direction

const CHARM_FILM: Film = { faceOn: 600, edgeOn: 200, sweep: 0 };
const CHAIN_FILM: Film = { faceOn: 430, edgeOn: 410, sweep: 650 };

function makeIridescent(part: Mesh, { faceOn, edgeOn, sweep }: Film) {
  const film = new MeshPhysicalMaterial({
    color: "#d9d9d9",
    metalness: 1,
    roughness: 0.2,
    iridescence: 1,
    iridescenceIOR: 1.8,
    iridescenceThicknessMinimum: edgeOn,
    iridescenceThicknessMaximum: faceOn,
  });
  /*
    three.js takes the thickness from a number or a texture, so the angles are added to its
    shader by hand. This leans on names inside three's physical shader (as of r187).
  */
  film.onBeforeCompile = (shader) => {
    shader.uniforms.filmSweep = { value: sweep };
    shader.fragmentShader = `uniform float filmSweep;\n${shader.fragmentShader}`.replace(
      "#include <lights_physical_fragment>",
      `#include <lights_physical_fragment>
      vec3 filmView = normalize( vViewPosition );
      material.iridescenceThickness = mix( iridescenceThicknessMinimum, iridescenceThicknessMaximum, saturate( dot( normal, filmView ) ) ) + filmSweep * ( filmView.x + filmView.y );`,
    );
  };
  refinish(part, film);
}

/*
  Puts a finish made here in place of whatever the model gave this part, baked textures
  included. Every part gets a material of its own, because parts in a model often share one
  (anything Blender exported without a material does) and may be finished differently here.
*/
function refinish(part: Mesh, finish: MeshStandardMaterial) {
  const replaced = part.material as MeshStandardMaterial;
  finish.side = replaced.side; // a thin shell, like a collar's band, shows both of its sides
  part.material = finish;
  replaced.map?.dispose();
  replaced.roughnessMap?.dispose();
  replaced.dispose();
}

const makeIridescentCharm = (charm: Mesh) => makeIridescent(charm, CHARM_FILM);
const makeIridescentChain = (chain: Mesh) => makeIridescent(chain, CHAIN_FILM);

/* black metal: dark, but still bright enough in the reflections to read as metal */
function makeBlackMetal(part: Mesh) {
  refinish(part, new MeshStandardMaterial({ color: "#4a4450", metalness: 1, roughness: 0.24 }));
}

/* polished silver, the same as the mod gives the star */
function makeSilver(part: Mesh) {
  refinish(part, new MeshStandardMaterial({ color: "#ffffff", metalness: 1, roughness: 0.2 }));
}

/*
  The models the viewer can show. `finishes` are the looks set here instead of by the model,
  keyed by the name of the part they go on: the materials in the files cannot describe a thin
  film, and some are still untouched defaults.
*/
export type ModelId = "necklace" | "puppy" | "star" | "dom" | "shie";

type Model = { piece: "necklace" | "collar"; source: string; finishes: Record<string, (part: Mesh) => void> };

const MODELS: Record<ModelId, Model> = {
  /* mesh0 is the text, mesh1 the heart, mesh2 and mesh3 the chain */
  necklace: { piece: "necklace", source: "/christmas-market/necklace.glb", finishes: { mesh1: makeIridescentCharm } },
  /* mesh0 is the text, mesh1 the bone, mesh2 the chain */
  puppy: {
    piece: "necklace",
    source: "/christmas-market/puppy.glb",
    finishes: { mesh0: makeBlackMetal, mesh1: makeIridescentCharm, mesh2: makeBlackMetal },
  },
  /* mesh0 is the star, which keeps the polished silver the mod gives it; mesh1 is the chain */
  star: { piece: "necklace", source: "/christmas-market/star.glb", finishes: { mesh1: makeIridescentChain } },
  /* Cylinder057 is the band and the strap end over its back, as a group of two meshes */
  dom: {
    piece: "collar",
    source: "/christmas-market/collar-dom.glb",
    finishes: { Cylinder057: makeBlackMetal, Spikes: makeIridescentCharm, Text: makeIridescentCharm },
  },
  /* the same band; here Text is the text and the hearts beside it, as one mesh */
  shie: {
    piece: "collar",
    source: "/christmas-market/collar-shie.glb",
    finishes: { Cylinder057: makeBlackMetal, Text: makeSilver },
  },
};

/*
  The collars come out of Blender the way they sit on a neck, leaning forward with the front
  edge down. Turned around like that they end up edge on to the camera, so the viewer stands
  them level.
*/
const COLLAR_LEAN = 0.276; // radians

/*
  A level collar's faces are upright, and seen from above an upright mirror reflects the
  floor, which is dark in this studio: silver text came out black. So while a collar is on
  show the studio is tipped until its bright sky is what those faces reflect.
*/
const COLLAR_STUDIO_TILT = 0.7; // radians

/* a model that is ready to show: centred on the turntable and measured for framing */
type Loaded = { model: Group; reach: number; rise: number };

function discard(model: Group) {
  model.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.dispose();
    (Array.isArray(object.material) ? object.material : [object.material]).forEach((material: Material) => material.dispose());
  });
}

/*
  A tiny studio to reflect. It is kept close to neutral so silver reads as silver and gold as
  gold, with white panels for crisp highlights and one pink strip as a nod to the page around
  it. Rendered once into an environment map.
*/
function pinkWinterEnvironment(renderer: WebGLRenderer) {
  const scene = new Scene();
  const disposables: { dispose(): void }[] = [];

  const dome = new SphereGeometry(20, 32, 16);
  const sky = new Color("#f6f1f4");
  const horizon = new Color("#a79aa3");
  const ground = new Color("#2b2229");
  const shade = new Color();
  const position = dome.getAttribute("position");
  const colors: number[] = [];
  for (let i = 0; i < position.count; i++) {
    const height = position.getY(i) / 20;
    if (height > 0) shade.lerpColors(horizon, sky, Math.min(1, height * 1.4));
    else shade.lerpColors(horizon, ground, Math.min(1, -height * 2.4));
    colors.push(shade.r, shade.g, shade.b);
  }
  dome.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const domeMaterial = new MeshBasicMaterial({ vertexColors: true, side: BackSide });
  scene.add(new Mesh(dome, domeMaterial));
  disposables.push(dome, domeMaterial);

  const panel = (color: string, strength: number, size: [number, number], at: [number, number, number]) => {
    const geometry = new BoxGeometry(size[0], size[1], 0.1);
    const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(strength) });
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...at);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
    disposables.push(geometry, material);
  };
  panel("#ffffff", 16, [9, 5], [3, 14, 9]);
  panel("#ffffff", 8, [3, 12], [-15, 2, 5]);
  panel("#ffffff", 7, [2.5, 10], [15, 6, -1]);
  panel("#ff8fbd", 7, [9, 2.5], [0, -5, -15]);

  const generator = new PMREMGenerator(renderer);
  const target = generator.fromScene(scene, 0.035);
  generator.dispose();
  disposables.forEach((item) => item.dispose());
  return target;
}

export type NecklaceViewer = {
  /* swaps in another model, keeping the current turn and tilt; settles once it is on screen */
  show(id: ModelId): Promise<void>;
  dispose(): void;
};

export async function mountNecklace(container: HTMLElement, first: ModelId): Promise<NecklaceViewer> {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = NeutralToneMapping;

  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img"); // show() gives it a label that names the piece on screen
  /* vertical swipes keep scrolling the page; sideways drags turn the necklace */
  canvas.style.touchAction = "pan-y";

  const scene = new Scene();
  const environment = pinkWinterEnvironment(renderer);
  scene.environment = environment.texture;

  /* a white key light for shape, and a pink one from behind for a crisp rim */
  const key = new DirectionalLight("#ffffff", 2.2);
  key.position.set(-2, 4, 5);
  const rim = new DirectionalLight("#ff8fbd", 2.4);
  rim.position.set(3, 2, -5);
  scene.add(key, rim);

  const camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 0.01, 10);
  const tilt = new Group();
  const spin = new Group();
  tilt.add(spin);
  scene.add(tilt);

  let reach = 1; // furthest the shown necklace gets from its turning axis
  let rise = 1; // half its height
  let shown: Loaded | null = null;
  let request = 0; // goes up with every show(), so a slow download cannot replace a newer pick
  let frame = 0;
  let disposed = false;
  let onScreen = true;
  let yaw = START_YAW;
  let pitch = START_PITCH;
  let velocity = 0; // radians per ms, left over from the last drag
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let lastFrame = performance.now();

  const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    /* back off until the necklace fits both ways, at any turn and a fair amount of tilt */
    const vertical = Math.tan((camera.fov * Math.PI) / 360);
    const tall = rise * Math.cos(FRAMED_PITCH) + reach * Math.sin(FRAMED_PITCH);
    const distance = reach + Math.max(reach / (vertical * camera.aspect), tall / vertical) * 1.06;
    camera.position.set(0, 0, distance);
    camera.near = distance / 20;
    camera.far = distance * 4;
    camera.updateProjectionMatrix();
    wake();
  }

  function render(now: number) {
    frame = 0;
    if (disposed) return;
    /* after a pause the gap is long: count it as one ordinary frame instead of a jump */
    const elapsed = now - lastFrame > 100 ? 16 : now - lastFrame;
    lastFrame = now;

    /* it only ever turns by hand: a drag, and the little glide left over once the drag lets go */
    let moving = dragging;
    if (!dragging && Math.abs(velocity) > 0.00002) {
      yaw += velocity * elapsed;
      velocity *= Math.exp(-elapsed / 320);
      moving = true;
    }

    tilt.rotation.x = pitch;
    spin.rotation.y = yaw;
    renderer.render(scene, camera);
    if (moving) wake();
  }

  /* draws one frame, and keeps drawing only while something is actually moving on screen */
  function wake() {
    if (frame || disposed || !onScreen || document.hidden) return;
    frame = requestAnimationFrame(render);
  }

  function onPointerDown(event: PointerEvent) {
    dragging = true;
    velocity = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = event.timeStamp;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    wake();
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging) return;
    const turn = (event.clientX - lastX) * 0.008;
    yaw += turn;
    /* touch only turns sideways, because vertical swipes belong to page scrolling */
    if (event.pointerType !== "touch") pitch = clamp(pitch + (event.clientY - lastY) * 0.006, ...PITCH_RANGE);
    const elapsed = Math.max(event.timeStamp - lastMove, 1);
    velocity = stillness.matches ? 0 : clamp(turn / elapsed, -0.012, 0.012);
    lastX = event.clientX;
    lastY = event.clientY;
    lastMove = event.timeStamp;
    wake();
  }

  function onPointerEnd(event: PointerEvent) {
    if (!dragging) return;
    dragging = false;
    if (event.timeStamp - lastMove > 80) velocity = 0;
    canvas.style.cursor = "grab";
    wake();
  }

  function onKeyDown(event: KeyboardEvent) {
    const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[event.key];
    if (!step) return;
    event.preventDefault();
    yaw += step[0];
    pitch = clamp(pitch + step[1], ...PITCH_RANGE);
    velocity = 0;
    wake();
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const loading = new Map<ModelId, Promise<Loaded>>();

  function load(id: ModelId) {
    let pending = loading.get(id);
    if (pending) return pending;

    pending = loader.loadAsync(MODELS[id].source).then((gltf) => {
      const model = gltf.scene;
      for (const [name, finish] of Object.entries(MODELS[id].finishes)) {
        /* a name is one mesh, or a group of them where the model split a part in two */
        model.getObjectByName(name)?.traverse((part) => {
          if (part instanceof Mesh) finish(part);
        });
      }

      if (MODELS[id].piece === "collar") model.rotation.x = -COLLAR_LEAN;
      model.updateMatrixWorld(true);
      const bounds = new Box3().setFromObject(model);
      const centre = bounds.getCenter(new Vector3());
      const point = new Vector3();
      let reach = 0;
      model.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        const position = object.geometry.getAttribute("position");
        for (let i = 0; i < position.count; i++) {
          point.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld).sub(centre);
          reach = Math.max(reach, Math.hypot(point.x, point.z));
        }
      });
      model.position.sub(centre);
      return { model, reach, rise: (bounds.max.y - bounds.min.y) / 2 };
    });
    /* a download that failed is forgotten, so asking again tries again */
    pending.catch(() => loading.delete(id));
    loading.set(id, pending);
    return pending;
  }

  async function show(id: ModelId) {
    const ticket = ++request;
    const next = await load(id);
    if (disposed || ticket !== request) return;
    if (shown) spin.remove(shown.model);
    spin.add(next.model);
    shown = next;
    ({ reach, rise } = next);
    scene.environmentRotation.x = MODELS[id].piece === "collar" ? COLLAR_STUDIO_TILT : 0;
    canvas.setAttribute("aria-label", `3D preview of a custom ${MODELS[id].piece}. Drag it, or use the arrow keys, to turn it around.`);
    resize();
  }

  await show(first).catch((error: unknown) => {
    environment.dispose();
    renderer.dispose();
    throw error;
  });

  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerEnd);
  canvas.addEventListener("pointercancel", onPointerEnd);
  canvas.addEventListener("keydown", onKeyDown);
  document.addEventListener("visibilitychange", wake);

  const sizeWatcher = new ResizeObserver(resize);
  sizeWatcher.observe(container);
  const viewWatcher = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    wake();
  });
  viewWatcher.observe(container);

  container.append(canvas);
  resize();

  return {
    show,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      sizeWatcher.disconnect();
      viewWatcher.disconnect();
      document.removeEventListener("visibilitychange", wake);
      canvas.remove();
      /* every model that was downloaded, and any that is still on its way */
      for (const pending of loading.values()) pending.then(({ model }) => discard(model), () => {});
      environment.dispose();
      renderer.dispose();
    },
  };
}
