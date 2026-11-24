/*
  All the three.js for the header's necklace viewer. Kept free of React and loaded with a
  dynamic import, so three.js only downloads on this page and only after the page is up.

  The models come from scripts/pmp-to-glb.mjs, which names their nodes after the .mdl meshes.
  Each one is only downloaded when it is first shown.
*/

import {
  BackSide,
  Box3,
  BoxGeometry,
  Color,
  DataTexture,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  LinearFilter,
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
  A thin film over a charm's metal, so it shimmers through pastels as it turns. Two things
  make the colours show. The film gets thicker from one corner of the charm to the other,
  which spreads them into bands; at one thickness a flat face is a single flat tint. And the
  metal's pure white is toned down a little, because over a perfect mirror they cancel out.
*/
function makeIridescent(charm: Mesh) {
  /* the models have no texture coordinates, so lay one axis diagonally across the charm */
  const position = charm.geometry.getAttribute("position");
  const along = Array.from({ length: position.count }, (_, i) => position.getX(i) + position.getY(i));
  const low = Math.min(...along);
  const span = Math.max(...along) - low || 1;
  charm.geometry.setAttribute("uv", new Float32BufferAttribute(along.flatMap((value) => [(value - low) / span, 0.5]), 2));

  /* film thickness is read from the green channel: a plain ramp from thinnest to thickest */
  const ramp = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) ramp[i * 4 + 1] = i;
  const thickness = new DataTexture(ramp, 256, 1);
  thickness.minFilter = thickness.magFilter = LinearFilter;
  thickness.needsUpdate = true;

  const metal = charm.material as MeshStandardMaterial;
  const film = new MeshPhysicalMaterial({
    color: "#e6e6e6",
    metalness: metal.metalness,
    roughness: metal.roughness,
    iridescence: 1,
    iridescenceIOR: 1.8,
    iridescenceThicknessMap: thickness,
    iridescenceThicknessMinimum: 250, // nm
    iridescenceThicknessMaximum: 450,
  });
  film.addEventListener("dispose", () => thickness.dispose());
  charm.material = film;
  metal.dispose();
}

/*
  Black metal: dark, but still bright enough in the reflections to read as metal. The puppy's
  chain and text share one material in the model, so both calls land on the same one.
*/
function makeBlackMetal(part: Mesh) {
  const metal = part.material as MeshStandardMaterial;
  metal.color.set("#4a4450");
  metal.metalness = 1;
  metal.roughness = 0.24;
}

/*
  The models the viewer can show. `finishes` are the looks set here instead of by the mod:
  its materials cannot describe a thin film, and the puppy's chain and text material is
  still an untouched default.
*/
export type ModelId = "necklace" | "puppy";

const MODELS: Record<ModelId, { source: string; finishes: Record<string, (mesh: Mesh) => void> }> = {
  /* mesh0 is the text, mesh1 the heart, mesh2 and mesh3 the chain */
  necklace: { source: "/christmas-market/necklace.glb", finishes: { mesh1: makeIridescent } },
  /* mesh0 is the text, mesh1 the bone, mesh2 the chain */
  puppy: {
    source: "/christmas-market/puppy.glb",
    finishes: { mesh0: makeBlackMetal, mesh1: makeIridescent, mesh2: makeBlackMetal },
  },
};

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
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "3D preview of a custom necklace. Drag it, or use the arrow keys, to turn it around.");
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
        const mesh = model.getObjectByName(name);
        if (mesh instanceof Mesh) finish(mesh);
      }

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
